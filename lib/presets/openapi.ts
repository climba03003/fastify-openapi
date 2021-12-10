import deepMerge from 'deepmerge'
import { FastifyInstance } from 'fastify'
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { PrepareFullDocumentFunc, TransformBodyFunc, TransformCookieFunc, TransformHeaderFunc, TransformParamFunc, TransformPathFunc, TransformQueryFunc, TransformResponseFunc } from '../utils/options'
import { convertJSONSchemaToParameterArray } from '../utils/transform'

export function mergeDocument (this: FastifyInstance, _name: string, base: Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>, document: Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>): Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document> {
  const dummy: any = {
    openapi: '3.0.3',
    info: {
      version: '0.0.0',
      title: ''
    },
    paths: {}
  }

  return deepMerge.all([dummy, base, document])
}

export const prepareFullDocument: PrepareFullDocumentFunc = function (_name, document: any, bucket) {
  for (const [key, value] of bucket.entries()) {
    if (document.paths[key.path] === undefined) document.paths[key.path] = {}
    document.paths[key.path][key.method.toLowerCase()] = value[0]
  }
  return document
}

export const transformPath: TransformPathFunc = function (transform, method, path, options) {
  const parameters: any[] = []
  const pathSchema: any = { parameters }
  const schema = options.schema
  if (schema !== undefined) {
    // we copy most of the property that do not need to mutate
    if (schema.tags !== undefined) pathSchema.tags = schema.tags
    if (schema.summary !== undefined) pathSchema.summary = schema.summary
    if (schema.description !== undefined) pathSchema.description = schema.description
    if (schema.externalDocs !== undefined) pathSchema.externalDocs = schema.externalDocs
    if (schema.operationId !== undefined) pathSchema.operationId = schema.operationId
    if (schema.params !== undefined) {
      const params = convertJSONSchemaToParameterArray(schema.params)
      for (let i = 0; i < params.length; i++) {
        parameters.push(transform.transformParam(method, path, params[i]))
      }
    }
    if (schema.querystring !== undefined) {
      const queryies = convertJSONSchemaToParameterArray(schema.querystring)
      for (let i = 0; i < queryies.length; i++) {
        parameters.push(transform.transformQuery(method, path, queryies[i]))
      }
    }
    if (schema.headers !== undefined) {
      const headers = convertJSONSchemaToParameterArray(schema.headers)
      for (let i = 0; i < headers.length; i++) {
        parameters.push(transform.transformHeader(method, path, headers[i]))
      }
    }
    if (schema.cookies !== undefined) {
      const cookies = convertJSONSchemaToParameterArray(schema.cookies)
      for (let i = 0; i < cookies.length; i++) {
        parameters.push(transform.transformCookie(method, path, cookies[i]))
      }
    }
    if (schema.body !== undefined) {
      pathSchema.requestBody = transform.transformBody(method, path, schema.consumes, schema.body)
    }
    if (schema.response !== undefined) {
      pathSchema.responses = transform.transformResponse(method, path, schema.produces, schema.response)
    }
    if (schema.callbacks !== undefined) pathSchema.callbacks = schema.callbacks
    if (schema.deprecated !== undefined) pathSchema.deprecated = schema.deprecated
    if (schema.security !== undefined) pathSchema.security = schema.security
    if (schema.servers !== undefined) pathSchema.servers = schema.servers
  }

  return pathSchema
}

export const transformQuery: TransformQueryFunc = function (_method, _path, schema) {
  const o: any = {
    in: 'query',
    name: schema.name,
    required: schema.required,
    schema: schema.schema,
    ...schema.expand
  }
  if (typeof schema.schema.description === 'string') {
    schema.schema.description = undefined
    o.description = schema.schema.description
  }
  return o
}

export const transformParam: TransformParamFunc = function (_method, _path, schema) {
  const o: any = {
    in: 'path',
    name: schema.name,
    required: true,
    schema: schema.schema,
    ...schema.expand
  }
  if (typeof schema.schema.description === 'string') {
    schema.schema.description = undefined
    o.description = schema.schema.description
  }
  return o
}

export const transformHeader: TransformHeaderFunc = function (_method, _path, schema) {
  const o: any = {
    in: 'header',
    name: schema.name,
    required: schema.required,
    schema: schema.schema,
    ...schema.expand
  }
  if (typeof schema.schema.description === 'string') {
    schema.schema.description = undefined
    o.description = schema.schema.description
  }
  return o
}

export const transformCookie: TransformCookieFunc = function (_method, _path, schema) {
  const o: any = {
    in: 'cookie',
    name: schema.name,
    required: schema.required,
    schema: schema.schema,
    ...schema.expand
  }
  if (typeof schema.schema.description === 'string') {
    schema.schema.description = undefined
    o.description = schema.schema.description
  }
  return o
}

export const transformBody: TransformBodyFunc = function (_method, _path, consumes, schema: any) {
  // we ensure consumes at least has `application/json`
  consumes = Array.isArray(consumes) && consumes.length > 0 ? consumes : ['application/json']
  const content: any = {}
  const examples: any[] = []
  const extra: any = {}
  // we compute the example
  if (Array.isArray(schema.examples)) {
    for (const [index, example] of schema.examples) {
      examples.push({
        name: example['x-name'] ?? `example${String(index)}`,
        summary: example['x-summary'],
        description: example['x-description'],
        value: example,
        externalValue: example['x-external-value']
      })
    }
  }
  if (examples.length === 1) {
    extra.example = examples[0]
  } else if (examples.length > 1) {
    extra.examples = {}
    for (const example of examples) {
      extra.examples[example.name] = example
    }
  }

  for (const consume of consumes) {
    content[consume] = {
      schema,
      ...extra
    }
  }
  return {
    description: schema['x-description'],
    content: content,
    required: schema['x-required']
  }
}

export const transformResponse: TransformResponseFunc = function (_method, _path, produces, schema: any) {
  // we ensure produces at least has `application/json`
  produces = Array.isArray(produces) && produces.length > 0 ? produces : ['application/json']
  // if no response is provided
  if (typeof schema !== 'object') return { 200: { description: 'Default Response' } }
  const response: any = {
    description: schema['x-description']
  }
  const statusCodes = Object.keys(schema)
  for (let statusCode of statusCodes) {
    const subSchema = schema[statusCode]
    // if the status code is not `default`, we need to be upper-case
    if (statusCode !== 'default') statusCode = statusCode.toUpperCase()
    response[statusCode] = {
      description: subSchema['x-description'] ?? subSchema.description ?? `${statusCode} Response`,
      headers: subSchema['x-headers'] ?? {},
      content: {},
      links: subSchema['x-links'] ?? {}
    }
    for (const produce of produces) {
      response[statusCode].content[produce] = { schema: subSchema }
    }
  }
  return response
}
