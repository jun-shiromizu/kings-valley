import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLegalMovesForPiece } from '../domain'
import type { Difficulty, GameState } from '../domain'
import { clearSession, hasActiveSession, useGameSession } from './useGameSession'

let session: ReturnType<typeof useGameSession>

const Host = defineComponent({
  setup() {
    session = useGameSession()
    return () => null
  },
})

const GameHost = defineComponent({
  setup() {
    useGameSession()
    return () => null
  },
})

const mountGameHost = () => {
  window.location.hash = '#/game'
  return mount(GameHost)
}

const tacticalState = (difficulty: Difficulty): GameState => ({
  pieces: [
    { id: 'com-king', owner: 'com', type: 'king', position: { row: 0, col: 0 } },
    { id: 'com-soldier', owner: 'com', type: 'soldier', position: { row: 1, col: 2 } },
    { id: 'human-king', owner: 'human', type: 'king', position: { row: 4, col: 2 } },
  ],
  currentPlayer: 'com',
  turnOrder: 'com-first',
  difficulty,
  startedPlayer: 'com',
  positionCounts: {},
  result: { status: 'playing' },
})

const immediateWinState = (difficulty: Difficulty): GameState => ({
  pieces: [
    { id: 'com-king', owner: 'com', type: 'king', position: { row: 0, col: 2 } },
    { id: 'human-blocker', owner: 'human', type: 'soldier', position: { row: 3, col: 2 } },
    { id: 'human-king', owner: 'human', type: 'king', position: { row: 4, col: 4 } },
  ],
  currentPlayer: 'com',
  turnOrder: 'com-first',
  difficulty,
  startedPlayer: 'com',
  positionCounts: {},
  result: { status: 'playing' },
})

const comPiecePositions = () =>
  session.state
    .value!.pieces.filter((piece) => piece.owner === 'com')
    .map((piece) => `${piece.id}:${piece.position.row}:${piece.position.col}`)

const movedComPiece = (initialState: GameState) => {
  const movedPieces = session.state.value!.pieces.filter((piece) => {
    const initialPiece = initialState.pieces.find((candidate) => candidate.id === piece.id)
    return (
      piece.owner === 'com' &&
      initialPiece !== undefined &&
      (initialPiece.position.row !== piece.position.row || initialPiece.position.col !== piece.position.col)
    )
  })

  expect(movedPieces).toHaveLength(1)
  return movedPieces[0]
}

const expectOneLegalComPieceMoved = (initialState: GameState) => {
  const movedPiece = movedComPiece(initialState)
  const initialPiece = initialState.pieces.find((piece) => piece.id === movedPiece.id)
  if (!initialPiece) throw new Error('Initial COM piece was not found')

  expect(
    getLegalMovesForPiece(initialState, initialPiece).some(
      (move) => move.to.row === movedPiece.position.row && move.to.col === movedPiece.position.col,
    ),
  ).toBe(true)
}

describe('useGameSession', () => {
  beforeEach(() => {
    vi.useRealTimers()
    window.location.hash = '#/'
    clearSession()
  })

  it.each(['easy', 'normal', 'hard'] as const)('難易度 %s を指定して開始時の状態に保持する', (difficulty) => {
    mount(Host)

    session.start('human-first', difficulty)

    expect(session.state.value?.difficulty).toBe(difficulty)
    expect(session.state.value?.startedPlayer).toBe('human')
    expect(session.state.value?.currentPlayer).toBe('human')
  })

  it('注入した乱数でランダム先手と難易度を保持した再戦時の再抽選を制御する', () => {
    mount(Host)
    const values = [0.1, 0.9]
    const random = () => values.shift() ?? 0

    session.start('random', 'hard', random)
    expect(session.state.value?.startedPlayer).toBe('human')
    session.rematch()

    expect(session.state.value?.startedPlayer).toBe('com')
    expect(session.state.value?.difficulty).toBe('hard')
  })

  it.each(['normal', 'hard'] as const)('%s は予約済みの COM 着手で即時勝利を選ぶ', async (difficulty) => {
    vi.useFakeTimers()
    mount(Host)

    session.start('com-first', difficulty, () => 0)
    const initialState = immediateWinState(difficulty)
    session.state.value = initialState
    vi.advanceTimersByTime(500)
    await nextTick()

    expect(movedComPiece(initialState)).toMatchObject({ id: 'com-king', position: { row: 2, col: 2 } })
    expect(session.state.value?.result).toEqual({ status: 'won', winner: 'com' })
    expect(session.isBusy.value).toBe(false)
  })

  it.each(['normal', 'hard'] as const)('%s は予約済みの COM 着手で即時脅威を防御する', async (difficulty) => {
    vi.useFakeTimers()
    mount(Host)

    session.start('com-first', difficulty, () => 0)
    const initialState = tacticalState(difficulty)
    session.state.value = initialState
    vi.advanceTimersByTime(500)
    await nextTick()

    expect(movedComPiece(initialState).id).toBe('com-soldier')
    expect(session.state.value?.currentPlayer).toBe('human')
    expect(session.isBusy.value).toBe(false)
  })

  it('EASY の予約済み COM 着手は同じ脅威を防御手として特別扱いしない', async () => {
    vi.useFakeTimers()
    mount(Host)

    session.start('com-first', 'easy', () => 0)
    const initialState = tacticalState('easy')
    session.state.value = initialState
    vi.advanceTimersByTime(500)
    await nextTick()

    expect(movedComPiece(initialState).id).toBe('com-king')
    expect(session.state.value?.currentPlayer).toBe('human')
  })

  it.each(['easy', 'normal', 'hard'] as const)('%s でも COM は合法手だけを指す', async (difficulty) => {
    vi.useFakeTimers()
    mount(Host)

    session.start('com-first', difficulty, () => 0)
    const initialState = session.state.value!
    vi.advanceTimersByTime(500)
    await nextTick()

    expectOneLegalComPieceMoved(initialState)
    expect(session.state.value?.currentPlayer).toBe('human')
  })

  it('開始画面の破棄後もゲーム画面が予約済み COM 着手を保持する', async () => {
    vi.useFakeTimers()
    const startHost = mount(Host)

    session.start('com-first')
    const initialState = session.state.value!
    const gameHost = mountGameHost()
    startHost.unmount()
    vi.advanceTimersByTime(500)
    await nextTick()

    expectOneLegalComPieceMoved(initialState)
    expect(session.state.value?.currentPlayer).toBe('human')
    expect(session.isBusy.value).toBe(false)
    gameHost.unmount()
  })

  it('ゲーム画面への再入場時に中断した COM 先手対局の初手を再予約する', async () => {
    vi.useFakeTimers()
    const startHost = mount(Host)

    session.start('com-first')
    const firstGameHost = mountGameHost()
    startHost.unmount()
    firstGameHost.unmount()

    window.location.hash = '#/'
    const topHost = mount(Host)
    const initialState = session.state.value!
    vi.advanceTimersByTime(500)
    await nextTick()

    expect(comPiecePositions()).toEqual(
      initialState.pieces
        .filter((piece) => piece.owner === 'com')
        .map((piece) => `${piece.id}:${piece.position.row}:${piece.position.col}`),
    )
    expect(session.state.value?.currentPlayer).toBe('com')

    const resumedGameHost = mountGameHost()
    expect(session.isBusy.value).toBe(true)
    vi.advanceTimersByTime(500)
    await nextTick()

    expectOneLegalComPieceMoved(initialState)
    expect(session.state.value?.currentPlayer).toBe('human')
    expect(session.isBusy.value).toBe(false)
    topHost.unmount()
    resumedGameHost.unmount()
  })

  it('ゲーム画面の破棄時は予約済み COM 着手を取り消す', async () => {
    vi.useFakeTimers()
    mount(Host)

    session.start('com-first')
    const initialState = session.state.value!
    const gameHost = mountGameHost()
    gameHost.unmount()
    vi.advanceTimersByTime(500)
    await nextTick()

    expect(session.state.value).toEqual(initialState)
    expect(session.isBusy.value).toBe(false)
  })

  it('dispose 後は予約済み COM 着手を実行しない', async () => {
    vi.useFakeTimers()
    mount(Host)

    session.start('com-first')
    session.dispose()
    vi.advanceTimersByTime(500)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(false)
  })

  it('clearSession で対局状態と選択状態を破棄する', () => {
    mount(Host)
    session.start('human-first')
    clearSession()

    expect(hasActiveSession()).toBe(false)
    expect(session.state.value).toBeNull()
    expect(session.selectedPieceId.value).toBeNull()
    expect(session.isBusy.value).toBe(false)
  })
})
