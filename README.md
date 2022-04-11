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
import { FastifyOpenAPI, OpenAPIPlugin }  from '@kakang/fastify-openapi'

fastify.register(FastifyOpenAPI, {
  // plugin
  plugins: [ OpenAPIPlugin ],
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
  routeBelongTo: function() { 
    return []
  },
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

## Hooks

### onPath

On Path hook is executed for generate OpenAPI OperationObject.

```ts
function plugin(instance) {
  /**
   * @param {DocumentGenerator} instance document generator
   * @param {RouteOptions|OperationObject} schema last hook result. If it is the first hook, it is the original schema.
   * @param {RouteOptions} originalSchema original schema
   * @param {object} additionalInformation additional information
   * @returns {OperationObject} operation object
   **/
  instance.addHook('onPath', function(instance, schema, originalSchema, additionalInformation) {
    return schema
  })
}
```

### onQuery, onParam, onHeader, onCookie

On Query, Param, Header and Cookie hook are executed for generate OpenAPI ParameterObject.

```ts
function plugin(instance) {
  /**
   * @param {DocumentGenerator} instance document generator
   * @param {ParameterSchema|ParameterObject} schema last hook result. If it is the first hook, it is the original schema.
   * @param {ParameterSchema} originalSchema original schema
   * @param {object} additionalInformation additional information
   * @returns {ParameterObject} operation object
   **/
  instance.addHook('onQuery', function(instance, schema, originalSchema, additionalInformation) {
    return schema
  })
  instance.addHook('onParam', function(instance, schema, originalSchema, additionalInformation) {
    return schema
  })
  instance.addHook('onHeader', function(instance, schema, originalSchema, additionalInformation) {
    return schema
  })
  instance.addHook('onCookie', function(instance, schema, originalSchema, additionalInformation) {
    return schema
  })
}
```

### onBody

On Body hook is executed for generate OpenAPI RequestBodyObject.

```ts
function plugin(instance) {
  /**
   * @param {DocumentGenerator} instance document generator
   * @param {JSONSchema|RequestBodyObject} schema last hook result. If it is the first hook, it is the original schema.
   * @param {JSONSchema} originalSchema original schema
   * @param {object} additionalInformation additional information
   * @returns {RequestBodyObject} operation object
   **/
  instance.addHook('onPath', function(instance, schema, originalSchema, additionalInformation) {
    return schema
  })
}
```

### onResponse

On Response hook is executed for generate OpenAPI ResponsesObject.

```ts
function plugin(instance) {
  /**
   * @param {DocumentGenerator} instance document generator
   * @param {JSONSchema|RequestBodyObject} schema last hook result. If it is the first hook, it is the original schema.
   * @param {JSONSchema} originalSchema original schema
   * @param {object} additionalInformation additional information
   * @returns {ResponsesObject} operation object
   **/
  instance.addHook('onResponse', function(instance, schema, originalSchema, additionalInformation) {
    return schema
  })
}
```

### onTransform

On Transform hook is executed for generate valid schema.

```ts
function plugin(instance) {
  /**
   * @param {DocumentGenerator} instance document generator
   * @param {unknown} schema last hook result. If it is the first hook, it is the original schema.
   * @param {unknown} originalSchema original schema
   * @param {object} additionalInformation additional information
   * @returns {JSONSchema} operation object
   **/
  instance.addHook('onTransform', function(instance, schema, originalSchema, additionalInformation) {
    return schema
  })
}
```