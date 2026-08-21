import { describe, expect, it } from 'vitest'
import { positionKey } from './position-key'
import type { GameState } from './types'

describe('positionKey', () => {
  it('駒配列の順序に依存しない', () => {
    const base: Pick<GameState, 'pieces' | 'currentPlayer'> = {
      currentPlayer: 'human',
      pieces: [
        { id: 'b', owner: 'com', type: 'king', position: { row: 0, col: 0 } },
        { id: 'a', owner: 'human', type: 'king', position: { row: 4, col: 4 } },
      ],
    }
    expect(positionKey(base)).toBe(positionKey({ ...base, pieces: [...base.pieces].reverse() }))
  })
})
