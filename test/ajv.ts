import { openapiV3 } from '@apidevtools/openapi-schemas'
import Ajv from 'ajv-draft-04'
import AjvFormats from 'ajv-formats'

const ajv = new Ajv({ strict: false })
AjvFormats(ajv, { mode: 'full' })
export const validate = ajv.compile(openapiV3)
