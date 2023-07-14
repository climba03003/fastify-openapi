import Fastify from 'fastify'
import t from 'tap'
import { FastifyOpenAPI } from '../lib'

t.test('no option provided', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  await fastify.register(FastifyOpenAPI)
  await fastify.ready()
  t.pass()
})

t.test('provide options', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  await fastify.register(FastifyOpenAPI, {
    document: {},
    documents: {},
    routes: {}
  })
  await fastify.ready()
  t.pass()
})

t.test('invalid preset', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  await fastify.register(FastifyOpenAPI, {
    // @ts-expect-error test invalid option
    preset: true
  })
  await fastify.ready()
  t.pass()
})
