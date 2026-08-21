import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession, hasActiveSession, useGameSession } from './useGameSession'

let session: ReturnType<typeof useGameSession>

const Host = defineComponent({
  setup() {
    session = useGameSession()
    return () => null
  },
})

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

  it('COM 先手ではタイマー後にプレイヤーへ手番を戻す', async () => {
    vi.useFakeTimers()
    mount(Host)

    session.start('com-first')
    expect(session.state.value?.currentPlayer).toBe('com')
    expect(session.isBusy.value).toBe(true)

    vi.advanceTimersByTime(500)
    await nextTick()

    expect(session.state.value?.currentPlayer).toBe('human')
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
    expect(session.isBusy.value).toBe(true)
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
