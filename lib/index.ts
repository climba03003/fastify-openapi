import { FastifyPluginAsync } from 'fastify'
import FastifyPlugin from 'fastify-plugin'
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { RouteBucket } from './utils/bucket'
import { addHooks } from './utils/hooks'
import { TransformOptions, validateTransformOption } from './utils/options'
import { addRoutes, RoutesOptions } from './utils/routes'

export interface OpenAPIPluginOptions extends Partial<TransformOptions>{
  document?: OpenAPIV3.Document | OpenAPIV3_1.Document
  preset?: string
  routes?: Partial<RoutesOptions>
}

declare module 'fastify' {
  interface FastifyInstance {
    openapi: {
      transform: TransformOptions
      bucket: RouteBucket
      document: OpenAPIV3.Document | OpenAPIV3_1.Document
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
    document: options.document ?? {}
  })

  const routes = {
    prefix: '/documentation',
    ui: '/',
    document: '/openapi.json',
    ...options.routes ?? {}
  }

  addHooks.call(fastify)
  addRoutes.call(fastify, routes)
}

export const FastifyOpenAPI = FastifyPlugin(OpenAPI, {
  fastify: '3.x',
  name: '@kakang/fastify-openapi',
  dependencies: []
})
export default FastifyOpenAPI
