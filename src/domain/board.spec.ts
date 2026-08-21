import { describe, expect, it } from 'vitest'
import { CENTER, createInitialPieces, createInitialState, isCenter, resolveStartedPlayer } from './board'

describe('board', () => {
  it('5 x 5 の端列に各陣営の5駒を配置する', () => {
    const pieces = createInitialPieces()

    expect(pieces).toHaveLength(10)
    expect(pieces.filter((piece) => piece.owner === 'com').map((piece) => piece.position.row)).toEqual([0, 0, 0, 0, 0])
    expect(pieces.filter((piece) => piece.owner === 'human').map((piece) => piece.position.row)).toEqual([4, 4, 4, 4, 4])
    expect(pieces.filter((piece) => piece.type === 'king').map((piece) => piece.position.col)).toEqual([2, 2])
  })

  it('手番順と乱数から先手を決める', () => {
    expect(resolveStartedPlayer('human-first')).toBe('human')
    expect(resolveStartedPlayer('com-first')).toBe('com')
    expect(resolveStartedPlayer('random', () => 0.49)).toBe('human')
    expect(resolveStartedPlayer('random', () => 0.5)).toBe('com')
  })

  it('初期局面を反復回数1で作る', () => {
    const state = createInitialState('human-first')
    expect(state.currentPlayer).toBe('human')
    expect(Object.values(state.positionCounts)).toEqual([1])
    expect(state.result).toEqual({ status: 'playing' })
  })

  it('中央マスを判定する', () => {
    expect(CENTER).toEqual({ row: 2, col: 2 })
    expect(isCenter(CENTER)).toBe(true)
    expect(isCenter({ row: 0, col: 0 })).toBe(false)
  })
})
