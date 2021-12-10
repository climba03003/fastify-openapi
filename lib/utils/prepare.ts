import { RouteOptions } from 'fastify'
import { OpenAPIV3 } from 'openapi-types'
import RFDC from 'rfdc'
import { IsRouteBelongToFunc, TransformOptions } from './options'
import { normalizePath } from './path'

// we clone the route options to prevent, unexpect mutation
const clone = RFDC()

export interface RouteBucketKey { method: string, path: string, name: string }
export type RouteBucket = Map<RouteBucketKey, RouteOptions[]>

export function prepareRouteBucket (routes: RouteOptions[], isRouteBelongTo: IsRouteBelongToFunc): RouteBucket {
  // we group all route with `method` and `path` which allow us to manage the `constraint` part.
  const bucket = new Map<RouteBucketKey, RouteOptions[]>()

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i]
    const name = isRouteBelongTo(route)
    const methods: string[] = Array.isArray(route.method) ? route.method : [route.method]
    // we normalize the url into openapi standard
    const path = normalizePath(route.url)
    for (let j = 0; j < methods.length; j++) {
      const k = { method: methods[j], path, name }
      if (bucket.has(k)) {
        bucket.get(k)?.push(clone(route))
      } else {
        bucket.set(k, [clone(route)])
      }
    }
  }

  return bucket
}

export type OperationBucket = Map<RouteBucketKey, OpenAPIV3.OperationObject[]>
export type DocumentBucket = Map<string, OperationBucket>

export function prepareDocumentBucket (routeBucket: RouteBucket, transforms: TransformOptions): DocumentBucket {
  const documentBucket: DocumentBucket = new Map()
  for (const [key, value] of routeBucket.entries()) {
    if (!documentBucket.has(key.name)) documentBucket.set(key.name, new Map())
    const operationBucket = documentBucket.get(key.name) as OperationBucket
    const temp = []
    for (let i = 0; i < value.length; i++) {
      if (value[i].schema?.hide === true) continue
      temp.push(transforms.transformPath(transforms, key.method, key.path, value[i]))
    }
    operationBucket.set(key, temp)
  }
  return documentBucket
}
