export function flattenJSONSchema (schema: any): any {
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
      expand: flatten.properties[name]['x-expand'] ?? {}
    })
  }

  return result
}
