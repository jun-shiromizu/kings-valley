import type { GameState, Piece } from './types'

export const positionKey = (state: Pick<GameState, 'pieces' | 'currentPlayer'>): string => {
  const pieces = [...state.pieces]
    .sort((first, second) => first.id.localeCompare(second.id))
    .map((piece: Piece) => `${piece.owner}:${piece.type}:${piece.position.row},${piece.position.col}`)
    .join('|')
  return `${state.currentPlayer};${pieces}`
}
