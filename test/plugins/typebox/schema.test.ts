import Fastify from 'fastify'
import t from 'tap'
import { FastifyOpenAPI, OpenAPIPlugin, TypeboxPlugin } from '../../../lib'
import { validate } from '../../ajv'
import { baseDocument } from '../openapi/options'

function noop (): void {}

t.test('typebox enum', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  await fastify.register(FastifyOpenAPI, {
    plugins: [TypeboxPlugin, OpenAPIPlugin],
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
  fastify.post('/', {
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
