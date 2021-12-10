import DeepMerge from 'deepmerge'
import { FastifyPluginAsync } from 'fastify'
import FastifyPlugin from 'fastify-plugin'
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { addHooks } from './utils/hooks'
import { TransformOptions, validateTransformOption } from './utils/options'
import { RouteBucket } from './utils/prepare'
import { addRoutes, RoutesOptions } from './utils/routes'

export interface OpenAPIPluginOptions extends Partial<TransformOptions>{
  // base document
  document?: Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>
  // if you need to use different base document for different role
  documents?: Record<string, Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>>
  // use which preset to handle the route data
  preset?: string
  // route options to provide document and ui
  routes?: Partial<RoutesOptions>
}

declare module 'fastify' {
  interface FastifyInstance {
    openapi: {
      transform: TransformOptions
      bucket: RouteBucket
      // this is base document passed by users
      document: OpenAPIV3.Document | OpenAPIV3_1.Document
      documents: Record<string, OpenAPIV3.Document | OpenAPIV3_1.Document>
    }
  }

  interface FastifySchema {
    hide?: boolean
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
  }
}

const OpenAPI: FastifyPluginAsync<OpenAPIPluginOptions> = async function (fastify, options): Promise<void> {
  fastify.decorate('openapi', {
    transform: validateTransformOption(options),
    document: options.document ?? {},
    documents: DeepMerge(
      {
        // we provide default as fallback
        default: {}
      },
      options.documents ?? {}
    )
  })

  const routes = DeepMerge(
    {
      prefix: '/documentation',
      documents: {
        default: {
          ui: '/',
          document: '/openapi.json'
        }
      }
    },
    options.routes ?? {}
  )

  addHooks.call(fastify)
  addRoutes.call(fastify, routes)
}

export const FastifyOpenAPI = FastifyPlugin(OpenAPI, {
  fastify: '3.x',
  name: '@kakang/fastify-openapi',
  dependencies: []
})
export default FastifyOpenAPI
