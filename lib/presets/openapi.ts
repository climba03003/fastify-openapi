import deepMerge from 'deepmerge'
import { MergeDocumentFunc, PrepareFullDocumentFunc, TransformBodyFunc, TransformCookieFunc, TransformHeaderFunc, TransformParamFunc, TransformPathFunc, TransformQueryFunc, TransformResponseFunc } from '../utils/options'
import { convertJSONSchemaToParameterArray } from '../utils/transform'

function hotfix (schema: any, k?: string): any {
  // we loop through array of allOf, anyOf and oneOf first
  if ('allOf' in schema) {
    schema.allOf = schema.allOf.map((o: any) => hotfix(o))
  }
  if ('anyOf' in schema) {
    schema.anyOf = schema.anyOf.map((o: any) => hotfix(o))
  }
  if ('oneOf' in schema) {
    schema.oneOf = schema.oneOf.map((o: any) => hotfix(o))
  }
  // it is a normal object
  // we loop through key-value
  if (schema.type === 'object' && 'properties' in schema) {
    Object.keys(schema.properties).forEach(function (key) {
      schema.properties[key] = hotfix(schema.properties[key], key)
    })
  }
  // it is a normal array
  // we loop through value
  if (schema.type === 'array' && 'items' in schema) {
    schema.items = hotfix(schema.items)
  }
  typeboxEnumHotfix(schema, k)
  return schema
}

function typeboxEnumHotfix (schema: any, key?: string): any {
  // it is a object with properties
  if (schema.type === 'string' && 'anyOf' in schema) {
    schema.title = key ?? 'Enum'
    schema.enum = []
    schema.anyOf.forEach(function (o: any) {
      schema.enum.push(o.const)
    })
    delete schema.anyOf
  }
}

export const mergeDocument: MergeDocumentFunc = function (_name, base, document) {
  const dummy: any = {
    openapi: '3.0.3',
    info: {
      version: '0.0.0',
      title: ''
    },
    paths: {}
  }

  // allow non-exist base and document
  return deepMerge.all([dummy, base ?? {}, document ?? {}])
}

export const prepareFullDocument: PrepareFullDocumentFunc = function (_name, document: any, bucket) {
  for (const [key, value] of bucket.entries()) {
    if (document.paths[key.path] === undefined) document.paths[key.path] = {}
    document.paths[key.path][key.method.toLowerCase()] = value[0]
  }
  return document
}

export const transformPath: TransformPathFunc = function (transform, method, path, options, securityIgnore) {
  const parameters: any[] = []
  const pathSchema: any = { }
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
        if (securityIgnore.query?.includes(queryies[i].name)) continue
        parameters.push(transform.transformQuery(method, path, queryies[i]))
      }
    }
    if (schema.headers !== undefined) {
      const headers = convertJSONSchemaToParameterArray(schema.headers)
      for (let i = 0; i < headers.length; i++) {
        if (securityIgnore.header?.includes(headers[i].name)) continue
        parameters.push(transform.transformHeader(method, path, headers[i]))
      }
    }
    if (schema.cookies !== undefined) {
      const cookies = convertJSONSchemaToParameterArray(schema.cookies)
      for (let i = 0; i < cookies.length; i++) {
        if (securityIgnore.cookie?.includes(cookies[i].name)) continue
        parameters.push(transform.transformCookie(method, path, cookies[i]))
      }
    }
    if (schema.body !== undefined) {
      pathSchema.requestBody = transform.transformBody(method, path, schema.consumes, schema.body)
    }
    if (schema.callbacks !== undefined) pathSchema.callbacks = schema.callbacks
    if (schema.deprecated !== undefined) pathSchema.deprecated = schema.deprecated
    if (schema.security !== undefined) pathSchema.security = schema.security
    if (schema.servers !== undefined) pathSchema.servers = schema.servers
    // allow `x-` prefix extension
    for (const key of Object.keys(schema)) {
      if (key.startsWith('x-')) { pathSchema[key] = (schema as any)[key] }
    }
  }

  // only add parameters when it exist
  if (parameters.length > 0) pathSchema.parameters = parameters
  // response must exist
  pathSchema.responses = transform.transformResponse(method, path, schema?.produces, schema?.response)

  return pathSchema
}

export const transformQuery: TransformQueryFunc = function (_method, _path, schema) {
  const o: any = {
    in: 'query',
    name: schema.name,
    required: schema.required,
    ...schema.expand
  }
  if (typeof schema.schema.description === 'string') {
    o.description = schema.schema.description
    schema.schema.description = undefined
  }
  // when consumes exist, we put the schema inside content
  if (schema.consumes.length > 0) {
    o.content = {}
    for (const consume of schema.consumes) {
      o.content[consume] = { schema: schema.schema }
    }
  } else {
    o.schema = schema.schema
  }
  return o
}

export const transformParam: TransformParamFunc = function (_method, _path, schema) {
  const o: any = {
    in: 'path',
    name: schema.name,
    required: true,
    ...schema.expand
  }
  if (typeof schema.schema.description === 'string') {
    o.description = schema.schema.description
    schema.schema.description = undefined
  }
  // when consumes exist, we put the schema inside content
  if (schema.consumes.length > 0) {
    o.content = {}
    for (const consume of schema.consumes) {
      o.content[consume] = { schema: schema.schema }
    }
  } else {
    o.schema = schema.schema
  }
  return o
}

export const transformHeader: TransformHeaderFunc = function (_method, _path, schema) {
  const o: any = {
    in: 'header',
    name: schema.name,
    required: schema.required,
    ...schema.expand
  }
  if (typeof schema.schema.description === 'string') {
    o.description = schema.schema.description
    schema.schema.description = undefined
  }
  // when consumes exist, we put the schema inside content
  if (schema.consumes.length > 0) {
    o.content = {}
    for (const consume of schema.consumes) {
      o.content[consume] = { schema: schema.schema }
    }
  } else {
    o.schema = schema.schema
  }
  return o
}

export const transformCookie: TransformCookieFunc = function (_method, _path, schema) {
  const o: any = {
    in: 'cookie',
    name: schema.name,
    required: schema.required,
    ...schema.expand
  }
  if (typeof schema.schema.description === 'string') {
    o.description = schema.schema.description
    schema.schema.description = undefined
  }
  // when consumes exist, we put the schema inside content
  if (schema.consumes.length > 0) {
    o.content = {}
    for (const consume of schema.consumes) {
      o.content[consume] = { schema: schema.schema }
    }
  } else {
    o.schema = schema.schema
  }
  return o
}

export const transformBody: TransformBodyFunc = function (_method, _path, consumes, schema: any) {
  schema = hotfix(schema)
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
  const responses: any = {}
  const statusCodes = Object.keys(schema)
  for (let statusCode of statusCodes) {
    const subSchema = hotfix(schema[statusCode])
    // if the status code is not `default`, we need to be upper-case
    if (statusCode !== 'default') statusCode = statusCode.toUpperCase()
    responses[statusCode] = {
      description: subSchema['x-description'] ?? subSchema.description ?? `${statusCode} Response`,
      content: {}
    }
    // object property should be added when it exist only
    if (typeof subSchema['x-headers'] === 'object') responses[statusCode].headers = subSchema['x-headers']
    if (typeof subSchema['x-links'] === 'object') responses[statusCode].links = subSchema['x-links']

    for (const produce of produces) {
      responses[statusCode].content[produce] = { schema: subSchema }
    }
  }
  return responses
}

export const OpenAPIPreset = { mergeDocument, prepareFullDocument, transformBody, transformCookie, transformHeader, transformParam, transformPath, transformQuery, transformResponse }
