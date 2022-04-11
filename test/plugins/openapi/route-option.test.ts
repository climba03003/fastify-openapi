import { openapiV3 } from '@apidevtools/openapi-schemas'
import Ajv from 'ajv-draft-04'
import AjvFormats from 'ajv-formats'
import DeepMerge from 'deepmerge'
import Fastify, { FastifySchema } from 'fastify'
import t from 'tap'
import { FastifyOpenAPI } from '../../../lib'
import { baseDocument, schemaBody, schemaConsumes, schemaCookies, schemaHeaders, schemaParams, schemaProduces, schemaQueryStrings, schemaResponse, schemaSecurity } from './options'
const ajv = new Ajv({ strict: false })
AjvFormats(ajv, { mode: 'full' })
const validate = ajv.compile(openapiV3)

function noop (): void {}

t.test('normal schema', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument
  })
  fastify.get('/', noop)
  fastify.post('/', noop)
  fastify.get('/example', { schema: schemaQueryStrings }, noop)
  fastify.post('/example', { schema: schemaBody }, noop)
  fastify.get('/parameters/:id', { schema: schemaParams }, noop)
  fastify.get('/headers', { schema: schemaHeaders }, noop)
  fastify.get('/headers/:id', { schema: DeepMerge<FastifySchema>(schemaParams, schemaHeaders) }, noop)
  fastify.get('/security', { schema: schemaSecurity }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
})

t.test('deprecated', async function (t) {
  t.plan(3)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument
  })

  const schema = {
    deprecated: true
  }

  fastify.get('/', { schema }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  const definedPath = fastify.openapi.documents.default.paths?.['/']?.get
  t.ok(definedPath)
  t.same(definedPath?.deprecated, schema.deprecated)
})

t.test('meta data', async function (t) {
  t.plan(9)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument
  })

  const schema = {
    tags: ['tag'],
    summary: 'Route summary',
    description: 'Route description',
    externalDocs: {
      description: 'Find more info here',
      url: 'https://swagger.io'
    },
    operationId: 'doSomething',
    callbacks: {
      notify: {
        '{$url}': {
          post: {
            responses: { 200: { description: 'Default Response' } }
          }
        }
      }
    },
    servers: [
      {
        url: 'https://localhost'
      }
    ]
  }

  fastify.get('/', { schema }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  const definedPath = fastify.openapi.documents.default.paths?.['/']?.get
  t.ok(definedPath)
  t.same(definedPath?.tags, schema.tags)
  t.equal(definedPath?.summary, schema.summary)
  t.equal(definedPath?.description, schema.description)
  t.same(definedPath?.externalDocs, schema.externalDocs)
  t.equal(definedPath?.operationId, schema.operationId)
  t.same(definedPath?.callbacks, schema.callbacks)
  t.same(definedPath?.servers, schema.servers)
})

t.test('consumes', async function (t) {
  t.plan(3)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument
  })

  const schema = DeepMerge<FastifySchema>(schemaBody, schemaConsumes)

  fastify.post('/', { schema }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  const definedPath = fastify.openapi.documents.default.paths?.['/']?.post
  t.ok(definedPath)
  t.same((definedPath?.requestBody as any)?.content, {
    'application/x-www-form-urlencoded': {
      schema: {
        type: 'object',
        properties: {
          hello: { type: 'string' },
          object: {
            type: 'object',
            properties: {
              world: { type: 'string' }
            }
          }
        },
        required: ['hello']
      }
    }
  })
})

t.test('produces', async function (t) {
  t.plan(3)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument
  })

  const schema = DeepMerge<FastifySchema>(schemaResponse, schemaProduces)

  fastify.get('/', { schema }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  const definedPath = fastify.openapi.documents.default.paths?.['/']?.get
  t.ok(definedPath)
  t.same((definedPath?.responses[200] as any).content, {
    '*/*': {
      schema: {
        type: 'object',
        properties: {
          hello: { type: 'string' }
        }
      }
    }
  })
})

t.test('cookies', async function (t) {
  t.plan(3)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument
  })

  fastify.get('/', { schema: schemaCookies }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  const definedPath = fastify.openapi.documents.default.paths?.['/']?.get
  t.ok(definedPath)
  t.same(definedPath?.parameters, [
    {
      required: false,
      in: 'cookie',
      name: 'foo',
      schema: {
        type: 'string'
      }
    },
    {
      required: false,
      in: 'cookie',
      name: 'bar',
      schema: {
        type: 'string'
      }
    }
  ])
})

t.test('extension', async function (t) {
  t.plan(4)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument,
    documents: { default: { 'x-ternal': true } }
  })

  const schema = DeepMerge<FastifySchema>(schemaHeaders, { 'x-tension': true })
  fastify.get('/', { schema }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  t.equal(fastify.openapi.documents.default['x-ternal'], true)
  const definedPath = fastify.openapi.documents.default.paths?.['/']?.get
  t.ok(definedPath)
  t.equal((definedPath as any)['x-tension'], true)
})

t.test('multiple methods', async function (t) {
  t.plan(3)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument
  })

  fastify.route({
    url: '/',
    method: ['GET', 'POST'],
    schema: schemaHeaders,
    handler: noop
  })
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  const definedPath = fastify.openapi.documents.default.paths?.['/']
  t.ok(definedPath?.get)
  t.ok(definedPath?.post)
})

t.test('extension', async function (t) {
  t.plan(4)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument,
    documents: { default: { 'x-ternal': true } }
  })

  const schema = DeepMerge<FastifySchema>(schemaHeaders, { 'x-tension': true })
  fastify.get('/', { schema }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  t.equal(fastify.openapi.documents.default['x-ternal'], true)
  const definedPath = fastify.openapi.documents.default.paths?.['/']?.get
  t.ok(definedPath)
  t.equal((definedPath as any)['x-tension'], true)
})

t.test('multiple methods', async function (t) {
  t.plan(3)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument
  })

  fastify.route({
    url: '/',
    method: ['GET', 'POST'],
    schema: schemaHeaders,
    handler: noop
  })
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  const definedPath = fastify.openapi.documents.default.paths?.['/']
  t.ok(definedPath?.get)
  t.ok(definedPath?.post)
})

t.test('description in parameters', async function (t) {
  // we must use t.match here, because `undefined` value should not affect the correctness of document
  t.plan(9)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument
  })

  const schemaCookies = {
    cookies: {
      type: 'object',
      properties: {
        foo: { type: 'string', description: 'Foo' }
      }
    }
  }

  const schemaHeaders = {
    headers: {
      type: 'object',
      properties: {
        foo: { type: 'string', description: 'Foo' }
      }
    }
  }

  const schemaQuerystring = {
    querystring: {
      type: 'object',
      properties: {
        hello: { type: 'string', description: 'Hello' }
      }
    }
  }

  const schemaParams = {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID' }
      }
    }
  }

  fastify.get('/', { schema: schemaCookies }, noop)
  fastify.post('/', { schema: schemaHeaders }, noop)
  fastify.get('/example', { schema: schemaQuerystring }, noop)
  fastify.get('/parameters/:id', { schema: schemaParams }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  const cookiesPath: any = fastify.openapi.documents.default.paths?.['/']?.get
  t.ok(cookiesPath)
  t.match(cookiesPath.parameters, [
    {
      required: false,
      in: 'cookie',
      name: 'foo',
      description: 'Foo',
      schema: {
        type: 'string'
      }
    }
  ])
  const headersPath: any = fastify.openapi.documents.default.paths?.['/']?.post
  t.ok(headersPath)
  t.match(headersPath.parameters, [
    {
      required: false,
      in: 'header',
      name: 'foo',
      description: 'Foo',
      schema: {
        type: 'string'
      }
    }
  ])
  const querystringPath: any = fastify.openapi.documents.default.paths?.['/example']?.get
  t.ok(querystringPath)
  t.match(querystringPath.parameters, [
    {
      required: false,
      in: 'query',
      name: 'hello',
      description: 'Hello',
      schema: {
        type: 'string'
      }
    }
  ])
  const paramPath: any = fastify.openapi.documents.default.paths?.['/parameters/{id}']?.get
  t.ok(paramPath)
  t.match(paramPath.parameters, [
    {
      required: true,
      in: 'path',
      name: 'id',
      description: 'ID',
      schema: {
        type: 'string'
      }
    }
  ])
})

t.test('content-type in parameters', async function (t) {
  // we must use t.match here, because `undefined` value should not affect the correctness of document
  t.plan(9)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument
  })

  const schemaCookies = {
    cookies: {
      type: 'object',
      properties: {
        foo: {
          type: 'object',
          description: 'Foo',
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' }
          },
          'x-consumes': ['application/json']
        }
      }
    }
  }

  const schemaHeaders = {
    headers: {
      type: 'object',
      properties: {
        foo: {
          type: 'object',
          description: 'Foo',
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' }
          },
          'x-consumes': ['application/json']
        }
      }
    }
  }

  const schemaQuerystring = {
    querystring: {
      type: 'object',
      properties: {
        hello: {
          type: 'object',
          description: 'Hello',
          properties: {
            hello: { type: 'string' },
            world: { type: 'string' }
          },
          'x-consumes': ['application/json']
        }
      }
    }
  }

  const schemaParams = {
    params: {
      type: 'object',
      properties: {
        foo: {
          type: 'object',
          description: 'Foo',
          properties: {
            foo: { type: 'string' },
            bar: { type: 'string' }
          },
          'x-consumes': ['application/json']
        }
      }
    }
  }

  fastify.get('/', { schema: schemaCookies }, noop)
  fastify.post('/', { schema: schemaHeaders }, noop)
  fastify.get('/example', { schema: schemaQuerystring }, noop)
  fastify.get('/parameters/:foo', { schema: schemaParams }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  const cookiesPath: any = fastify.openapi.documents.default.paths?.['/']?.get
  t.ok(cookiesPath)
  t.match(cookiesPath.parameters, [
    {
      required: false,
      in: 'cookie',
      name: 'foo',
      description: 'Foo',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' }
            }
          }
        }
      }
    }
  ])
  const headersPath: any = fastify.openapi.documents.default.paths?.['/']?.post
  t.ok(headersPath)
  t.match(headersPath.parameters, [
    {
      required: false,
      in: 'header',
      name: 'foo',
      description: 'Foo',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' }
            }
          }
        }
      }
    }
  ])
  const querystringPath: any = fastify.openapi.documents.default.paths?.['/example']?.get
  t.ok(querystringPath)
  t.match(querystringPath.parameters, [
    {
      required: false,
      in: 'query',
      name: 'hello',
      description: 'Hello',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              hello: { type: 'string' },
              world: { type: 'string' }
            }
          }
        }
      }
    }
  ])
  const paramPath: any = fastify.openapi.documents.default.paths?.['/parameters/{foo}']?.get
  t.ok(paramPath)
  t.match(paramPath.parameters, [
    {
      required: true,
      in: 'path',
      name: 'foo',
      description: 'Foo',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' }
            }
          }
        }
      }
    }
  ])
})

t.test('response links', async function (t) {
  // we must use t.match here, because `undefined` value should not affect the correctness of document
  t.plan(3)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument
  })

  const schemaUser = {
    params: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'the user identifier, as userId'
        }
      },
      required: ['id']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          uuid: {
            type: 'string',
            format: 'uuid'
          }
        },
        'x-links': {
          address: {
            operationId: 'getUserAddress',
            parameters: {
              id: '$request.path.id'
            }
          }
        }
      }
    }
  }

  const schemaUserAddress = {
    operationId: 'getUserAddress',
    params: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'the user identifier, as userId'
        }
      },
      required: ['id']
    },
    response: {
      200: {
        type: 'string'
      }
    }
  }

  fastify.get('/user/:id', { schema: schemaUser }, noop)
  fastify.get('/user/:id/address', { schema: schemaUserAddress }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  const definedPath: any = fastify.openapi.documents.default.paths?.['/user/{id}']?.get
  t.ok(definedPath)
  t.match(definedPath.responses['200'].links, {
    address: {
      operationId: 'getUserAddress',
      parameters: {
        id: '$request.path.id'
      }
    }
  })
})

t.test('response headers', async function (t) {
  // we must use t.match here, because `undefined` value should not affect the correctness of document
  t.plan(3)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument
  })

  const schemaUser = {
    params: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'the user identifier, as userId'
        }
      },
      required: ['id']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          uuid: {
            type: 'string',
            format: 'uuid'
          }
        },
        'x-headers': {
          'X-RateLimit-Limit': {
            schema: { type: 'integer' },
            description: 'Request limit per hour.'
          },
          'X-RateLimit-Remaining': {
            schema: { type: 'integer' },
            description: 'The number of requests left for the time window.'
          },
          'X-RateLimit-Reset': {
            schema: { type: 'string', format: 'date-time' },
            description: 'The UTC date/time at which the current rate limit window resets.'
          }
        }
      }
    }
  }

  fastify.get('/user/:id', { schema: schemaUser }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  const definedPath: any = fastify.openapi.documents.default.paths?.['/user/{id}']?.get
  t.ok(definedPath)
  t.match(definedPath.responses['200'].headers, {
    'X-RateLimit-Limit': {
      schema: { type: 'integer' },
      description: 'Request limit per hour.'
    },
    'X-RateLimit-Remaining': {
      schema: { type: 'integer' },
      description: 'The number of requests left for the time window.'
    },
    'X-RateLimit-Reset': {
      schema: { type: 'string', format: 'date-time' },
      description: 'The UTC date/time at which the current rate limit window resets.'
    }
  })
})

t.test('should ignore security headers', async function (t) {
  // we must use t.match here, because `undefined` value should not affect the correctness of document
  t.plan(7)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument
  })

  const schemaAddress1 = {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    },
    headers: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          description: 'api token'
        }
      }
    }
  }

  const schemaAddress2 = {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    },
    headers: {
      type: 'object',
      properties: {
        authKey: {
          type: 'string',
          description: 'auth token'
        }
      }
    }
  }

  fastify.get('/address1/:id', { schema: schemaAddress1 }, noop)
  fastify.get('/address2/:id', { schema: schemaAddress2 }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  const address1Path: any = fastify.openapi.documents.default.paths?.['/address1/{id}']?.get
  t.ok(address1Path)
  t.ok(address1Path.parameters.find(({ name }: any) => (name === 'id')))
  t.notOk(address1Path.parameters.find(({ name }: any) => (name === 'apiKey')))
  const address2Path: any = fastify.openapi.documents.default.paths?.['/address2/{id}']?.get
  t.ok(address2Path)
  t.ok(address2Path.parameters.find(({ name }: any) => (name === 'id')))
  t.ok(address2Path.parameters.find(({ name }: any) => (name === 'authKey')))
})

t.test('should ignore security querystrings', async function (t) {
  // we must use t.match here, because `undefined` value should not affect the correctness of document
  t.plan(7)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument,
    documents: {
      default: {
        components: {
          securitySchemes: {
            apiKey: {
              type: 'apiKey',
              name: 'apiKey',
              in: 'query'
            }
          }
        }
      }
    }
  })

  const schemaAddress1 = {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    },
    querystring: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          description: 'api token'
        }
      }
    }
  }

  const schemaAddress2 = {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    },
    querystring: {
      type: 'object',
      properties: {
        authKey: {
          type: 'string',
          description: 'auth token'
        }
      }
    }
  }

  fastify.get('/address1/:id', { schema: schemaAddress1 }, noop)
  fastify.get('/address2/:id', { schema: schemaAddress2 }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  const address1Path: any = fastify.openapi.documents.default.paths?.['/address1/{id}']?.get
  t.ok(address1Path)
  t.ok(address1Path.parameters.find(({ name }: any) => (name === 'id')))
  t.notOk(address1Path.parameters.find(({ name }: any) => (name === 'apiKey')))
  const address2Path: any = fastify.openapi.documents.default.paths?.['/address2/{id}']?.get
  t.ok(address2Path)
  t.ok(address2Path.parameters.find(({ name }: any) => (name === 'id')))
  t.ok(address2Path.parameters.find(({ name }: any) => (name === 'authKey')))
})

t.test('should ignore security cookies', async function (t) {
  // we must use t.match here, because `undefined` value should not affect the correctness of document
  t.plan(7)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    document: baseDocument,
    documents: {
      default: {
        components: {
          securitySchemes: {
            apiKey: {
              type: 'apiKey',
              name: 'apiKey',
              in: 'cookie'
            }
          }
        }
      }
    }
  })

  const schemaAddress1 = {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    },
    cookies: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          description: 'api token'
        }
      }
    }
  }

  const schemaAddress2 = {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    },
    cookies: {
      type: 'object',
      properties: {
        authKey: {
          type: 'string',
          description: 'auth token'
        }
      }
    }
  }

  fastify.get('/address1/:id', { schema: schemaAddress1 }, noop)
  fastify.get('/address2/:id', { schema: schemaAddress2 }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
  const address1Path: any = fastify.openapi.documents.default.paths?.['/address1/{id}']?.get
  t.ok(address1Path)
  t.ok(address1Path.parameters.find(({ name }: any) => (name === 'id')))
  t.notOk(address1Path.parameters.find(({ name }: any) => (name === 'apiKey')))
  const address2Path: any = fastify.openapi.documents.default.paths?.['/address2/{id}']?.get
  t.ok(address2Path)
  t.ok(address2Path.parameters.find(({ name }: any) => (name === 'id')))
  t.ok(address2Path.parameters.find(({ name }: any) => (name === 'authKey')))
})
