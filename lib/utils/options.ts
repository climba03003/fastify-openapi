import DeepMerge from 'deepmerge'
import { RouteShorthandOptions } from 'fastify'
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { DocumentGeneratorPlugin } from '../document-generator'
import { OpenAPIPlugin } from '../plugins/openapi'
import { routeBelongTo, RouteBelongToFunc } from './hooks'

interface DocumentRouteOption {
  ui: string | false
  document: string | false
  uiRouteOption?: RouteShorthandOptions
  documentRouteOption?: RouteShorthandOptions
}

export interface RoutesOptions {
  prefix: string
  documents: Record<string, DocumentRouteOption | false>
}

export interface OpenAPIPluginOptions {
  // base document
  document?: Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>
  // if you need to use different base document for different role
  documents?: Record<string, Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>>
  // plugins
  plugins?: DocumentGeneratorPlugin[]
  // route options to provide document and ui
  routes?: Partial<RoutesOptions>

  // we allow some global functions to override
  routeBelongTo?: RouteBelongToFunc
}

export function normalizePluginOption (options: OpenAPIPluginOptions): Required<OpenAPIPluginOptions> {
  const opts = {
    routeBelongTo: options.routeBelongTo ?? routeBelongTo,
    document: options.document ?? {},
    documents: DeepMerge(
      {
        // we provide default as fallback
        default: {}
      },
      options.documents ?? {}
    ),
    plugins: options.plugins ?? [OpenAPIPlugin],
    routes: DeepMerge(
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
  }
  return opts
}
