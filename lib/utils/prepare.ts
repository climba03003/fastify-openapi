import { FastifyInstance } from 'fastify'
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

export function prepareDocument (this: FastifyInstance): OpenAPIV3.Document | OpenAPIV3_1.Document {
  const bucket = new Map()
  for (const [key, value] of this.openapi.bucket.entries()) {
    const temp = []
    for (let i = 0; i < value.length; i++) {
      if (value[i].schema?.hide === true) continue
      temp.push(this.openapi.transform.transformPath.call(this, key.method, key.path, value[i]))
    }
    bucket.set(key, temp)
  }

  return this.openapi.transform.prepareFullDocument.call(this, bucket)
}
