import { openapiV3 } from '@apidevtools/openapi-schemas'
import Ajv from 'ajv-draft-04'
import AjvFormats from 'ajv-formats'
import DeepMerge from 'deepmerge'
import Fastify from 'fastify'
import t from 'tap'
import { FastifyOpenAPI } from '../../../lib'
import { baseDocument, schemaBody, schemaHeaders, schemaParams, schemaQueryStrings, schemaSecurity } from './options'
const ajv = new Ajv({ strict: false })
AjvFormats(ajv, { mode: 'full' })
const validate = ajv.compile(openapiV3)

function noop (): void {}

t.test('', async function (t) {
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
