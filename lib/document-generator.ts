import { type FastifyBaseLogger, type RouteOptions } from 'fastify'
import { type OpenAPIV3, type OpenAPIV3_1 } from 'openapi-types'
import RFDC from 'rfdc'
import { kDocumentBucket, kInternal, kRouteBucket, type kDocumentGenerator } from './symbols'
import { mergeDocument, type DocumentGeneratorHookName, type MergeDocumentFunc, type OnBodyHookFunc, type OnCookieHookFunc, type OnHeaderHookFunc, type OnParamHookFunc, type OnPathHookFunc, type OnQueryHookFunc, type OnRefResolveHookFunc, type OnResponseHookFunc, type OnTransformHookFunc, type RouteBelongToFunc } from './utils/hooks'
import { normalizePath } from './utils/path'
import { computeSecurityIgnore } from './utils/security'

// we clone the route options to prevent, unexpect mutation
const clone = RFDC()

declare module 'fastify' {
  interface FastifyInstance {
    [kDocumentGenerator]: DocumentGenerator
  }
}

export type DocumentGeneratorPlugin = (generator: DocumentGenerator) => void

export interface DocumentGeneratorOption {
  log?: FastifyBaseLogger
  // base document
  document: Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>
  // if you need to use different base document for different role
  documents: Record<string, Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>>
  routeBelongTo: RouteBelongToFunc
}

interface RouteBucketKey { method: string, path: string, document: string }
type RouteBucket = Map<RouteBucketKey, RouteOptions[]>
type OperationBucket = Map<RouteBucketKey, OpenAPIV3.OperationObject[]>
type DocumentBucket = Map<string, OperationBucket>

export class DocumentGenerator {
  [kInternal]: {
    // we defined all the hook
    onPath: OnPathHookFunc[]
    onQuery: OnQueryHookFunc[]
    onParam: OnParamHookFunc[]
    onHeader: OnHeaderHookFunc[]
    onCookie: OnCookieHookFunc[]
    onBody: OnBodyHookFunc[]
    onResponse: OnResponseHookFunc[]
    // it is used for ref resolve
    onRefResolve: OnRefResolveHookFunc[]
    // it is used for transform schema
    onTransform: OnTransformHookFunc[]

    // used to store all routes
    routes: any[]
    // used to store all schemas
    schemas: Map<string, any>
    // we accept
    log: FastifyBaseLogger
    // base document
    document: Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>
    // if you need to use different base document for different role
    documents: Record<string, Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>>

    routeBelongTo: RouteBelongToFunc
    mergeDocument: MergeDocumentFunc
  }

  [kRouteBucket]: RouteBucket
  [kDocumentBucket]: DocumentBucket
  documents: Record<string, OpenAPIV3.Document | OpenAPIV3_1.Document>

  constructor (option: DocumentGeneratorOption) {
    this[kInternal] = {
      onPath: [],
      onQuery: [],
      onParam: [],
      onHeader: [],
      onCookie: [],
      onBody: [],
      onResponse: [],
      onRefResolve: [],
      onTransform: [],
      routes: [],
      schemas: new Map(),
      log: option.log ?? console as any,
      document: option.document,
      documents: option.documents,
      routeBelongTo: option.routeBelongTo,
      // do not allow to override at this stage
      mergeDocument
    }
    this[kRouteBucket] = new Map()
    this[kDocumentBucket] = new Map()
    this.documents = Object.create(null)
  }

  /**
   * Push function inside desire hook.
   * @param {string} name hook name
   * @param {Function} fn hook function
   * @returns {DocumentGenerator} this
   */
  addHook (name: 'onPath', fn: OnPathHookFunc): this
  addHook (name: 'onQuery', fn: OnQueryHookFunc): this
  addHook (name: 'onParam', fn: OnParamHookFunc): this
  addHook (name: 'onHeader', fn: OnHeaderHookFunc): this
  addHook (name: 'onCookie', fn: OnCookieHookFunc): this
  addHook (name: 'onBody', fn: OnBodyHookFunc): this
  addHook (name: 'onResponse', fn: OnResponseHookFunc): this
  addHook (name: 'onRefResolve', fn: OnRefResolveHookFunc): this
  addHook (name: 'onTransform', fn: OnTransformHookFunc): this
  addHook (name: DocumentGeneratorHookName, fn: (...args: any[]) => any): this {
    this[kInternal][name].push(fn)
    return this
  }

  /**
   * Unshift (prepend) function inside desire hook.
   * @param {string} name hook name
   * @param {Function} fn hook function
   * @returns {DocumentGenerator} this
   */
  unshiftHook (name: 'onPath', fn: OnPathHookFunc): this
  unshiftHook (name: 'onQuery', fn: OnQueryHookFunc): this
  unshiftHook (name: 'onParam', fn: OnParamHookFunc): this
  unshiftHook (name: 'onHeader', fn: OnHeaderHookFunc): this
  unshiftHook (name: 'onCookie', fn: OnCookieHookFunc): this
  unshiftHook (name: 'onBody', fn: OnBodyHookFunc): this
  unshiftHook (name: 'onResponse', fn: OnResponseHookFunc): this
  unshiftHook (name: 'onRefResolve', fn: OnRefResolveHookFunc): this
  unshiftHook (name: 'onTransform', fn: OnTransformHookFunc): this
  unshiftHook (name: DocumentGeneratorHookName, fn: (...args: any[]) => any): this {
    this[kInternal][name].unshift(fn)
    return this
  }

  runHook (name: DocumentGeneratorHookName, schema: any, additionalInformation: any): any {
    const o = clone(schema)
    let result = o
    for (const onHook of this[kInternal][name]) {
      result = onHook(this, result, o, additionalInformation)
    }
    return result
  }

  /**
   * Push route option registered.
   * @param {RouteOptions} route route option
   * @returns {DocumentGenerator}
   */
  addRoute (route: RouteOptions): this {
    // we do not clone at this stage
    // because it may be mutated by "onRoute" hook
    this[kInternal].routes.push(route)
    return this
  }

  /**
   * Push schema to store.
   * @param {string} id schema id (it must be unique)
   * @param {object} schema json-schema
   * @returns {DocumentGenerator} this
   */
  addSchema (id: string, schema: any): this {
    // we give up duplicate id schema
    if (this[kInternal].schemas.has(id)) {
      this[kInternal].log.warn(`Duplicate schema id "${id}" is found.\nCurrently, we do not support same id with encapsulation.\nPlease use an unique id for each schema.`)
      return this
    }
    this[kInternal].schemas.set(id, schema)
    return this
  }

  /**
   * Push schemas with id-schema pairs.
   * @param {object} schemas id-schema pairs
   * @returns {DocumentGenerator} this
   */
  addSchemas (schemas: Record<string, any>): this {
    const entries = Object.entries(schemas)
    for (const [id, schema] of entries) {
      this.addSchema(id, schema)
    }
    return this
  }

  /**
   * Get schema by unique id.
   * @param {string} id schema id
   * @returns {DocumentGenerator} this
   */
  getSchema (id: string): any {
    return this[kInternal].schemas.get(id)
  }

  /**
   * Resolve schema by $ref property
   * e.g. ID#, ID#xxx/xxx
   *
   * We do not care if the ID is urn, uri, name, etc.
   * Because it should be the $id before any # according
   * to spec.
   * @param {string} ref schema $ref field value
   * @returns {object} referenced schema
   */
  getSchemaFromRef (ref: string): any {
    // check if the id match what we needs
    const sharpIndex = ref.indexOf('#')
    if (sharpIndex === -1 || sharpIndex === 0) return
    const id = ref.split('#').shift() as string
    return this.getSchema(id)
  }

  /**
   * Apply plugin to this instance
   * @param {Function} fn plugin function
   * @returns {DocumentGenerator} this
   */
  plugin (fn: DocumentGeneratorPlugin): this {
    fn(this)
    return this
  }

  prepareRouteBucket (): void {
    const bucket = this[kRouteBucket]
    bucket.clear()

    for (const route of this[kInternal].routes) {
      const documents = this[kInternal].routeBelongTo(route)
      const methods: string[] = Array.isArray(route.method) ? route.method : [route.method]
      // we normalize the url into openapi standard
      const path = normalizePath(route.url)
      for (const method of methods) {
        for (const document of documents) {
          const key = { method, path, document }
          if (bucket.has(key)) {
            bucket.get(key)?.push(clone(route))
          } else {
            bucket.set(key, [clone(route)])
          }
        }
      }
    }
  }

  prepareDocumentBucket (): void {
    const bucket = this[kDocumentBucket]
    bucket.clear()
    for (const [key, routes] of this[kRouteBucket].entries()) {
      if (!bucket.has(key.document)) bucket.set(key.document, new Map())
      const operationBucket = bucket.get(key.document) as Map<RouteBucketKey, unknown[]>
      const temp = []
      for (const route of routes) {
        // if hide is true, it should exclude in all document
        if (route.schema?.hide === true) continue
        // if hide is array, it should exclude in the specified document
        if (Array.isArray(route.schema?.hide) && (route.schema?.hide as string[])?.includes(key.document)) continue
        temp.push(route)
      }
      // only set when the key have route
      if (temp.length > 0) operationBucket.set(key, temp)
    }
  }

  generate (): void {
    // we prepare and exclude all the unwanted route first
    this.prepareRouteBucket()
    this.prepareDocumentBucket()

    for (const [name, operationBucket] of this[kDocumentBucket].entries()) {
      // we prepare the base document
      const document: any = this[kInternal].mergeDocument(name, this[kInternal].document, this[kInternal].documents?.[name])
      for (const [key, routes] of operationBucket.entries()) {
        const temp: any[] = []
        for (const route of routes) {
          // we need to create the security key array first
          // because some key should not exist on both `header`, `cookie`, `querystring` and security
          const securityIngore = computeSecurityIgnore(document.security, route.security, document.components?.securitySchemes)
          temp.push(this.runHook('onPath', route, { method: key.method, path: key.path, securityIngore }))
        }
        operationBucket.set(key, temp)
      }

      for (const [key, value] of operationBucket.entries()) {
        if (document.paths[key.path] === undefined) document.paths[key.path] = {}
        document.paths[key.path][key.method.toLowerCase()] = value[0]
      }

      this.documents[name] = document
    }
  }
}
