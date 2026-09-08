import { advanceGame } from './game'
import { getLegalMovesForPlayer } from './moves'
import type { GameState, Move, Player } from './types'

export const chooseRandomMove = (state: GameState, player: Player, random: () => number = Math.random): Move | undefined => {
  const moves = getLegalMovesForPlayer(state, player)
  if (moves.length === 0) return undefined
  const index = Math.min(moves.length - 1, Math.floor(random() * moves.length))
  return moves[index]
}

const chooseFrom = (moves: Move[], random: () => number): Move | undefined => {
  if (moves.length === 0) return undefined
  const index = Math.min(moves.length - 1, Math.floor(random() * moves.length))
  return moves[index]
}

const isWinningResultFor = (state: GameState, player: Player): boolean =>
  (state.result.status === 'won' || state.result.status === 'lost') && state.result.winner === player

const countImmediateWinningMoves = (state: GameState, player: Player): number => {
  if (state.result.status !== 'playing' || state.currentPlayer !== player) return 0

  return getLegalMovesForPlayer(state, player).filter((move) => isWinningResultFor(advanceGame(state, move), player)).length
}

/**
 * Chooses an immediate win or, otherwise, a move that leaves the opponent with
 * the fewest immediate wins. Every legal candidate is simulated before the
 * defensive fallback is selected, including positions with no current threat:
 * this avoids creating an immediate opponent win unnecessarily.
 */
export const chooseTacticalMove = (
  state: GameState,
  player: Player,
  random: () => number = Math.random,
): Move | undefined => {
  if (state.result.status !== 'playing' || state.currentPlayer !== player) return undefined

  const moves = getLegalMovesForPlayer(state, player)
  const winningMoves = moves.filter((move) => isWinningResultFor(advanceGame(state, move), player))
  if (winningMoves.length > 0) return chooseFrom(winningMoves, random)

  const opponent: Player = player === 'human' ? 'com' : 'human'
  const opponentWinsBeforeMove = countImmediateWinningMoves({ ...state, currentPlayer: opponent }, opponent)
  const candidates = moves.map((move) => ({
    move,
    remainingOpponentWins: countImmediateWinningMoves(advanceGame(state, move), opponent),
  }))
  const fewestRemainingOpponentWins = Math.min(...candidates.map((candidate) => candidate.remainingOpponentWins))
  const bestDefenses = candidates
    .filter((candidate) => candidate.remainingOpponentWins === fewestRemainingOpponentWins)
    .map((candidate) => candidate.move)

  if (fewestRemainingOpponentWins === 0 || fewestRemainingOpponentWins < opponentWinsBeforeMove) {
    return chooseFrom(bestDefenses, random)
  }

  return chooseFrom(moves, random)
}
