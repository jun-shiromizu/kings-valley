import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import GameResultDialog from './GameResultDialog.vue'

describe('GameResultDialog', () => {
  it.each([
    [{ status: 'won', winner: 'human' }, 'あなたの勝利', '王様が中央に到達しました。'],
    [{ status: 'lost', winner: 'com', loser: 'human' }, 'COM の勝利', 'COM の王様が中央に到達しました。'],
    [{ status: 'draw', reason: 'repetition' }, '引き分け', '同じ局面が3回現れました。'],
  ] as const)('終局種別 %s に対応する文言を表示する', (result, title, message) => {
    const wrapper = mount(GameResultDialog, { props: { result } })

    expect(wrapper.get('[role="dialog"] h2').text()).toBe(title)
    expect(wrapper.get('[role="dialog"] p').text()).toBe(message)
    expect(wrapper.findAll('button')).toHaveLength(2)
  })

  it('終局結果を表示し、ダイアログへフォーカスを移す', async () => {
    const wrapper = mount(GameResultDialog, {
      props: { result: { status: 'playing' } },
      attachTo: document.body,
    })

    await wrapper.setProps({ result: { status: 'won', winner: 'human' } })
    await nextTick()

    expect(wrapper.get('[role="dialog"]').text()).toContain('あなたの勝利')
    expect(document.activeElement).toBe(wrapper.get('[role="dialog"]').element)
  })

  it('再戦とトップページの操作を parent host 経由で通知する', async () => {
    const onRematch = vi.fn()
    const onTop = vi.fn()
    const Host = {
      components: { GameResultDialog },
      setup: () => ({
        onRematch,
        onTop,
        result: { status: 'draw', reason: 'repetition' } as const,
      }),
      template: '<GameResultDialog :result="result" @rematch="onRematch" @top="onTop" />',
    }

    const wrapper = mount(Host)
    const buttons = wrapper.findAll('button')
    await buttons[0]!.trigger('click')
    await buttons[1]!.trigger('click')

    expect(onRematch).toHaveBeenCalledTimes(1)
    expect(onTop).toHaveBeenCalledTimes(1)
  })
})
