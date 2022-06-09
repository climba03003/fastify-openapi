import { FastifyInstance } from 'fastify'
import { prepareDocumentBucket, prepareRouteBucket } from './prepare'
import { computeSecurityIgnore } from './transform'

export function addHooks (this: FastifyInstance): void {
  const routes: any[] = []

  /**
   * 1. we store all the route into an array and must not
   *    organize at this stage. The main reason is that
   *    same of the plugin may alter the property of
   *    route, we wait until all the thing is done.
   */
  this.addHook('onRoute', function (route) {
    if (route.method === 'HEAD') return
    routes.push(route)
  })

  /**
   * 2. we start prepare the json doc for openapi
   */
  this.addHook('onReady', async function () {
    this.openapi.bucket = prepareRouteBucket(routes, this.openapi.transform.isRouteBelongTo)
    const documentBucket = prepareDocumentBucket(this.openapi.bucket)

    for (const [name, value] of documentBucket.entries()) {
      const document = this.openapi.transform.mergeDocument(name, this.openapi.document, this.openapi.documents?.[name])
      if (this.openapi.documents === undefined) this.openapi.documents = Object.create(null)
      for (const [key, schemas] of value.entries()) {
        const temp = []
        for (let i = 0; i < schemas.length; i++) {
          // we need to create the security key array first
          // because some key should not exist on both `header`, `cookie`, `querystring` and security
          const securityIngore = computeSecurityIgnore(document.security, schemas[i].security, document.components?.securitySchemes)
          temp.push(this.openapi.transform.transformPath(this.openapi.transform, key.method, key.path, schemas[i] as any, securityIngore))
        }
        value.set(key, temp)
      }
      this.openapi.documents[name] = this.openapi.transform.prepareFullDocument(name, document, value)
    }
  })
}
