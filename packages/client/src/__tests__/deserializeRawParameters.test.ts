import { Decimal } from '@prisma/client-runtime-utils'

import { deserializeRawParameters } from '../runtime/utils/deserializeRawParameters'
import { serializeRawParameters } from '../runtime/utils/serializeRawParameters'

function roundTrip(data: any[]) {
  return deserializeRawParameters(serializeRawParameters(data))
}

describe('deserializeRawParameters', () => {
  test('empty array', () => {
    expect(deserializeRawParameters('[]')).toEqual([])
  })

  describe.each([
    {
      name: 'primitives',
      input: [0, 1, true, false, '', 'hi', null, undefined],
      expected: [0, 1, true, false, '', 'hi', null, null],
    },
    {
      name: 'BigInt',
      input: [BigInt('321804719213721')],
      expected: [BigInt('321804719213721')],
    },
    {
      name: 'Date',
      input: [new Date('2020-06-22T17:07:16.348Z')],
      expected: [new Date('2020-06-22T17:07:16.348Z')],
    },
    {
      name: 'Decimal',
      input: [new Decimal('1.1')],
      expected: [new Decimal('1.1')],
    },
    {
      name: 'Buffer',
      input: [Buffer.from('hello')],
      expected: [Buffer.from('hello')],
    },
    {
      name: 'Uint8Array',
      input: [Uint8Array.of(0x75, 0x69, 0x6e, 0x74, 0x38)],
      expected: [Buffer.from('uint8')],
    },
    {
      name: 'ArrayBuffer',
      input: (() => {
        const arrayBuffer = new ArrayBuffer(6)
        const array = new Uint8Array(arrayBuffer)
        array.set([0x62, 0x75, 0x66, 0x66, 0x65, 0x72])
        return [arrayBuffer]
      })(),
      expected: [Buffer.from('buffer')],
    },
    {
      name: 'nested arrays',
      input: [[[BigInt('456')], [new Date('2021-12-25T00:00:00.000Z')]]],
      expected: [[[BigInt('456')], [new Date('2021-12-25T00:00:00.000Z')]]],
    },
    {
      name: 'mixed types in arrays',
      input: [
        [BigInt('123'), new Date('2020-01-01'), new Decimal('1.5')],
        [Buffer.from('test'), 'normal string', 42],
      ],
      expected: [
        [BigInt('123'), new Date('2020-01-01'), new Decimal('1.5')],
        [Buffer.from('test'), 'normal string', 42],
      ],
    },
  ])('fast serialization mode: $name', ({ input, expected }) => {
    test('round-trip', () => {
      expect(roundTrip(input)).toEqual(expected)
    })
  })

  describe.each([
    {
      name: 'object with BigInt property',
      input: [{ bigIntValue: BigInt('456'), name: 'test' }],
      expected: [{ bigIntValue: '456', name: 'test' }],
    },
    {
      name: 'object with array containing BigInts',
      input: [{ values: [BigInt('123'), new Date('2020-01-01')], name: 'test' }],
      expected: [{ values: ['123', '2020-01-01T00:00:00.000Z'], name: 'test' }],
    },
    {
      name: 'object with nested special types',
      input: [
        {
          date: new Date('2020-06-22T17:07:16.348Z'),
          bigInt: BigInt('321804719213721'),
          buffer: Buffer.from('hello'),
        },
      ],
      expected: [
        {
          date: '2020-06-22T17:07:16.348Z',
          bigInt: '321804719213721',
          buffer: { type: 'Buffer', data: [104, 101, 108, 108, 111] },
        },
      ],
    },
  ])('slow serialization mode: $name', ({ input, expected }) => {
    test('round-trip', () => {
      expect(roundTrip(input)).toEqual(expected)
    })
  })
})
