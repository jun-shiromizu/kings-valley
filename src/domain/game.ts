import { CENTER } from './constants'
import { applyMove } from './moves'
import { getLegalMovesForPlayer } from './moves'
import { positionKey } from './position-key'
import type { GameState, Move, Player } from './types'

export const advanceGame = (state: GameState, move: Move): GameState => {
  const movedState = applyMove(state, move)
  const movedPiece = movedState.pieces.find((piece) => piece.id === move.pieceId)
  if (!movedPiece) throw new Error('Moved piece was not found')

  if (movedPiece.type === 'king' && movedPiece.position.row === CENTER.row && movedPiece.position.col === CENTER.col) {
    return { ...movedState, result: { status: 'won', winner: movedPiece.owner } }
  }

  const nextPlayer: Player = movedState.currentPlayer === 'human' ? 'com' : 'human'
  const nextState = { ...movedState, currentPlayer: nextPlayer }
  const key = positionKey(nextState)
  const count = (state.positionCounts[key] ?? 0) + 1
  const positionCounts = { ...state.positionCounts, [key]: count }

  if (count >= 3) return { ...nextState, positionCounts, result: { status: 'draw', reason: 'repetition' } }

  if (getLegalMovesForPlayer(nextState, nextPlayer).length === 0) {
    return { ...nextState, positionCounts, result: { status: 'lost', winner: movedState.currentPlayer, loser: nextPlayer } }
  }

  return { ...nextState, positionCounts }
}
