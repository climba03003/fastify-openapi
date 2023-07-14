import { type FastifyInstance } from 'fastify'
import { kDocumentGenerator } from '../symbols'

export function addHooks (fastify: FastifyInstance): void {
  /**
   * 1. we store all the route into an array and must not
   *    organize at this stage. The main reason is that
   *    same of the plugin may alter the property of
   *    route, we wait until all the thing is done.
   */
  fastify.addHook('onRoute', function (route) {
    if (route.method === 'HEAD') return
    fastify[kDocumentGenerator].addRoute(route)
  })

  /**
   * 2. we store schemas into an map for $ref resolution
   */
  fastify.addHook('onReady', function (done) {
    fastify[kDocumentGenerator].addSchemas(fastify.getSchemas())
    done()
  })

  fastify.addHook('onRegister', function (instance, _) {
    // since each instance may have their own $ref storage
    // we need it for each registration
    instance.addHook('onReady', function (done) {
      fastify[kDocumentGenerator].addSchemas(fastify.getSchemas())
      done()
    })
  })

  /**
   * 3. we need to find a way the onReady hook below is executed at last
   */
  fastify.addHook('onReady', function (done) {
    // TODO: compute and cache the result of document
    done()
  })
}
