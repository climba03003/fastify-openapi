import { OpenAPIV3 } from 'openapi-types'

export function computeSecurityIgnore (
  documentSecurity?: OpenAPIV3.SecurityRequirementObject[],
  pathSecurity?: OpenAPIV3.SecurityRequirementObject[],
  securitySchemes?: { [key: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.SecuritySchemeObject }
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
