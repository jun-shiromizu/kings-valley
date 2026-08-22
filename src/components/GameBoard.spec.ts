import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import GameBoard from './GameBoard.vue'
import { createInitialState, findPiece, getLegalMovesForPiece } from '../domain'

const createProps = () => {
  const state = createInitialState('human-first')
  const humanKing = findPiece(state, 'human-king')!

  return {
    state,
    humanKing,
    selectedMoves: getLegalMovesForPiece(state, humanKing),
  }
}

describe('GameBoard', () => {
  it('5 x 5 の盤面、中央、10個の駒を表示する', () => {
    const { state } = createProps()
    const wrapper = mount(GameBoard, {
      props: {
        state,
        selectedPieceId: null,
        selectedMoves: [],
        disabled: false,
      },
    })

    expect(wrapper.findAll('[role="gridcell"]')).toHaveLength(25)
    expect(wrapper.findAll('.piece')).toHaveLength(10)
    expect(wrapper.get('[aria-label="2行2列 中央"]').exists()).toBe(true)
    expect(wrapper.get('[aria-label="あなたの王様"]').exists()).toBe(true)
    expect(wrapper.get('[aria-label="COMの王様"]').exists()).toBe(true)
  })

  it('プレイヤー駒の選択を parent host 経由で通知し、COM 駒は操作できない', async () => {
    const { state, humanKing } = createProps()
    const onSelect = vi.fn()
    const Host = {
      components: { GameBoard },
      setup: () => ({ onSelect, state }),
      template: '<GameBoard :state="state" :selected-piece-id="null" :selected-moves="[]" :disabled="false" @select="onSelect" />',
    }
    const wrapper = mount(Host)

    await wrapper.get('[aria-label="あなたの王様"]').trigger('click')

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(humanKing)
    expect(wrapper.get('[aria-label="COMの王様"]').attributes('disabled')).toBeDefined()
  })

  it('選択駒の合法方向だけを accessible name 付きで表示する', () => {
    const { state, humanKing, selectedMoves } = createProps()
    const wrapper = mount(GameBoard, {
      props: {
        state,
        selectedPieceId: humanKing.id,
        selectedMoves,
        disabled: false,
      },
    })

    const arrows = wrapper.findAll('.move-arrow')
    expect(arrows).toHaveLength(selectedMoves.length)
    expect(arrows.every((arrow) => arrow.attributes('aria-label')?.endsWith('へ移動'))).toBe(true)
  })

  it('方向ボタンの操作を parent host 経由で通知する', async () => {
    const { state, humanKing, selectedMoves } = createProps()
    const onMove = vi.fn()
    const Host = {
      components: { GameBoard },
      setup: () => ({ onMove, state, humanKing, selectedMoves }),
      template:
        '<GameBoard :state="state" :selected-piece-id="humanKing.id" :selected-moves="selectedMoves" :disabled="false" @move="onMove" />',
    }
    const wrapper = mount(Host)

    await wrapper.get('[aria-label="northへ移動"]').trigger('click')

    expect(onMove).toHaveBeenCalledTimes(1)
    expect(onMove).toHaveBeenCalledWith(selectedMoves[0])
  })

  it('disabled 状態では駒と方向ボタンを操作できない', () => {
    const { state, humanKing, selectedMoves } = createProps()
    const wrapper = mount(GameBoard, {
      props: {
        state,
        selectedPieceId: humanKing.id,
        selectedMoves,
        disabled: true,
      },
    })

    expect(wrapper.findAll('button').every((button) => button.attributes('disabled') !== undefined)).toBe(true)
  })
})
