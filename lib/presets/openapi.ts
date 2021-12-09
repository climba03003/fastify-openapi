import { FastifyInstance, RouteOptions } from 'fastify'
import { convertJSONSchemaToParameterArray, ParameterSchema } from '../utils/transform'

export function prepareFullDocument (this: FastifyInstance, bucket: Map<{ method: string, path: string }, any[]>): any {
  const options = this.openapi.document
  const document: any = {
    openapi: '3.0.3',
    info: {
      version: '0.0.0',
      title: ''
    },
    paths: {}
  }

  for (const [key, value] of bucket.entries()) {
    if (document.paths[key.path] === undefined) document.paths[key.path] = {}
    document.paths[key.path][key.method.toLowerCase()] = value[0]
  }

  if (typeof options.openapi !== 'undefined') document.openapi = options.openapi
  if (typeof options.info !== 'undefined') document.info = { ...document.info, ...options.info }
  if (typeof options.servers !== 'undefined') document.servers = options.servers
  if (typeof options.paths !== 'undefined') document.paths = { ...document.info, ...options.paths }
  if (typeof options.components !== 'undefined') document.components = options.components
  if (typeof options.security !== 'undefined') document.security = options.security
  if (typeof options.tags !== 'undefined') document.tags = options.tags
  if (typeof options.externalDocs !== 'undefined') document.security = options.externalDocs

  return document
}

export function transformPath (this: FastifyInstance, method: string, path: string, options: RouteOptions): any {
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
        parameters.push(this.openapi.transform.transformParam.call(this, method, path, params[i]))
      }
    }
    if (schema.querystring !== undefined) {
      const queryies = convertJSONSchemaToParameterArray(schema.querystring)
      for (let i = 0; i < queryies.length; i++) {
        parameters.push(this.openapi.transform.transformQuery.call(this, method, path, queryies[i]))
      }
    }
    if (schema.headers !== undefined) {
      const headers = convertJSONSchemaToParameterArray(schema.headers)
      for (let i = 0; i < headers.length; i++) {
        parameters.push(this.openapi.transform.transformHeader.call(this, method, path, headers[i]))
      }
    }
    if (schema.cookies !== undefined) {
      const cookies = convertJSONSchemaToParameterArray(schema.cookies)
      for (let i = 0; i < cookies.length; i++) {
        parameters.push(this.openapi.transform.transformCookie.call(this, method, path, cookies[i]))
      }
    }
    if (schema.body !== undefined) {
      pathSchema.requestBody = this.openapi.transform.transformBody.call(this, method, path, schema.consumes, schema.body)
    }
    if (schema.response !== undefined) {
      pathSchema.responses = this.openapi.transform.transformResponse.call(this, method, path, schema.produces, schema.response)
    }
    if (schema.callbacks !== undefined) pathSchema.callbacks = schema.callbacks
    if (schema.deprecated !== undefined) pathSchema.deprecated = schema.deprecated
    if (schema.security !== undefined) pathSchema.security = schema.security
    if (schema.servers !== undefined) pathSchema.servers = schema.servers
  }

  return pathSchema
}

export function transformQuery (this: FastifyInstance, _method: string, _path: string, schema: ParameterSchema): any {
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

export function transformParam (this: FastifyInstance, _method: string, _path: string, schema: ParameterSchema): any {
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

export function transformHeader (this: FastifyInstance, _method: string, _path: string, schema: ParameterSchema): any {
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

export function transformCookie (this: FastifyInstance, _method: string, _path: string, schema: ParameterSchema): any {
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

export function transformBody (this: FastifyInstance, _method: string, _path: string, consumes: string[], schema: any): any {
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

export function transformResponse (this: FastifyInstance, _method: string, _path: string, produces: string[], schema: any): any {
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
