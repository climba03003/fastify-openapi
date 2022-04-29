import DeepMerge from 'deepmerge'
import { FastifyInstance, RouteShorthandOptions } from 'fastify'

export interface RoutesOptions {
  prefix: string
  documents: Record<string, { ui: string, document: string, uiRouteOption?: RouteShorthandOptions, documentRouteOption?: RouteShorthandOptions }>
}

export function addRoutes (this: FastifyInstance, options: RoutesOptions): void {
  for (const [name, { ui, document, uiRouteOption, documentRouteOption }] of Object.entries(options.documents)) {
    this.get(
      options.prefix + document,
      DeepMerge({ schema: { hide: true } }, documentRouteOption ?? {}),
      async (_, reply) => {
        return await reply.send(this.openapi.documents[name])
      }
    )

    this.get(
      options.prefix + ui,
      DeepMerge(
        {
          schema: { hide: true },
          onSend (_request, reply, _payload, done) {
            /**
             * coep is need, since helmet provide a stricter rules - require-corp
             * and unpkg.com do not provide a corp header
             */
            void reply.header('cross-origin-embedder-policy', 'unsafe-none')
            void reply.header('content-security-policy', "default-src 'self'; img-src 'self'; child-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' unpkg.com; style-src 'unsafe-inline' unpkg.com")
            done()
          }
        },
        uiRouteOption ?? {}
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
      apiDescriptionUrl="${this.prefix + options.prefix + document}"
      router="hash"
    />
  </body>
</html>
      `)
      }
    )
  }
}
