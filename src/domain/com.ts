import { getLegalMovesForPlayer } from './moves'
import type { GameState, Move, Player } from './types'

export const chooseRandomMove = (state: GameState, player: Player, random: () => number = Math.random): Move | undefined => {
  const moves = getLegalMovesForPlayer(state, player)
  if (moves.length === 0) return undefined
  const index = Math.min(moves.length - 1, Math.floor(random() * moves.length))
  return moves[index]
}
