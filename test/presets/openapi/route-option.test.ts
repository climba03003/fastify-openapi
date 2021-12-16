import { openapiV3 } from '@apidevtools/openapi-schemas'
import Ajv from 'ajv-draft-04'
import AjvFormats from 'ajv-formats'
import DeepMerge from 'deepmerge'
import Fastify from 'fastify'
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
    preset: 'openapi',
    document: baseDocument
  })
  fastify.get('/', noop)
  fastify.post('/', noop)
  fastify.get('/example', { schema: schemaQueryStrings }, noop)
  fastify.post('/example', { schema: schemaBody }, noop)
  fastify.get('/parameters/:id', { schema: schemaParams }, noop)
  fastify.get('/headers', { schema: schemaHeaders }, noop)
  fastify.get('/headers/:id', { schema: DeepMerge(schemaParams, schemaHeaders) }, noop)
  fastify.get('/security', { schema: schemaSecurity }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
})

t.test('deprecated', async function (t) {
  t.plan(3)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    preset: 'openapi',
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
    preset: 'openapi',
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
    preset: 'openapi',
    document: baseDocument
  })

  const schema = DeepMerge(schemaBody, schemaConsumes)

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
    preset: 'openapi',
    document: baseDocument
  })

  const schema = DeepMerge(schemaResponse, schemaProduces)

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
    preset: 'openapi',
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
