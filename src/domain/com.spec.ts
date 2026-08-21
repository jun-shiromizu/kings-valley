import { describe, expect, it } from 'vitest'
import { createInitialState } from './board'
import { chooseRandomMove } from './com'

describe('com', () => {
  it('合法手から選び、乱数1でも配列外にならない', () => {
    const state = createInitialState('com-first')
    const chosen = chooseRandomMove(state, 'com', () => 1)
    expect(chosen).toBeDefined()
    expect(chosen?.pieceId.startsWith('com-')).toBe(true)
  })

  it('合法手がない場合はundefinedを返す', () => {
    const state = createInitialState('human-first')
    const chosen = chooseRandomMove({ ...state, pieces: [] }, 'com', () => 0.5)
    expect(chosen).toBeUndefined()
  })
})
