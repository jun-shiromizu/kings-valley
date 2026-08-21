import { computed, onUnmounted, ref } from 'vue'
import { chooseRandomMove, createInitialState, getLegalMovesForPiece, getLegalMovesForPlayer, advanceGame } from '../domain'
import type { GameState, Move, Piece, TurnOrder } from '../domain'

const state = ref<GameState | null>(null)
const selectedPieceId = ref<string | null>(null)
const isBusy = ref(false)
let comTimer: ReturnType<typeof setTimeout> | undefined
let randomSource = Math.random

const clearComTimer = () => {
  if (comTimer !== undefined) {
    clearTimeout(comTimer)
    comTimer = undefined
  }
}

const scheduleComMove = () => {
  clearComTimer()
  if (!state.value || state.value.result.status !== 'playing' || state.value.currentPlayer !== 'com') return
  isBusy.value = true
  comTimer = setTimeout(() => {
    if (!state.value || state.value.result.status !== 'playing' || state.value.currentPlayer !== 'com') return
    const move = chooseRandomMove(state.value, 'com')
    if (move) state.value = advanceGame(state.value, move)
    else state.value = { ...state.value, result: { status: 'lost', winner: 'human', loser: 'com' } }
    isBusy.value = false
    comTimer = undefined
  }, 500)
}

const start = (turnOrder: TurnOrder, random: () => number = Math.random) => {
  clearComTimer()
  selectedPieceId.value = null
  isBusy.value = false
  randomSource = random
  state.value = createInitialState(turnOrder, randomSource)
  scheduleComMove()
}

const selectPiece = (piece: Piece) => {
  if (
    !state.value ||
    isBusy.value ||
    state.value.result.status !== 'playing' ||
    state.value.currentPlayer !== 'human' ||
    piece.owner !== 'human'
  )
    return
  const legalMoves = getLegalMovesForPiece(state.value, piece)
  if (legalMoves.length === 0) return
  selectedPieceId.value = selectedPieceId.value === piece.id ? null : piece.id
}

const selectedPiece = computed(() => state.value?.pieces.find((piece) => piece.id === selectedPieceId.value) ?? null)
const selectedMoves = computed(() => {
  if (!state.value || !selectedPiece.value) return []
  return getLegalMovesForPiece(state.value, selectedPiece.value)
})

const moveSelectedPiece = (move: Move) => {
  if (!state.value || isBusy.value || state.value.result.status !== 'playing') return
  if (move.pieceId !== selectedPieceId.value) return
  state.value = advanceGame(state.value, move)
  selectedPieceId.value = null
  scheduleComMove()
}

const rematch = () => {
  if (!state.value) return
  start(state.value.turnOrder, randomSource)
}

const dispose = () => clearComTimer()

export const useGameSession = () => {
  onUnmounted(dispose)
  return {
    state,
    selectedPiece,
    selectedPieceId,
    selectedMoves,
    isBusy,
    start,
    selectPiece,
    moveSelectedPiece,
    rematch,
    dispose,
  }
}

export const hasActiveSession = () => state.value !== null
export const clearSession = () => {
  clearComTimer()
  state.value = null
  selectedPieceId.value = null
  isBusy.value = false
}

export const legalMovesForPiece = (piece: Piece) => (state.value ? getLegalMovesForPiece(state.value, piece) : [])
export const legalMovesForCurrentPlayer = () => (state.value ? getLegalMovesForPlayer(state.value, state.value.currentPlayer) : [])
