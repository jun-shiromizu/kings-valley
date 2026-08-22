import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession, hasActiveSession, useGameSession } from './useGameSession'
import { createInitialState, findPiece, getLegalMovesForPiece, type GameState } from '../domain'

let session: ReturnType<typeof useGameSession>

type StateSnapshot = {
  currentPlayer: GameState['currentPlayer']
  pieces: Array<{
    id: string
    row: number
    col: number
  }>
}

const Host = defineComponent({
  setup() {
    session = useGameSession()
    return () => null
  },
})

const snapshotState = (state: GameState): StateSnapshot => ({
  currentPlayer: state.currentPlayer,
  pieces: state.pieces.map((piece) => ({
    id: piece.id,
    row: piece.position.row,
    col: piece.position.col,
  })),
})

const expectSnapshotMatches = (state: GameState, snapshot: StateSnapshot) => {
  expect(snapshotState(state)).toEqual(snapshot)
}

const expectSingleLegalComMove = (beforeMove: GameState, afterMove: GameState) => {
  const beforeById = new Map(beforeMove.pieces.map((piece) => [piece.id, piece.position]))
  const movedPieces = afterMove.pieces.filter((piece) => {
    const before = beforeById.get(piece.id)
    return before?.row !== piece.position.row || before?.col !== piece.position.col
  })

  expect(movedPieces).toHaveLength(1)

  const movedPiece = movedPieces[0]
  expect(movedPiece?.owner).toBe('com')

  const beforePiece = findPiece(beforeMove, movedPiece!.id)
  expect(beforePiece).not.toBeNull()

  const legalMoves = getLegalMovesForPiece(beforeMove, beforePiece!)
  expect(legalMoves).toContainEqual(
    expect.objectContaining({
      pieceId: movedPiece!.id,
      to: { row: movedPiece!.position.row, col: movedPiece!.position.col },
    }),
  )
}

describe('useGameSession', () => {
  beforeEach(() => {
    vi.useRealTimers()
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

  it('ランダムでCOM先手になった開始では start 直後は待機し、activateComTurn 後に合法な初手を1回だけ実行する', async () => {
    vi.useFakeTimers()
    mount(Host)

    const randomValues = [0.9, 0]
    const random = () => randomValues.shift() ?? 0
    session.start('random', random)
    const initialState = session.state.value!
    const initialSnapshot = snapshotState(initialState)

    expect(session.state.value?.turnOrder).toBe('random')
    expect(session.state.value?.startedPlayer).toBe('com')
    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(false)

    vi.advanceTimersByTime(500)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(false)
    expectSnapshotMatches(session.state.value!, initialSnapshot)

    session.activateComTurn()
    expect(session.isBusy.value).toBe(true)

    vi.advanceTimersByTime(499)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(true)
    expectSnapshotMatches(session.state.value!, initialSnapshot)

    vi.advanceTimersByTime(1)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('human')
    expect(session.isBusy.value).toBe(false)
    expectSingleLegalComMove(initialState, session.state.value!)
  })

  it('COM先手の再戦は待機状態になり、500ms後に合法なCOM初手を1回だけ実行して人間へ手番を戻す', async () => {
    vi.useFakeTimers()
    mount(Host)

    session.start('com-first', () => 0)
    session.activateComTurn()
    vi.advanceTimersByTime(500)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('human')

    session.rematch()
    const rematchInitialState = session.state.value!
    const rematchSnapshot = snapshotState(rematchInitialState)

    expect(session.state.value?.turnOrder).toBe('com-first')
    expect(session.state.value?.startedPlayer).toBe('com')
    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(true)

    vi.advanceTimersByTime(499)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(true)
    expectSnapshotMatches(session.state.value!, rematchSnapshot)

    vi.advanceTimersByTime(1)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('human')
    expect(session.isBusy.value).toBe(false)
    expectSingleLegalComMove(rematchInitialState, session.state.value!)

    const afterComMoveSnapshot = snapshotState(session.state.value!)
    vi.advanceTimersByTime(1000)
    await nextTick()
    expectSnapshotMatches(session.state.value!, afterComMoveSnapshot)
  })

  it('人間先手の再戦はすぐ操作でき、人間の1手に対して500ms後にCOMが合法な応手を1回だけ返す', async () => {
    vi.useFakeTimers()
    mount(Host)

    session.start('human-first', () => 0)
    const firstHumanKing = findPiece(session.state.value!, 'human-king')!
    session.selectPiece(firstHumanKing)
    session.moveSelectedPiece(getLegalMovesForPiece(session.state.value!, firstHumanKing)[0]!)
    vi.advanceTimersByTime(500)
    await nextTick()

    session.rematch()
    const rematchInitialState = session.state.value!
    const rematchSnapshot = snapshotState(rematchInitialState)
    const humanKing = findPiece(rematchInitialState, 'human-king')!
    const move = getLegalMovesForPiece(rematchInitialState, humanKing)[0]!

    expect(session.state.value?.turnOrder).toBe('human-first')
    expect(session.state.value?.startedPlayer).toBe('human')
    expect(session.state.value?.currentPlayer).toBe('human')
    expect(session.isBusy.value).toBe(false)
    expectSnapshotMatches(session.state.value!, rematchSnapshot)

    session.selectPiece(humanKing)
    session.moveSelectedPiece(move)
    const stateAfterHumanMove = session.state.value!
    const stateAfterHumanMoveSnapshot = snapshotState(stateAfterHumanMove)

    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(true)

    vi.advanceTimersByTime(499)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(true)
    expectSnapshotMatches(session.state.value!, stateAfterHumanMoveSnapshot)

    vi.advanceTimersByTime(1)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('human')
    expect(session.isBusy.value).toBe(false)
    expectSingleLegalComMove(stateAfterHumanMove, session.state.value!)

    const afterComMoveSnapshot = snapshotState(session.state.value!)
    vi.advanceTimersByTime(1000)
    await nextTick()
    expectSnapshotMatches(session.state.value!, afterComMoveSnapshot)
  })

  it('COM 先手では start 直後は着手を予約せず、activateComTurn で待ち時間後にちょうど1手だけ初手を指してプレイヤーへ手番を戻す', async () => {
    vi.useFakeTimers()
    mount(Host)

    session.start('com-first', () => 0)
    const initialState = session.state.value!
    const initialSnapshot = snapshotState(initialState)

    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(false)

    vi.advanceTimersByTime(500)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(false)
    expectSnapshotMatches(session.state.value!, initialSnapshot)

    session.activateComTurn()
    expect(session.isBusy.value).toBe(true)

    vi.advanceTimersByTime(499)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(true)
    expectSnapshotMatches(session.state.value!, initialSnapshot)

    vi.advanceTimersByTime(1)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('human')
    expect(session.isBusy.value).toBe(false)
    expectSingleLegalComMove(initialState, session.state.value!)
  })

  it('ユーザー先手では開始直後にCOM着手を予約しない', async () => {
    vi.useFakeTimers()
    mount(Host)

    session.start('human-first')
    const initialSnapshot = snapshotState(session.state.value!)

    vi.advanceTimersByTime(500)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('human')
    expect(session.isBusy.value).toBe(false)
    expectSnapshotMatches(session.state.value!, initialSnapshot)
  })

  it('人間が着手すると moveSelectedPiece だけで待ち時間後にCOMの応手を予約して実行する', async () => {
    vi.useFakeTimers()
    mount(Host)

    session.start('human-first', () => 0)
    const humanKing = findPiece(session.state.value!, 'human-king')!
    session.selectPiece(humanKing)
    const move = getLegalMovesForPiece(session.state.value!, humanKing)[0]!

    session.moveSelectedPiece(move)
    const stateAfterHumanMove = session.state.value!
    const stateAfterHumanMoveSnapshot = snapshotState(stateAfterHumanMove)

    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(true)

    vi.advanceTimersByTime(499)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(true)
    expectSnapshotMatches(session.state.value!, stateAfterHumanMoveSnapshot)

    vi.advanceTimersByTime(1)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('human')
    expect(session.isBusy.value).toBe(false)
    expectSingleLegalComMove(stateAfterHumanMove, session.state.value!)
  })

  it('dispose は明示的なタイマー破棄 API として動作する', async () => {
    vi.useFakeTimers()
    mount(Host)

    session.start('com-first', () => 0)
    session.activateComTurn()

    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(true)

    session.dispose()
    vi.advanceTimersByTime(500)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(false)
  })

  it('アンマウント時に予約済みCOM着手を破棄する', async () => {
    vi.useFakeTimers()
    const wrapper = mount(Host)

    session.start('com-first', () => 0)
    session.activateComTurn()
    wrapper.unmount()
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

  it('COM初手待ち中に画面を離れても、新しい人間先手の開始で旧タイマーが盤面を変化させない', async () => {
    vi.useFakeTimers()
    const wrapper = mount(Host)

    session.start('com-first', () => 0)
    session.activateComTurn()
    wrapper.unmount()

    const nextWrapper = mount(Host)
    session.start('human-first', () => 0)
    const humanFirstSnapshot = snapshotState(session.state.value!)
    const expectedInitialHumanFirst = snapshotState(createInitialState('human-first', () => 0))

    vi.advanceTimersByTime(700)
    await nextTick()

    expectSnapshotMatches(session.state.value!, humanFirstSnapshot)
    expect(session.state.value?.currentPlayer).toBe('human')
    expect(session.isBusy.value).toBe(false)
    expect(snapshotState(session.state.value!)).toEqual(expectedInitialHumanFirst)

    nextWrapper.unmount()
  })
})
