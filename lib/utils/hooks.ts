import { FastifyInstance } from 'fastify'
import { createBucket } from './bucket'
import { prepareDocument } from './prepare'

export function addHooks (this: FastifyInstance): void {
  const routes: any[] = []

  /**
   * 1. we store all the route into an array and must not
   *    organize at this stage. The main reason is that
   *    same of the plugin may alter the property of
   *    route, we wait until all the thing is done.
   */
  this.addHook('onRoute', function (route) {
    routes.push(route)
  })

  /**
   * 2. we start prepare the json doc for openapi
   */
  this.addHook('onReady', function () {
    this.openapi.bucket = createBucket(routes)
    this.openapi.document = prepareDocument.call(this)
  })
}
