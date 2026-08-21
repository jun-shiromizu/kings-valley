import { describe, expect, it } from 'vitest'
import { createInitialState, findPiece } from './board'
import { getLegalMovesForPiece, getMoveForDirection } from './moves'
import type { GameState, Piece } from './types'

const piece = (position: { row: number; col: number }, overrides: Partial<Piece> = {}): Piece => ({
  id: overrides.id ?? 'human-king',
  owner: overrides.owner ?? 'human',
  type: overrides.type ?? 'king',
  position,
})

const stateWith = (pieces: Piece[]): Pick<GameState, 'pieces'> => ({ pieces })

describe('moves', () => {
  it.each([
    ['north', { row: 0, col: 2 }],
    ['northeast', { row: 0, col: 4 }],
    ['east', { row: 2, col: 4 }],
    ['southeast', { row: 4, col: 4 }],
    ['south', { row: 4, col: 2 }],
    ['southwest', { row: 4, col: 0 }],
    ['west', { row: 2, col: 0 }],
    ['northwest', { row: 0, col: 0 }],
  ] as const)('中央から%s方向へ盤端まで停止する', (direction, destination) => {
    const moving = piece({ row: 2, col: 2 })
    const move = getMoveForDirection(stateWith([moving]), moving, direction)

    expect(move?.to).toEqual(destination)
  })

  it('初期配置の王様は空いている方向へ盤端まで滑る', () => {
    const state = createInitialState('human-first')
    const king = findPiece(state, 'human-king')
    expect(king).toBeDefined()

    const moves = getLegalMovesForPiece(state, king!)
    expect(moves.map((move) => move.direction)).toEqual(['north', 'northeast', 'northwest'])
    expect(moves.find((move) => move.direction === 'north')?.to).toEqual({ row: 1, col: 2 })
    expect(moves.find((move) => move.direction === 'northeast')?.to).toEqual({ row: 2, col: 4 })
  })

  it('他駒の直前で停止し、飛び越し方向を作らない', () => {
    const moving = piece({ row: 2, col: 0 })
    const blocker = piece({ row: 2, col: 3 }, { id: 'com-soldier', owner: 'com', type: 'soldier' })
    const move = getMoveForDirection(stateWith([moving, blocker]), moving, 'east')

    expect(move?.to).toEqual({ row: 2, col: 2 })
    expect(
      getMoveForDirection(stateWith([moving, piece({ row: 2, col: 1 }, { id: 'blocker', owner: 'com', type: 'soldier' })]), moving, 'east'),
    ).toBeUndefined()
  })

  it('隣接する駒で方向を塞ぎ、他駒を飛び越えず重ならない', () => {
    const moving = piece({ row: 2, col: 2 })
    const adjacentBlocker = piece({ row: 2, col: 3 }, { id: 'adjacent-blocker', owner: 'com', type: 'soldier' })
    const distantBlocker = piece({ row: 0, col: 2 }, { id: 'distant-blocker', owner: 'com', type: 'soldier' })
    const state = stateWith([moving, adjacentBlocker, distantBlocker])

    expect(getMoveForDirection(state, moving, 'east')).toBeUndefined()
    expect(getMoveForDirection(state, moving, 'north')?.to).toEqual({ row: 1, col: 2 })
    expect(getMoveForDirection(state, moving, 'north')?.to).not.toEqual(distantBlocker.position)
  })

  it('中央マスを通過できる', () => {
    const moving = piece({ row: 4, col: 2 })
    const move = getMoveForDirection(stateWith([moving]), moving, 'north')
    expect(move?.to).toEqual({ row: 0, col: 2 })
  })

  it('中央マスで停止できる', () => {
    const moving = piece({ row: 2, col: 0 })
    const blocker = piece({ row: 2, col: 3 }, { id: 'blocker', owner: 'com', type: 'soldier' })
    const move = getMoveForDirection(stateWith([moving, blocker]), moving, 'east')

    expect(move?.to).toEqual({ row: 2, col: 2 })
  })

  it('入力状態を破壊しない', () => {
    const moving = piece({ row: 4, col: 2 })
    const before = JSON.stringify(moving)
    getMoveForDirection(stateWith([moving]), moving, 'north')
    expect(JSON.stringify(moving)).toBe(before)
  })
})
