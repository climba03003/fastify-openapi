import DeepMerge from 'deepmerge'
import { FastifyInstance } from 'fastify'
import { RoutesOptions } from './options'

export function addRoutes (fastify: FastifyInstance, options: RoutesOptions): void {
  for (const [name, document] of Object.entries(options.documents)) {
    // skip if you do not want document
    if (document === false) continue
    // create document only when it is not false
    if (document.document !== false) {
      fastify.get(
        options.prefix + document.document,
        DeepMerge({ schema: { hide: true } }, document.documentRouteOption ?? {}),
        async (_, reply) => {
          return await reply.send(fastify.openapi.documents[name])
        }
      )
    }
    // create ui only when both ui and document are not false
    if (document.document !== false && document.ui !== false) {
      fastify.get(
        options.prefix + document.ui,
        DeepMerge(
          {
            schema: { hide: true },
            onSend (_request, reply, _payload, done) {
              void reply.header('content-security-policy', "default-src 'self'; img-src 'self'; child-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' unpkg.com; style-src 'unsafe-inline' unpkg.com")
              done()
            }
          },
          document.uiRouteOption ?? {}
        ),
        async (_, reply) => {
          return await reply.header('content-type', 'text/html').send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, shrink-to-fit=no"
    />
    <title>Elements in HTML</title>

    <script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
    <link
      rel="stylesheet"
      href="https://unpkg.com/@stoplight/elements/styles.min.css"
    />
  </head>
  <body>
    <elements-api
      apiDescriptionUrl="${fastify.prefix + options.prefix + (document.document as string)}"
      router="hash"
    />
  </body>
</html>
        `)
        }
      )
    }
  }
}
