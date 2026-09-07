import { describe, expect, it } from 'vitest'
import { createInitialState } from './board'
import { advanceGame } from './game'
import { positionKey } from './position-key'
import type { GameState, Move, Piece } from './types'

const customState = (pieces: Piece[], overrides: Partial<GameState> = {}): GameState => ({
  pieces,
  currentPlayer: 'human',
  turnOrder: 'human-first',
  difficulty: 'easy',
  startedPlayer: 'human',
  positionCounts: {},
  result: { status: 'playing' },
  ...overrides,
})

const move = (pieceId: string, direction: Move['direction'], to: { row: number; col: number }): Move => ({
  pieceId,
  direction,
  from: { row: 4, col: 2 },
  to,
})

describe('game', () => {
  it('王様が中央へ停止すると勝利する', () => {
    const state = customState([
      { id: 'human-king', owner: 'human', type: 'king', position: { row: 4, col: 2 } },
      { id: 'com-king', owner: 'com', type: 'king', position: { row: 0, col: 0 } },
      { id: 'blocker', owner: 'com', type: 'soldier', position: { row: 1, col: 2 } },
    ])

    const next = advanceGame(state, move('human-king', 'north', { row: 2, col: 2 }))
    expect(next.result).toEqual({ status: 'won', winner: 'human' })
  })

  it('兵士が中央へ停止しても継続する', () => {
    const state = customState([
      { id: 'human-soldier', owner: 'human', type: 'soldier', position: { row: 4, col: 2 } },
      { id: 'com-king', owner: 'com', type: 'king', position: { row: 0, col: 0 } },
    ])

    const next = advanceGame(state, move('human-soldier', 'north', { row: 0, col: 2 }))
    expect(next.currentPlayer).toBe('com')
    expect(next.result).toEqual({ status: 'playing' })
  })

  it('次の手番に合法手がない場合はその陣営が敗北する', () => {
    const state = customState([
      { id: 'human-soldier', owner: 'human', type: 'soldier', position: { row: 4, col: 0 } },
      { id: 'human-a', owner: 'human', type: 'soldier', position: { row: 1, col: 1 } },
      { id: 'human-b', owner: 'human', type: 'soldier', position: { row: 1, col: 2 } },
      { id: 'human-c', owner: 'human', type: 'soldier', position: { row: 1, col: 3 } },
      { id: 'human-d', owner: 'human', type: 'soldier', position: { row: 1, col: 4 } },
      { id: 'com-king', owner: 'com', type: 'king', position: { row: 0, col: 0 } },
      { id: 'com-a', owner: 'com', type: 'soldier', position: { row: 0, col: 1 } },
      { id: 'com-b', owner: 'com', type: 'soldier', position: { row: 0, col: 2 } },
      { id: 'com-c', owner: 'com', type: 'soldier', position: { row: 0, col: 3 } },
      { id: 'com-d', owner: 'com', type: 'soldier', position: { row: 0, col: 4 } },
    ])

    const next = advanceGame(state, {
      pieceId: 'human-soldier',
      direction: 'north',
      from: { row: 4, col: 0 },
      to: { row: 1, col: 0 },
    })
    expect(next.result).toEqual({ status: 'lost', winner: 'human', loser: 'com' })
  })

  it('同じ局面が3回現れると引き分ける', () => {
    const initial = createInitialState('human-first')
    const repeatedKey = positionKey({
      pieces: initial.pieces.map((piece) => (piece.id === 'human-soldier-left' ? { ...piece, position: { row: 1, col: 0 } } : piece)),
      currentPlayer: 'com',
    })
    const state = { ...initial, positionCounts: { [repeatedKey]: 2 } }
    const humanMove: Move = { pieceId: 'human-soldier-left', direction: 'north', from: { row: 4, col: 0 }, to: { row: 1, col: 0 } }
    const next = advanceGame(state, humanMove)
    expect(next.result).toEqual({ status: 'draw', reason: 'repetition' })
  })

  it('実際の移動元と異なる不正手を拒否する', () => {
    const state = customState([
      { id: 'human-king', owner: 'human', type: 'king', position: { row: 4, col: 2 } },
      { id: 'com-king', owner: 'com', type: 'king', position: { row: 0, col: 0 } },
    ])

    expect(() =>
      advanceGame(state, {
        pieceId: 'human-king',
        direction: 'north',
        from: { row: 3, col: 2 },
        to: { row: 0, col: 2 },
      }),
    ).toThrow('Illegal move')
  })
})
