import { RouteOptions } from 'fastify'
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { OpenAPIPluginOptions } from '..'
import * as OpenAPIPreset from '../presets/openapi'
import { OperationBucket } from './prepare'
import { ParameterSchema } from './transform'

export type IsRouteBelongToFunc = (routeOptions: RouteOptions) => string
export type MergeDocumentFunc = (name: string, base: Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>, document: Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>) => Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>
export type PrepareFullDocumentFunc = (name: string, document: Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>, bucket: OperationBucket) => OpenAPIV3.Document
export type TransformPathFunc = (transform: TransformOptions, method: string, path: string, routeOptions: RouteOptions) => OpenAPIV3.OperationObject
export type TransformQueryFunc =(method: string, path: string, parameterSchema: ParameterSchema) => OpenAPIV3.ParameterObject
export type TransformParamFunc = (method: string, path: string, parameterSchema: ParameterSchema) => OpenAPIV3.ParameterObject
export type TransformHeaderFunc = (method: string, path: string, parameterSchema: ParameterSchema) => OpenAPIV3.ParameterObject
export type TransformCookieFunc = (method: string, path: string, parameterSchema: ParameterSchema) => OpenAPIV3.ParameterObject
export type TransformBodyFunc = (method: string, path: string, consumes: string[] | undefined, jsonSchema: unknown) => OpenAPIV3.RequestBodyObject
export type TransformResponseFunc = (method: string, path: string, produces: string[] | undefined, jsonSchema: unknown) => OpenAPIV3.ResponsesObject

export interface TransformOptions {
  isRouteBelongTo: IsRouteBelongToFunc
  mergeDocument: MergeDocumentFunc
  prepareFullDocument: PrepareFullDocumentFunc
  transformPath: TransformPathFunc
  transformQuery: TransformQueryFunc
  transformParam: TransformParamFunc
  transformHeader: TransformHeaderFunc
  transformCookie: TransformCookieFunc
  transformBody: TransformBodyFunc
  transformResponse: TransformResponseFunc
}

function isRouteBelongTo (_routeOptions: RouteOptions): string {
  // we return default only
  return 'default'
}

/**
 * this functions is used to custom the correct
 * utilities based on user provided options
 */
export function validateTransformOption (options: OpenAPIPluginOptions): TransformOptions {
  // we do not need prototype chain
  let transform: any = Object.create(null)
  // if there is no preset provided, we use `openapi`
  if (typeof options.preset !== 'string') options.preset = 'openapi'

  // if we use `openapi`, we import from our `preset`
  if (options.preset === 'openapi') {
    transform = OpenAPIPreset
  }

  if (typeof options.isRouteBelongTo !== 'function') transform.isRouteBelongTo = isRouteBelongTo
  else transform.isRouteBelongTo = options.isRouteBelongTo
  if (typeof options.mergeDocument !== 'function') transform.isRouteBelongTo = OpenAPIPreset.mergeDocument
  // we allow to override the each transform from the preset
  if (typeof options.prepareFullDocument === 'function') transform.prepareFullDocument = options.prepareFullDocument
  if (typeof options.transformPath === 'function') transform.transformPath = options.transformPath
  if (typeof options.transformQuery === 'function') transform.transformQuery = options.transformQuery
  if (typeof options.transformParam === 'function') transform.transformParam = options.transformParam
  if (typeof options.transformHeader === 'function') transform.transformHeader = options.transformHeader
  if (typeof options.transformCookie === 'function') transform.transformCookie = options.transformCookie
  if (typeof options.transformBody === 'function') transform.transformBody = options.transformBody
  if (typeof options.transformResponse === 'function') transform.transformResponse = options.transformResponse

  // we check if any of those missing
  if (typeof transform.prepareFullDocument !== 'function') throw new Error('"prepareFullDocument" must be provided')
  if (typeof transform.transformPath !== 'function') throw new Error('"transformPath" must be provided')
  if (typeof transform.transformQuery !== 'function') throw new Error('"transformQuery" must be provided')
  if (typeof transform.transformParam !== 'function') throw new Error('"transformParam" must be provided')
  if (typeof transform.transformHeader !== 'function') throw new Error('"transformHeader" must be provided')
  if (typeof transform.transformCookie !== 'function') throw new Error('"transformCookie" must be provided')
  if (typeof transform.transformBody !== 'function') throw new Error('"transformBody" must be provided')
  if (typeof transform.transformResponse !== 'function') throw new Error('"transformResponse" must be provided')

  return transform
}
