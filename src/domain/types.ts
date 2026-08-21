export type Player = 'human' | 'com'
export type PieceType = 'king' | 'soldier'
export type TurnOrder = 'human-first' | 'com-first' | 'random'
export type DirectionName = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest'

export interface Position {
  row: number
  col: number
}

export interface Direction {
  name: DirectionName
  row: number
  col: number
}

export interface Piece {
  id: string
  owner: Player
  type: PieceType
  position: Position
}

export interface Move {
  pieceId: string
  direction: DirectionName
  from: Position
  to: Position
}

export interface GameState {
  pieces: Piece[]
  currentPlayer: Player
  turnOrder: TurnOrder
  startedPlayer: Player
  positionCounts: Record<string, number>
  result: GameResult
}

export type GameResult =
  | { status: 'playing' }
  | { status: 'won'; winner: Player }
  | { status: 'lost'; winner: Player; loser: Player }
  | { status: 'draw'; reason: 'repetition' }
