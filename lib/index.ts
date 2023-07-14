import { type FastifyPluginAsync } from 'fastify'
import FastifyPlugin from 'fastify-plugin'
import { type OpenAPIV3, type OpenAPIV3_1 } from 'openapi-types'
import { DocumentGenerator } from './document-generator'
import { kDocumentGenerator } from './symbols'
import { addHooks } from './utils/fastify-hooks'
import { addRoutes } from './utils/fastify-routes'
import { normalizePluginOption, type OpenAPIPluginOptions, type RoutesOptions } from './utils/options'

declare module 'openapi-types' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace OpenAPIV3 {
    // the change here will affect both openapi@3 and openapi@3.1
    // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
    interface Document {
      [key: `x-${string}`]: any
    }
  }
}

declare module 'fastify' {
  interface FastifySchema {
    hide?: boolean | string[]
    tags?: string[]
    summary?: string
    description?: string
    externalDocs?: OpenAPIV3.ExternalDocumentationObject
    operationId?: string
    cookies?: unknown
    consumes?: string[]
    produces?: string[]
    callbacks?: Record<string, OpenAPIV3.CallbackObject>
    deprecated?: boolean
    security?: Array<Record<string, string[]>>
    servers?: OpenAPIV3.ServerObject[]
    // we allow any `x-` prefix extension
    [extension: `x-${string}`]: any
  }

  interface FastifyInstance {
    openapi: {
      generate: () => void
      documents: Record<string, OpenAPIV3.Document | OpenAPIV3_1.Document>
    }
  }
}

const OpenAPI: FastifyPluginAsync<OpenAPIPluginOptions> = async function (fastify, options): Promise<void> {
  const opts = normalizePluginOption(options)
  // we initialize document generator
  fastify.decorate(kDocumentGenerator, new DocumentGenerator({
    log: fastify.log,
    document: opts.document,
    documents: opts.documents,
    routeBelongTo: opts.routeBelongTo
  }))

  for (const plugin of opts.plugins) {
    fastify[kDocumentGenerator].plugin(plugin)
  }

  const openapi: any = {}
  let isGenerated = false
  Object.defineProperties(openapi, {
    generate: {
      value () {
        fastify[kDocumentGenerator].generate()
      }
    },
    documents: {
      get () {
        // lazy load documents
        if (!isGenerated) {
          fastify[kDocumentGenerator].generate()
          isGenerated = true
        }
        return fastify[kDocumentGenerator].documents
      }
    }
  })

  fastify.decorate('openapi', openapi)

  addHooks(fastify)
  addRoutes(fastify, opts.routes as RoutesOptions)
}

export const FastifyOpenAPI = FastifyPlugin(OpenAPI, {
  fastify: '4.x',
  name: '@kakang/fastify-openapi',
  dependencies: []
})
export default FastifyOpenAPI

// export plugins
export { OpenAPIPlugin } from './plugins/openapi'
export { TypeboxPlugin } from './plugins/typebox'
