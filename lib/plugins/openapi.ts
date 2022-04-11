import { DocumentGeneratorPlugin } from '../document-generator'
import { convertJSONSchemaToParameterArray } from '../utils/parameter'

export const OpenAPIPlugin: DocumentGeneratorPlugin = function (instance) {
  instance.addHook('onPath', function (that, route, _, info) {
    const { method, path, securityIngore } = info
    const parameters: any[] = []
    const pathSchema: any = { }
    const schema = route.schema
    if (schema !== undefined) {
      // we copy most of the property that do not need to mutate
      if (schema.tags !== undefined) pathSchema.tags = schema.tags
      if (schema.summary !== undefined) pathSchema.summary = schema.summary
      if (schema.description !== undefined) pathSchema.description = schema.description
      if (schema.externalDocs !== undefined) pathSchema.externalDocs = schema.externalDocs
      if (schema.operationId !== undefined) pathSchema.operationId = schema.operationId
      if (schema.params !== undefined) {
        const params = convertJSONSchemaToParameterArray(that, that.runHook('onTransform', schema.params, { method, path, position: 'param' }))
        for (let i = 0; i < params.length; i++) {
          parameters.push(that.runHook('onParam', params[i], { method, path, securityIngore }))
        }
      }
      if (schema.querystring !== undefined) {
        const querystring = convertJSONSchemaToParameterArray(that, that.runHook('onTransform', schema.querystring, { method, path, position: 'querystring' }))
        for (let i = 0; i < querystring.length; i++) {
          parameters.push(that.runHook('onQuery', querystring[i], { method, path, securityIngore }))
        }
      }
      if (schema.headers !== undefined) {
        const headers = convertJSONSchemaToParameterArray(that, that.runHook('onTransform', schema.headers, { method, path, position: 'header' }))
        for (let i = 0; i < headers.length; i++) {
          parameters.push(that.runHook('onHeader', headers[i], { method, path, securityIngore }))
        }
      }
      if (schema.cookies !== undefined) {
        const cookies = convertJSONSchemaToParameterArray(that, that.runHook('onTransform', schema.cookies, { method, path, position: 'cookie' }))
        for (let i = 0; i < cookies.length; i++) {
          parameters.push(that.runHook('onCookie', cookies[i], { method, path, securityIngore }))
        }
      }
      if (schema.body !== undefined) {
        pathSchema.requestBody = that.runHook('onBody', that.runHook('onTransform', schema.body, { method, path, position: 'body' }), { method, path, consumes: schema.consumes })
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
    pathSchema.responses = that.runHook('onResponse', schema?.response, { method, path, produces: schema?.produces })

    return pathSchema
  })

  instance.addHook('onQuery', function (_, schema) {
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
  })

  instance.addHook('onParam', function (_, schema) {
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
  })

  instance.addHook('onHeader', function (_, schema) {
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
  })
  instance.addHook('onCookie', function (_, schema) {
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
  })

  instance.addHook('onBody', function (_, schema: any, _oSchema, info) {
    let { consumes } = info
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
  })

  instance.addHook('onResponse', function (that, schema: any, _oSchema, info) {
    let { produces } = info
    // we ensure produces at least has `application/json`
    produces = Array.isArray(produces) && produces.length > 0 ? produces : ['application/json']
    // if no response is provided
    if (typeof schema !== 'object') return { 200: { description: 'Default Response' } }
    const responses: any = {}
    const statusCodes = Object.keys(schema)
    for (let statusCode of statusCodes) {
      const subSchema = that.runHook('onTransform', schema[statusCode], { method: info.method, path: info.path, position: 'response' })
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
  })
}
