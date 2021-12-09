import { OpenAPIPluginOptions } from '..'
import * as OpenAPIPreset from '../presets/openapi'

export interface TransformOptions {
  prepareFullDocument: Function
  transformPath: Function
  transformQuery: Function
  transformParam: Function
  transformHeader: Function
  transformCookie: Function
  transformBody: Function
  transformResponse: Function
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
