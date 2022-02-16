import { OpenAPIV3 } from 'openapi-types'

export function hotfix (schema: any, k?: string): any {
  // we loop through array of allOf, anyOf and oneOf first
  if ('allOf' in schema) {
    schema.allOf = schema.allOf.map((o: any) => hotfix(o))
  }
  if ('anyOf' in schema) {
    schema.anyOf = schema.anyOf.map((o: any) => hotfix(o))
  }
  if ('oneOf' in schema) {
    schema.oneOf = schema.oneOf.map((o: any) => hotfix(o))
  }
  // it is a normal object
  // we loop through key-value
  if (schema.type === 'object' && 'properties' in schema) {
    Object.keys(schema.properties).forEach(function (key) {
      schema.properties[key] = hotfix(schema.properties[key], key)
    })
  }
  // it is a normal array
  // we loop through value
  if (schema.type === 'array' && 'items' in schema) {
    schema.items = hotfix(schema.items)
  }
  typeboxEnumHotfix(schema, k)
  return schema
}

export function typeboxEnumHotfix (schema: any, key?: string): any {
  // it is a object with properties
  if (schema.type === 'string' && 'anyOf' in schema) {
    schema.title = key ?? 'Enum'
    schema.enum = []
    schema.anyOf.forEach(function (o: any) {
      schema.enum.push(o.const)
    })
    delete schema.anyOf
  }
}

export function flattenJSONSchema (schema: any): any {
  schema = hotfix(schema)
  // we should handle top level `oneOf`, `anyOf` and `allOf` first
  if ('oneOf' in schema || 'anyOf' in schema || 'allOf' in schema) {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const schemas = schema.oneOf || schema.anyOf || schema.allOf
    return schemas.reduce(function (accumulate: any, schema: any) {
      const flatten = flattenJSONSchema(schema)
      // we need to merge all the required array into a single array
      const required = [...accumulate.required ?? [], ...flatten.required ?? []]
      return { ...accumulate, ...flatten, required }
    }, {})
  }

  // we handle the full json schema only
  if ('type' in schema && 'properties' in schema) {
    return schema
  }

  // we do not like $ref as it is too complicated
  if ('$ref' in schema) {
    throw new Error('we do not support "$ref" currently.')
  }

  throw new Error('your json schema format maybe incorrect or using the shorten form.')
}

export interface ParameterSchema {
  name: string
  schema: Record<string, unknown>
  required: boolean
  expand: Record<string, unknown>
  consumes: string[]
}

export function convertJSONSchemaToParameterArray (schema: any): ParameterSchema[] {
  const flatten = flattenJSONSchema(schema)
  const required = Array.isArray(flatten.required) ? flatten.required : []
  const result: ParameterSchema[] = []

  for (const name of Object.keys(flatten.properties)) {
    result.push({
      name,
      schema: flatten.properties[name],
      required: required.includes(name),
      // we use 'x-expand' for additional options in parameter
      expand: flatten.properties[name]['x-expand'] ?? {},
      consumes: flatten.properties[name]['x-consumes'] ?? []
    })
  }

  return result
}

export function computeSecurityIgnore (
  documentSecurity?: OpenAPIV3.SecurityRequirementObject[],
  pathSecurity?: OpenAPIV3.SecurityRequirementObject[],
  securitySchemes?: {[key: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.SecuritySchemeObject}
): Record<string, string[]> {
  const securityIgnore: Record<string, string[]> = Object.create(null)
  const joinedSecurity = ([] as OpenAPIV3.SecurityRequirementObject[]).concat(documentSecurity ?? []).concat(pathSecurity ?? [])
  securitySchemes = securitySchemes ?? {}

  // performance reason, we initialize it first
  let i, j, keys, scheme
  for (i = 0; i < joinedSecurity.length; i++) {
    keys = Object.keys(joinedSecurity[i])
    for (j = 0; j < keys.length; j++) {
      scheme = securitySchemes[keys[j]]
      // we only handle ApiKeySecurityScheme
      if (typeof scheme === 'object' && 'name' in scheme && 'in' in scheme) {
        const { name, in: category } = scheme
        if (!Array.isArray(securityIgnore[category])) securityIgnore[category] = []
        securityIgnore[category].push(name)
      }
      // clean up
      scheme = undefined
    }
  }

  return securityIgnore
}
