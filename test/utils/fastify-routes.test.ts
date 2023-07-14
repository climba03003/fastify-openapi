import DeepMerge from 'deepmerge'
import Fastify, { type FastifySchema } from 'fastify'
import t from 'tap'
import { FastifyOpenAPI } from '../../lib'
import { validate } from '../ajv'
import { baseDocument, schemaBody, schemaHeaders, schemaParams, schemaQueryStrings, schemaSecurity } from '../plugins/openapi/options'

function noop (): void {}

t.test('default document', async function (t) {
  t.plan(5)
  const fastify = Fastify()
  await fastify.register(FastifyOpenAPI, {
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
  const jsonResponse = await fastify.inject('/documentation/openapi.json')
  t.equal(jsonResponse.statusCode, 200)
  const document = jsonResponse.json()
  const o = validate(document)
  t.equal(o, true)
  const htmlResponse = await fastify.inject('/documentation/')
  t.equal(htmlResponse.statusCode, 200)
  t.equal(htmlResponse.headers['content-type'], 'text/html')
  t.equal(htmlResponse.headers['content-security-policy'], "default-src 'self'; img-src 'self'; child-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' unpkg.com; style-src 'unsafe-inline' unpkg.com")
})

t.test('multi document', async function (t) {
  t.plan(12)
  let i = 0
  const fastify = Fastify()
  await fastify.register(FastifyOpenAPI, {
    document: baseDocument,
    routes: {
      documents: {
        default: {
          ui: '/default/',
          document: '/default/openapi.json',
          uiRouteOption: {
            preHandler (_req, _reply, next) {
              t.ok('ui route option run')
              next()
            }
          },
          documentRouteOption: {
            preHandler (_req, _reply, next) {
              t.ok('document route option run')
              next()
            }
          }
        },
        second: {
          ui: '/second/',
          document: '/second/openapi.json'
        }
      }
    },
    routeBelongTo () {
      i++
      return i % 2 === 0 ? ['default'] : ['second']
    }
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
  let jsonResponse = await fastify.inject('/documentation/default/openapi.json')
  t.equal(jsonResponse.statusCode, 200)
  let document = jsonResponse.json()
  let o = validate(document)
  t.equal(o, true)
  let htmlResponse = await fastify.inject('/documentation/default/')
  t.equal(htmlResponse.statusCode, 200)
  t.equal(htmlResponse.headers['content-type'], 'text/html')
  t.equal(htmlResponse.headers['content-security-policy'], "default-src 'self'; img-src 'self'; child-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' unpkg.com; style-src 'unsafe-inline' unpkg.com")
  jsonResponse = await fastify.inject('/documentation/second/openapi.json')
  t.equal(jsonResponse.statusCode, 200)
  document = jsonResponse.json()
  o = validate(document)
  t.equal(o, true)
  htmlResponse = await fastify.inject('/documentation/second/')
  t.equal(htmlResponse.statusCode, 200)
  t.equal(htmlResponse.headers['content-type'], 'text/html')
  t.equal(htmlResponse.headers['content-security-policy'], "default-src 'self'; img-src 'self'; child-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' unpkg.com; style-src 'unsafe-inline' unpkg.com")
})

t.test('disable default document', async function (t) {
  t.plan(2)
  const fastify = Fastify()
  await fastify.register(FastifyOpenAPI, {
    document: baseDocument,
    routes: { documents: { default: false } }
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
  const jsonResponse = await fastify.inject('/documentation/openapi.json')
  t.equal(jsonResponse.statusCode, 404)
  const htmlResponse = await fastify.inject('/documentation/')
  t.equal(htmlResponse.statusCode, 404)
})

t.test('disable ui', async function (t) {
  t.plan(3)
  const fastify = Fastify()
  await fastify.register(FastifyOpenAPI, {
    document: baseDocument,
    routes: { documents: { default: { ui: false, document: '/openapi.json' } } }
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
  const jsonResponse = await fastify.inject('/documentation/openapi.json')
  t.equal(jsonResponse.statusCode, 200)
  const document = jsonResponse.json()
  const o = validate(document)
  t.equal(o, true)
  const htmlResponse = await fastify.inject('/documentation/')
  t.equal(htmlResponse.statusCode, 404)
})

t.test('disable document', async function (t) {
  t.plan(2)
  const fastify = Fastify()
  await fastify.register(FastifyOpenAPI, {
    document: baseDocument,
    routes: { documents: { default: { ui: '/', document: false } } }
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
  const jsonResponse = await fastify.inject('/documentation/openapi.json')
  t.equal(jsonResponse.statusCode, 404)
  const htmlResponse = await fastify.inject('/documentation/')
  t.equal(htmlResponse.statusCode, 404)
})
