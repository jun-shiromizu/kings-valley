import { directionByName } from './constants'
import { findPiece, isInsideBoard, pieceAt } from './board'
import type { DirectionName, GameState, Move, Piece, Position } from './types'

export const getMoveForDirection = (state: Pick<GameState, 'pieces'>, piece: Piece, directionName: DirectionName): Move | undefined => {
  const direction = directionByName(directionName)
  let row = piece.position.row + direction.row
  let col = piece.position.col + direction.col

  if (!isInsideBoard(row, col) || pieceAt(state.pieces, row, col)) return undefined

  let lastOpen: Position = { row, col }
  while (true) {
    const nextRow = row + direction.row
    const nextCol = col + direction.col
    if (!isInsideBoard(nextRow, nextCol) || pieceAt(state.pieces, nextRow, nextCol)) break
    row = nextRow
    col = nextCol
    lastOpen = { row, col }
  }

  return {
    pieceId: piece.id,
    direction: directionName,
    from: { ...piece.position },
    to: lastOpen,
  }
}

export const getLegalMovesForPiece = (state: Pick<GameState, 'pieces'>, piece: Piece): Move[] =>
  ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest']
    .map((direction) => getMoveForDirection(state, piece, direction as DirectionName))
    .filter((move): move is Move => move !== undefined)

export const getLegalMovesForPlayer = (state: Pick<GameState, 'pieces'>, player: GameState['currentPlayer']): Move[] =>
  state.pieces.filter((piece) => piece.owner === player).flatMap((piece) => getLegalMovesForPiece(state, piece))

export const applyMove = (state: GameState, move: Move): GameState => {
  if (state.result.status !== 'playing') throw new Error('Cannot move after the game has ended')
  const piece = findPiece(state, move.pieceId)
  if (!piece || piece.owner !== state.currentPlayer) throw new Error('Move does not belong to current player')
  const legalMove = getLegalMovesForPiece(state, piece).find(
    (candidate) =>
      candidate.direction === move.direction &&
      candidate.from.row === move.from.row &&
      candidate.from.col === move.from.col &&
      candidate.to.row === move.to.row &&
      candidate.to.col === move.to.col,
  )
  if (!legalMove) throw new Error('Illegal move')

  const pieces = state.pieces.map((candidate) =>
    candidate.id === piece.id ? { ...candidate, position: { ...legalMove.to } } : { ...candidate, position: { ...candidate.position } },
  )
  return { ...state, pieces }
}
