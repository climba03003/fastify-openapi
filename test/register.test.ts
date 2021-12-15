import Fastify from 'fastify'
import t from 'tap'
import { FastifyOpenAPI } from '../lib'

function noop (): any {}

t.test('no option provided', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI)
  await fastify.ready()
  t.pass()
})

t.test('provide options', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
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
  fastify.register(FastifyOpenAPI, {
    // @ts-expect-error
    preset: true
  })
  await fastify.ready()
  t.pass()
})

t.test('custom preset', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    preset: 'custom'
  })
  try {
    await fastify.ready()
  } catch (err: any) {
    t.equal(err.message, '"prepareFullDocument" must be provided')
  }
})

t.test('custom isRouteBelongTo', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    isRouteBelongTo: noop
  })
  await fastify.ready()
  t.pass()
})

t.test('all custom transform', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    preset: 'custom',
    prepareFullDocument: noop,
    mergeDocument: noop,
    transformPath: noop,
    transformQuery: noop,
    transformParam: noop,
    transformHeader: noop,
    transformCookie: noop,
    transformBody: noop,
    transformResponse: noop
  })
  await fastify.ready()
  t.pass()
})

t.test('missing mergeDocument', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    preset: 'custom',
    prepareFullDocument: noop
  })
  try {
    await fastify.ready()
  } catch (err: any) {
    t.equal(err.message, '"mergeDocument" must be provided')
  }
})

t.test('missing transformPath', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    preset: 'custom',
    prepareFullDocument: noop,
    mergeDocument: noop
  })
  try {
    await fastify.ready()
  } catch (err: any) {
    t.equal(err.message, '"transformPath" must be provided')
  }
})

t.test('missing transformQuery', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    preset: 'custom',
    prepareFullDocument: noop,
    mergeDocument: noop,
    transformPath: noop
  })
  try {
    await fastify.ready()
  } catch (err: any) {
    t.equal(err.message, '"transformQuery" must be provided')
  }
})

t.test('missing transformParam', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    preset: 'custom',
    prepareFullDocument: noop,
    mergeDocument: noop,
    transformPath: noop,
    transformQuery: noop
  })
  try {
    await fastify.ready()
  } catch (err: any) {
    t.equal(err.message, '"transformParam" must be provided')
  }
})

t.test('missing transformHeader', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    preset: 'custom',
    prepareFullDocument: noop,
    mergeDocument: noop,
    transformPath: noop,
    transformQuery: noop,
    transformParam: noop
  })
  try {
    await fastify.ready()
  } catch (err: any) {
    t.equal(err.message, '"transformHeader" must be provided')
  }
})

t.test('missing transformCookie', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    preset: 'custom',
    prepareFullDocument: noop,
    mergeDocument: noop,
    transformPath: noop,
    transformQuery: noop,
    transformParam: noop,
    transformHeader: noop
  })
  try {
    await fastify.ready()
  } catch (err: any) {
    t.equal(err.message, '"transformCookie" must be provided')
  }
})

t.test('missing transformBody', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    preset: 'custom',
    prepareFullDocument: noop,
    mergeDocument: noop,
    transformPath: noop,
    transformQuery: noop,
    transformParam: noop,
    transformHeader: noop,
    transformCookie: noop
  })
  try {
    await fastify.ready()
  } catch (err: any) {
    t.equal(err.message, '"transformBody" must be provided')
  }
})

t.test('missing transformResponse', async function (t) {
  t.plan(1)
  const fastify = Fastify()
  fastify.register(FastifyOpenAPI, {
    preset: 'custom',
    prepareFullDocument: noop,
    mergeDocument: noop,
    transformPath: noop,
    transformQuery: noop,
    transformParam: noop,
    transformHeader: noop,
    transformCookie: noop,
    transformBody: noop
  })
  try {
    await fastify.ready()
  } catch (err: any) {
    t.equal(err.message, '"transformResponse" must be provided')
  }
})
