import DeepMerge from 'deepmerge'
import { RouteOptions } from 'fastify'
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { DocumentGenerator } from '../document-generator'
import { ParameterSchema } from './parameter'

export type DocumentGeneratorHookName =
  'onPath' |
  'onQuery' |
  'onParam' |
  'onHeader' |
  'onCookie' |
  'onBody' |
  'onResponse' |
  'onRefResolve' |
  'onTransform'

export type RouteBelongToFunc = (routeOptions: RouteOptions) => string[]
export const routeBelongTo: RouteBelongToFunc = function (_routeOptions) {
  return ['default']
}

export type MergeDocumentFunc = (name: string, base?: Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>, document?: Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>) => Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>
export const mergeDocument: MergeDocumentFunc = function (_name, base, document) {
  const dummy: any = {
    openapi: '3.0.3',
    info: {
      version: '0.0.0',
      title: ''
    },
    paths: {}
  }

  // allow non-exist base and document
  return DeepMerge.all([dummy, base ?? {}, document ?? {}])
}

export interface OnPathHookInformation {
  method: string
  path: string
  securityIngore: Record<string, string[]>
}
export type OnPathHookFunc = (generator: DocumentGenerator, route: RouteOptions, oRoute: RouteOptions, information: OnPathHookInformation) => OpenAPIV3.OperationObject

export interface OnQueryHookInformation {
  method: string
  path: string
  securityIngore: Record<string, string[]>
}
export type OnQueryHookFunc = (generator: DocumentGenerator, schema: ParameterSchema, oSchema: ParameterSchema, information: OnQueryHookInformation) => OpenAPIV3.ParameterObject

export interface OnParamHookInformation {
  method: string
  path: string
  securityIngore: Record<string, string[]>
}
export type OnParamHookFunc = (generator: DocumentGenerator, schema: ParameterSchema, oSchema: ParameterSchema, information: OnParamHookInformation) => OpenAPIV3.ParameterObject

export interface OnHeaderHookInformation {
  method: string
  path: string
  securityIngore: Record<string, string[]>
}
export type OnHeaderHookFunc = (generator: DocumentGenerator, schema: ParameterSchema, oSchema: ParameterSchema, information: OnHeaderHookInformation) => OpenAPIV3.ParameterObject

export interface OnCookieHookInformation {
  method: string
  path: string
  securityIngore: Record<string, string[]>
}
export type OnCookieHookFunc = (generator: DocumentGenerator, schema: ParameterSchema, oSchema: ParameterSchema, information: OnCookieHookInformation) => OpenAPIV3.ParameterObject

export interface OnBodyHookInformation {
  method: string
  path: string
  consumes: undefined | string[]
}
export type OnBodyHookFunc = (generator: DocumentGenerator, schema: unknown, oSchema: unknown, information: OnBodyHookInformation) => OpenAPIV3.RequestBodyObject

export interface OnResponseHookInformation {
  method: string
  path: string
  produces: undefined | string[]
}
export type OnResponseHookFunc = (generator: DocumentGenerator, schema: unknown, oSchema: unknown, information: OnResponseHookInformation) => OpenAPIV3.ResponsesObject

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OnRefResolveHookInformation {
}
export type OnRefResolveHookFunc = (generator: DocumentGenerator, schema: unknown, oSchema: unknown, information: OnRefResolveHookInformation) => any

export interface OnTransformHookInformation {
  method: string
  path: string
  position: 'param' | 'query' | 'header' | 'cookie' | 'body' | 'response'
}
export type OnTransformHookFunc = (generator: DocumentGenerator, schema: unknown, oSchema: unknown, information: OnTransformHookInformation) => any
