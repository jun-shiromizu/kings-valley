import { BOARD_SIZE, CENTER, DIRECTIONS } from './constants'
import type { GameState, Piece, Player, TurnOrder } from './types'
import { positionKey } from './position-key'

export { CENTER }

export const isInsideBoard = (row: number, col: number): boolean => row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE

export const samePosition = (first: { row: number; col: number }, second: { row: number; col: number }): boolean =>
  first.row === second.row && first.col === second.col

export const createInitialPieces = (): Piece[] => [...createLinePieces('com', 0), ...createLinePieces('human', BOARD_SIZE - 1)]

const createLinePieces = (owner: Player, row: number): Piece[] => [
  { id: `${owner}-soldier-left`, owner, type: 'soldier', position: { row, col: 0 } },
  { id: `${owner}-soldier-middle-left`, owner, type: 'soldier', position: { row, col: 1 } },
  { id: `${owner}-king`, owner, type: 'king', position: { row, col: 2 } },
  { id: `${owner}-soldier-middle-right`, owner, type: 'soldier', position: { row, col: 3 } },
  { id: `${owner}-soldier-right`, owner, type: 'soldier', position: { row, col: 4 } },
]

export const resolveStartedPlayer = (turnOrder: TurnOrder, random: () => number = Math.random): Player => {
  if (turnOrder === 'human-first') return 'human'
  if (turnOrder === 'com-first') return 'com'
  return random() < 0.5 ? 'human' : 'com'
}

export const createInitialState = (turnOrder: TurnOrder, random: () => number = Math.random): GameState => {
  const startedPlayer = resolveStartedPlayer(turnOrder, random)
  const pieces = createInitialPieces()
  const stateWithoutCounts: Omit<GameState, 'positionCounts'> = {
    pieces,
    currentPlayer: startedPlayer,
    turnOrder,
    startedPlayer,
    result: { status: 'playing' },
  }
  const key = positionKey(stateWithoutCounts)
  return { ...stateWithoutCounts, positionCounts: { [key]: 1 } }
}

export const findPiece = (state: Pick<GameState, 'pieces'>, pieceId: string): Piece | undefined =>
  state.pieces.find((piece) => piece.id === pieceId)

export const pieceAt = (pieces: readonly Piece[], row: number, col: number): Piece | undefined =>
  pieces.find((piece) => piece.position.row === row && piece.position.col === col)

export const isCenter = (position: { row: number; col: number }): boolean => samePosition(position, CENTER)

export const allDirections = () => DIRECTIONS
