import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLegalMovesForPiece } from '../domain'
import type { GameState } from '../domain'
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

const comPiecePositions = () =>
  session.state.value!.pieces
    .filter((piece) => piece.owner === 'com')
    .map((piece) => `${piece.id}:${piece.position.row}:${piece.position.col}`)

const expectOneComPieceMoved = (initialState: GameState) => {
  const currentState = session.state.value!
  const movedComPieces = currentState.pieces.filter((piece) => {
    if (piece.owner !== 'com') return false

    const initialPiece = initialState.pieces.find((candidate) => candidate.id === piece.id)
    return (
      initialPiece !== undefined &&
      (initialPiece.position.row !== piece.position.row || initialPiece.position.col !== piece.position.col)
    )
  })

  expect(movedComPieces).toHaveLength(1)

  const movedPiece = movedComPieces[0]
  const initialPiece = initialState.pieces.find((piece) => piece.id === movedPiece.id)
  if (!initialPiece) throw new Error('Initial COM piece was not found')

  const isLegalMove = getLegalMovesForPiece(initialState, initialPiece).some(
    (move) => move.to.row === movedPiece.position.row && move.to.col === movedPiece.position.col,
  )
  expect(isLegalMove).toBe(true)
}

describe('useGameSession', () => {
  beforeEach(() => {
    vi.useRealTimers()
    window.location.hash = '#/'
    clearSession()
  })

  it('手番順を指定して開始時の状態を生成する', () => {
    mount(Host)

    session.start('human-first')

    expect(session.state.value?.turnOrder).toBe('human-first')
    expect(session.state.value?.startedPlayer).toBe('human')
    expect(session.state.value?.currentPlayer).toBe('human')
    expect(session.isBusy.value).toBe(false)
  })

  it('注入した乱数でランダム先手と再戦時の再抽選を制御する', () => {
    mount(Host)
    const randomValues = [0.1, 0.9]
    const random = () => randomValues.shift() ?? 0

    session.start('random', random)
    expect(session.state.value?.startedPlayer).toBe('human')

    session.rematch()
    expect(session.state.value?.startedPlayer).toBe('com')
  })

  it.each([
    ['human-first', 'human'],
    ['com-first', 'com'],
  ] as const)('先手設定 %s の再戦で同じ設定を使う', (turnOrder, startedPlayer) => {
    vi.useFakeTimers()
    mount(Host)

    session.start(turnOrder)
    session.rematch()

    expect(session.state.value?.turnOrder).toBe(turnOrder)
    expect(session.state.value?.startedPlayer).toBe(startedPlayer)
    session.dispose()
  })

  it(
    'COM 先手ではタイマー後に COM の駒を1個だけ合法な位置へ動かしてプレイヤーへ手番を戻す',
    async () => {
      vi.useFakeTimers()
      mount(Host)

      session.start('com-first', () => 0)
      const initialState = session.state.value!

      expect(session.state.value?.currentPlayer).toBe('com')
      expect(session.isBusy.value).toBe(true)

      vi.advanceTimersByTime(500)
      await nextTick()

      expectOneComPieceMoved(initialState)
      expect(session.state.value?.currentPlayer).toBe('human')
      expect(session.isBusy.value).toBe(false)
    },
  )

  it(
    'ランダム設定で COM 先手を固定しても初手の COM 駒を1個だけ合法な位置へ動かす',
    async () => {
      vi.useFakeTimers()
      mount(Host)

      session.start('random', () => 0.9)
      const initialState = session.state.value!

      expect(session.state.value?.startedPlayer).toBe('com')

      vi.advanceTimersByTime(500)
      await nextTick()

      expectOneComPieceMoved(initialState)
      expect(session.state.value?.currentPlayer).toBe('human')
      expect(session.isBusy.value).toBe(false)
    },
  )

  it('開始画面の破棄後もゲーム画面が予約済み COM 着手を保持する', async () => {
    vi.useFakeTimers()
    const startHost = mount(Host)

    session.start('com-first')
    const initialState = session.state.value!
    const gameHost = mountGameHost()
    startHost.unmount()
    vi.advanceTimersByTime(500)
    await nextTick()

    expectOneComPieceMoved(initialState)
    expect(session.state.value?.currentPlayer).toBe('human')
    expect(session.isBusy.value).toBe(false)
    gameHost.unmount()
  })

  it('ゲーム画面の破棄時は予約済み COM 着手を取り消す', async () => {
    vi.useFakeTimers()
    mount(Host)

    session.start('com-first')
    const initialPositions = comPiecePositions()
    const gameHost = mountGameHost()
    gameHost.unmount()
    vi.advanceTimersByTime(500)
    await nextTick()

    expect(comPiecePositions()).toEqual(initialPositions)
    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(false)
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

    expectOneComPieceMoved(initialState)
    expect(session.state.value?.currentPlayer).toBe('human')
    expect(session.isBusy.value).toBe(false)
    topHost.unmount()
    resumedGameHost.unmount()
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
