import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
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
    expect(wrapper.get('[aria-label="2行2列 中央"]')).toBeDefined()
    expect(wrapper.get('[aria-label="あなたの王様"]')).toBeDefined()
    expect(wrapper.get('[aria-label="COMの王様"]')).toBeDefined()
  })

  it('プレイヤー駒の選択を通知し、COM 駒は操作できない', async () => {
    const { state } = createProps()
    const wrapper = mount(GameBoard, {
      props: {
        state,
        selectedPieceId: null,
        selectedMoves: [],
        disabled: false,
      },
    })

    await wrapper.get('[aria-label="あなたの王様"]').trigger('click')

    expect(wrapper.emitted('select')).toHaveLength(1)
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
