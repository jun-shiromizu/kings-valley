import { computed, onUnmounted, ref } from 'vue'
import {
  advanceGame,
  chooseRandomMove,
  createInitialState,
  getLegalMovesForPiece,
  getLegalMovesForPlayer,
} from '../domain'
import type { GameState, Move, Piece, TurnOrder } from '../domain'

const state = ref<GameState | null>(null)
const selectedPieceId = ref<string | null>(null)
const isBusy = ref(false)
let comTimer: ReturnType<typeof setTimeout> | undefined
let randomSource = Math.random
let sessionOwner: symbol | undefined

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
    comTimer = undefined
    isBusy.value = false
    if (!state.value || state.value.result.status !== 'playing' || state.value.currentPlayer !== 'com') return

    const move = chooseRandomMove(state.value, 'com', randomSource)
    if (move) state.value = advanceGame(state.value, move)
    else state.value = { ...state.value, result: { status: 'lost', winner: 'human', loser: 'com' } }
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

const selectedPiece = computed(
  () => state.value?.pieces.find((piece) => piece.id === selectedPieceId.value) ?? null,
)
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

const dispose = () => {
  clearComTimer()
  isBusy.value = false
}

const isGameRoute = () => window.location.hash === '#/game'

export const useGameSession = () => {
  const owner = Symbol('game-session-owner')
  const ownsSession = isGameRoute()

  if (ownsSession && state.value) {
    sessionOwner = owner
    if (!isBusy.value) scheduleComMove()
  }

  const startSession = (turnOrder: TurnOrder, random: () => number = Math.random) => {
    sessionOwner = undefined
    start(turnOrder, random)
  }

  onUnmounted(() => {
    if (ownsSession && sessionOwner === owner) {
      dispose()
      sessionOwner = undefined
    }
  })

  return {
    state,
    selectedPiece,
    selectedPieceId,
    selectedMoves,
    isBusy,
    start: startSession,
    selectPiece,
    moveSelectedPiece,
    rematch,
    dispose,
  }
}

export const hasActiveSession = () => state.value !== null
export const clearSession = () => {
  dispose()
  state.value = null
  selectedPieceId.value = null
  sessionOwner = undefined
}

export const legalMovesForPiece = (piece: Piece) => (state.value ? getLegalMovesForPiece(state.value, piece) : [])
export const legalMovesForCurrentPlayer = () =>
  state.value ? getLegalMovesForPlayer(state.value, state.value.currentPlayer) : []
