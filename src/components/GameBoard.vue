<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown, ArrowDownLeft, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUp, ArrowUpLeft, ArrowUpRight } from 'lucide-vue-next'
import type { DirectionName, GameState, Move, Piece } from '../domain'

const props = defineProps<{
  state: GameState
  selectedPieceId: string | null
  selectedMoves: Move[]
  disabled: boolean
}>()

const emit = defineEmits<{
  select: [piece: Piece]
  move: [move: Move]
}>()

const directionIcons = {
  north: ArrowUp,
  northeast: ArrowUpRight,
  east: ArrowRight,
  southeast: ArrowDownRight,
  south: ArrowDown,
  southwest: ArrowDownLeft,
  west: ArrowLeft,
  northwest: ArrowUpLeft,
} as const

const selectedMoveByDirection = computed(() => new Map(props.selectedMoves.map((move) => [move.direction, move])))
const pieceAt = (row: number, col: number) => props.state.pieces.find((piece) => piece.position.row === row && piece.position.col === col)
const isCenter = (row: number, col: number) => row === 2 && col === 2
const pieceLabel = (piece: Piece) => `${piece.owner === 'human' ? 'あなた' : 'COM'}の${piece.type === 'king' ? '王様' : '兵士'}`
</script>

<template>
  <div class="board-shell">
    <div class="board" role="grid" aria-label="5 x 5 のゲーム盤">
      <div v-for="row in 5" :key="row" class="board__row" role="row">
        <div
          v-for="col in 5"
          :key="`${row}-${col}`"
          class="board__cell"
          :class="{ 'board__cell--center': isCenter(row - 1, col - 1) }"
          role="gridcell"
          :aria-label="`${row - 1}行${col - 1}列${isCenter(row - 1, col - 1) ? ' 中央' : ''}`"
        >
          <button
            v-if="pieceAt(row - 1, col - 1)"
            class="piece"
            :class="[
              `piece--${pieceAt(row - 1, col - 1)?.owner}`,
              `piece--${pieceAt(row - 1, col - 1)?.type}`,
              { 'piece--selected': selectedPieceId === pieceAt(row - 1, col - 1)?.id },
            ]"
            type="button"
            :disabled="disabled || pieceAt(row - 1, col - 1)?.owner !== 'human'"
            :aria-label="`${pieceLabel(pieceAt(row - 1, col - 1)!)}${selectedPieceId === pieceAt(row - 1, col - 1)?.id ? ' 選択中' : ''}`"
            @click="emit('select', pieceAt(row - 1, col - 1)!)"
          >
            <span class="piece__mark" aria-hidden="true">{{ pieceAt(row - 1, col - 1)?.type === 'king' ? '♛' : '✦' }}</span>
            <span class="piece__type">{{ pieceAt(row - 1, col - 1)?.type === 'king' ? '王' : '兵' }}</span>
          </button>
          <template v-if="selectedPieceId && pieceAt(row - 1, col - 1)?.id === selectedPieceId">
            <button
              v-for="(move, direction) in Object.fromEntries(selectedMoveByDirection)"
              :key="direction"
              class="move-arrow"
              :class="`move-arrow--${direction}`"
              type="button"
              :aria-label="`${direction}へ移動`"
              :disabled="disabled"
              @click="emit('move', move)"
            >
              <component :is="directionIcons[direction as DirectionName]" :size="18" stroke-width="2.5" aria-hidden="true" />
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
