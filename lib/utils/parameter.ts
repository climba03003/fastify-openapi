import { type DocumentGenerator } from '../document-generator'

export function flattenJSONSchema (that: DocumentGenerator, schema: any): any {
  // we should handle top level `oneOf`, `anyOf` and `allOf` first
  if ('oneOf' in schema || 'anyOf' in schema || 'allOf' in schema) {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const schemas = schema.oneOf || schema.anyOf || schema.allOf
    return schemas.reduce(function (accumulate: any, schema: any) {
      const flatten = flattenJSONSchema(that, schema)
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
    return that.runHook('onRefResolve', schema, {})
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

export function convertJSONSchemaToParameterArray (that: DocumentGenerator, schema: any): ParameterSchema[] {
  const flatten = flattenJSONSchema(that, schema)
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
