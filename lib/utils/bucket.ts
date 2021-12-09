import { RouteOptions } from 'fastify'
import RFDC from 'rfdc'
import { normalizePath } from './path'

// we clone the route options to prevent, unexpect mutation
const clone = RFDC()

export type RouteBucket = Map<{ method: string, path: string}, RouteOptions[]>

export function createBucket (routes: RouteOptions[]): RouteBucket {
  // we group all route with `method` and `path` which allow us to manage the `constraint` part.
  const bucket = new Map<{ method: string, path: string}, RouteOptions[]>()

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i]
    const methods: string[] = Array.isArray(route.method) ? route.method : [route.method]
    // we normalize the url into openapi standard
    const path = normalizePath(route.url)
    for (let j = 0; j < methods.length; j++) {
      const k = { method: methods[j], path }
      if (bucket.has(k)) {
        bucket.get(k)?.push(clone(route))
      } else {
        bucket.set(k, [clone(route)])
      }
    }
  }

  return bucket
}
