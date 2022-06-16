import Fastify from 'fastify'
import t from 'tap'
import { FastifyOpenAPI } from '../../../lib'
import { validate } from '../../ajv'
import { baseDocument } from './options'

function noop (): void {}

t.test('oneOf, anyOf, allOf', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  await fastify.register(FastifyOpenAPI, {
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
