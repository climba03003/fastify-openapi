import { type FastifySchema } from 'fastify'
import { type OpenAPIV3 } from 'openapi-types'

export const baseDocument: Partial<OpenAPIV3.Document> = {
  info: {
    title: 'OpenAPI Document',
    version: '0.0.0'
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Sandbox' }
  ],
  tags: [
    { name: 'API' }
  ],
  components: {
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        name: 'apiKey',
        in: 'header'
      }
    }
  },
  security: [
    { apiKey: [] }
  ],
  externalDocs: {
    description: 'Find more info here',
    url: 'https://swagger.io'
  }
}

export const schemaQueryStrings: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      hello: { type: 'string' },
      world: { type: 'string' }
    }
  }
}

export const schemaParams: FastifySchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'string' }
    }
  }
}

export const schemaHeaders: FastifySchema = {
  headers: {
    type: 'object',
    properties: {
      authorization: { type: 'string' }
    }
  }
}

export const schemaCookies: FastifySchema = {
  cookies: {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      bar: { type: 'string' }
    }
  }
}

export const schemaBody: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      hello: { type: 'string' },
      object: {
        type: 'object',
        properties: {
          world: { type: 'string' }
        }
      }
    },
    required: ['hello']
  }
}

export const schemaConsumes: FastifySchema = {
  consumes: ['application/x-www-form-urlencoded']
}

export const schemaResponse: FastifySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        hello: { type: 'string' }
      }
    }
  }
}

export const schemaProduces: FastifySchema = {
  produces: ['*/*']
}

export const schemaSecurity: FastifySchema = {
  security: [
    { apiKey: [] }
  ]
}
