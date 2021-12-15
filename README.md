# @kakang/fastify-openapi

[![Continuous Integration](https://github.com/climba03003/fastify-openapi/actions/workflows/ci.yml/badge.svg)](https://github.com/climba03003/fastify-openapi/actions/workflows/ci.yml)
[![Package Manager CI](https://github.com/climba03003/fastify-openapi/actions/workflows/package-manager-ci.yml/badge.svg)](https://github.com/climba03003/fastify-openapi/actions/workflows/package-manager-ci.yml)
[![NPM version](https://img.shields.io/npm/v/@kakang/fastify-openapi.svg?style=flat)](https://www.npmjs.com/package/@kakang/fastify-openapi)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/climba03003/fastify-openapi)](https://github.com/climba03003/fastify-openapi)
[![Coverage Status](https://coveralls.io/repos/github/climba03003/fastify-openapi/badge.svg?branch=main)](https://coveralls.io/github/climba03003/fastify-openapi?branch=master)
[![GitHub](https://img.shields.io/github/license/climba03003/fastify-openapi)](https://github.com/climba03003/fastify-openapi)

This plugin provide automatic API documentation feature.
**This project is relative new and the API structure may change rapidly. Please consider it before using in production.**

## Install

```shell
npm install @kakang/fastify-openapi --save

yarn add @kakang/fastify-openapi
```

## Compare with [`fastify-swagger`](https://github.com/fastify/fastify-swagger)

Pros

- Multi documentation support
- Route constraints support
- High flexibility on customizing behavior

Cons

- Do not support `$ref`
- Do not support `Swagger 2.0`
- Do not support `YAML`

## Usage

```ts
import FastifyOpenAPI from '@kakang/fastify-openapi'

fastify.register(FastifyOpenAPI, {
  // preset only support `openapi`
  preset: 'openapi',
  // base document shared for multiple document
  // it should follow the format of OpenAPI 3.0
  document: {},
  // multi document customize property
  // it should follow the format of OpenAPI 3.0
  documents: {
    // it use key-value, for the multi document
    default: {}
  },
  // routes options for document and ui
  routes: {
    // prefix shared by all routes
    prefix: '/documentation',
    // config for each document
    documents: {
      // it use key-value, for the multi document
      default: {
        // ui path
        ui: '/',
        // document path
        document: '/openapi.json',
        // ui route option
        uiRouteOptions: {},
        // document route option
        documentRouteOptions: {}
      }
    }
  },
  // function to identify which document the route belong to
  isRouteBelongTo: function() { },
  // how to make the document
  prepareFullDocument: function() {},
  // how to transform route options to openapi operation object
  transformPath: function() {},
  // how to transform json-schema to openapi query
  transformQuery: function() {},
  // how to transform json-schema to openapi param
  transformParam: function() {},
  // how to transform json-schema to openapi header
  transformHeader: function() {},
  // how to transform json-schema to openapi cookie
  transformCookie: function() {},
  // how to transform json-schema to openapi body
  transformBody: function() {},
  // how to transform json-schema to openapi response
  transformResponse: function() {},
})
```

### Routes Options

```ts
fastify.get(
  '/',
  {
    // hide this route
    hide: false,
    // array of string
    tags: [''],
    // string
    summary: '',
    // string
    description: '',
    // key-value
    externalDocs: {},
    // string
    operationId: '',
    // json-schema
    params: {},
    // json-schema
    querystring: {},
    // json-schema
    headers: {},
    // json-schema
    cookies: {},
    // json-schema
    body: {},
    // json-schema
    response: {},
    // key-value
    callbacks: {},
    // boolean
    deprecated: false,
    // key-value
    security: {},
    // key-value
    servers: {},
  },
  async function() {}
)
```

### Transform

```ts
type IsRouteBelongToFunc = (
  routeOptions: RouteOptions
) => string

type MergeDocumentFunc = (
  name: string, 
  base: Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>,
  document: Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>
) => Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>

type PrepareFullDocumentFunc = (
  name: string, 
  document: Partial<OpenAPIV3.Document> | Partial<OpenAPIV3_1.Document>, 
  bucket: OperationBucket
) => OpenAPIV3.Document

type TransformPathFunc = (
  transform: TransformOptions, 
  method: string, 
  path: string, 
  routeOptions: RouteOptions
) => OpenAPIV3.OperationObject

type TransformQueryFunc =(
  method: string, 
  path: string, 
  parameterSchema: ParameterSchema
) => OpenAPIV3.ParameterObject

type TransformParamFunc = (
  method: string, 
  path: string, 
  parameterSchema: ParameterSchema
) => OpenAPIV3.ParameterObject

type TransformHeaderFunc = (
  method: string, 
  path: string, 
  parameterSchema: ParameterSchema
) => OpenAPIV3.ParameterObject

type TransformCookieFunc = (
  method: string, 
  path: string, 
  parameterSchema: ParameterSchema
) => OpenAPIV3.ParameterObject

type TransformBodyFunc = (
  method: string, 
  path: string, 
  consumes: string[] | undefined, 
  jsonSchema: unknown
) => OpenAPIV3.RequestBodyObject

type TransformResponseFunc = (
  method: string, 
  path: string, 
  produces: string[] | undefined, 
  jsonSchema: unknown
) => OpenAPIV3.ResponsesObject
```
