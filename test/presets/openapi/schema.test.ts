import { openapiV3 } from '@apidevtools/openapi-schemas'
import Ajv from 'ajv-draft-04'
import AjvFormats from 'ajv-formats'
import Fastify from 'fastify'
import t from 'tap'
import { FastifyOpenAPI } from '../../../lib'
import { baseDocument } from '../../presets/openapi/options'
const ajv = new Ajv({ strict: false })
AjvFormats(ajv, { mode: 'full' })
const validate = ajv.compile(openapiV3)

function noop (): void {}

t.test('oneOf, anyOf, allOf', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    preset: 'openapi',
    document: baseDocument
  })
  fastify.get('/', {
    schema: {
      querystring: {
        oneOf: [
          {
            type: 'object',
            properties: {
              hello: { type: 'string' },
              world: { type: 'string' }
            }
          }
        ]
      },
      headers: {
        anyOf: [
          {
            type: 'object',
            properties: {
              authorization: { type: 'string' }
            }
          }
        ]
      },
      cookies: {
        allOf: [
          {
            type: 'object',
            properties: {
              foo: { type: 'string' },
              bar: { type: 'string' }
            }
          }
        ]
      }
    }
  }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
})

t.test('typebox enum', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    preset: 'openapi',
    document: baseDocument
  })
  const body = {
    type: 'object',
    properties: {
      enum: {
        type: 'string',
        anyOf: [
          {
            type: 'string',
            const: 'A'
          },
          {
            type: 'string',
            const: 'B'
          }
        ]
      }
    }
  }
  fastify.get('/', {
    schema: {
      body,
      response: {
        200: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            items: {
              type: 'array',
              items: body
            }
          }
        }
      }
    }
  }, noop)
  await fastify.ready()
  const o = validate(fastify.openapi.documents.default)
  t.equal(o, true)
})
