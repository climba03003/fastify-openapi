import { openapiV3 } from '@apidevtools/openapi-schemas'
import Ajv from 'ajv-draft-04'
import AjvFormats from 'ajv-formats'
import Fastify from 'fastify'
import t from 'tap'
import { FastifyOpenAPI } from '../../../lib'
import { baseDocument } from '../../presets/openapi/options'
const ajv = new Ajv({ strict: false })
AjvFormats(ajv, { mode: 'full' })
ajv.compile(openapiV3)

function noop (): void {}

t.test('$ref is not supported', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  await fastify.register(FastifyOpenAPI, {
    preset: 'openapi',
    document: baseDocument
  })
  fastify.addSchema({
    $id: 'http://example.com/',
    type: 'object',
    properties: {
      hello: { type: 'string' }
    }
  })
  fastify.get('/', { schema: { querystring: { $ref: 'http://example.com/#' } } }, noop)
  try {
    await fastify.ready()
  } catch (err: any) {
    t.equal(err.message, 'we do not support "$ref" currently.')
  }
})

t.test('array schema is not supported', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  await fastify.register(FastifyOpenAPI, {
    preset: 'openapi',
    document: baseDocument
  })
  fastify.get('/', { schema: { querystring: { type: 'array', items: { type: 'string' } } } }, noop)
  try {
    await fastify.ready()
  } catch (err: any) {
    t.equal(err.message, 'your json schema format maybe incorrect or using the shorten form.')
  }
})
