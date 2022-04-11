import { FastifyPluginAsync } from 'fastify'
import FastifyPlugin from 'fastify-plugin'
import { OpenAPIV3 } from 'openapi-types'
import { DocumentGenerator } from './document-generator'
import { kDocumentGenerator } from './symbols'
import { addHooks } from './utils/fastify-hooks'
import { normalizePluginOption, OpenAPIPluginOptions } from './utils/options'

declare module 'openapi-types' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace OpenAPIV3 {
    interface Document {
      // we allow `x-` prefix extension
      [extension: `x-${string}`]: any
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
    callbacks?: { [callback: string]: OpenAPIV3.CallbackObject }
    deprecated?: boolean
    security?: Array<{ [securityLabel: string]: string[] }>
    servers?: OpenAPIV3.ServerObject[]
    // we allow any `x-` prefix extension
    [extension: `x-${string}`]: any
  }

  interface FastifyInstance {
    document: {
      generate: () => void
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

  fastify.decorate('document', {
    generate () {
      fastify[kDocumentGenerator].generate()
    }
  })

  addHooks(fastify)
}

export const FastifyOpenAPI = FastifyPlugin(OpenAPI, {
  fastify: '3.x',
  name: '@kakang/fastify-openapi',
  dependencies: []
})
export default FastifyOpenAPI
export { OpenAPIPlugin } from './plugins/openapi'
