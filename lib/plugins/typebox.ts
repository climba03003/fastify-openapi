import { type DocumentGeneratorPlugin } from '../document-generator'

export const TypeboxPlugin: DocumentGeneratorPlugin = function (instance) {
  instance.addHook('onTransform', function (_, schema: any) {
    return hotfix(schema)
  })

  function hotfix (schema: any, k?: string): any {
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

  function typeboxEnumHotfix (schema: any, key?: string): any {
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
}
