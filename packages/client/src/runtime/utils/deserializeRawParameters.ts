import { Decimal } from '@prisma/client-runtime-utils'

export function deserializeRawParameters(serializedParameters: string): any[] {
  const parsed = JSON.parse(serializedParameters)
  return parsed.map((parameter: unknown) => decodeParameter(parameter))
}

function decodeParameter(parameter: unknown): unknown {
  if (Array.isArray(parameter)) {
    return parameter.map((item) => decodeParameter(item))
  }

  if (
    typeof parameter === 'object' &&
    parameter !== null &&
    'prisma__type' in parameter &&
    'prisma__value' in parameter
  ) {
    switch (parameter.prisma__type) {
      case 'bigint':
        return BigInt(`${parameter.prisma__value}`)

      case 'date':
        return new Date(`${parameter.prisma__value}`)

      case 'decimal':
        return new Decimal(`${parameter.prisma__value}`)

      case 'bytes':
        return Buffer.from(`${parameter.prisma__value}`, 'base64')

      default:
        return parameter
    }
  }

  return parameter
}
