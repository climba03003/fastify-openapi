import { FastifyInstance } from 'fastify'
import { prepareDocumentBucket, prepareRouteBucket } from './prepare'

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
    this.openapi.bucket = prepareRouteBucket(routes, this.openapi.transform.isRouteBelongTo)
    const documentBucket = prepareDocumentBucket(this.openapi.bucket, this.openapi.transform)

    for (const [name, value] of documentBucket.entries()) {
      const document = this.openapi.transform.mergeDocument(name, this.openapi.document, this.openapi.documents?.[name])
      if (this.openapi.documents === undefined) this.openapi.documents = Object.create(null)
      this.openapi.documents[name] = this.openapi.transform.prepareFullDocument(name, document, value)
    }
  })
}
