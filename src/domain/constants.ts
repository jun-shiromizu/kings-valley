import type { Direction, DirectionName, Position } from './types'

export const BOARD_SIZE = 5
export const CENTER: Position = { row: 2, col: 2 }

export const DIRECTIONS: readonly Direction[] = [
  { name: 'north', row: -1, col: 0 },
  { name: 'northeast', row: -1, col: 1 },
  { name: 'east', row: 0, col: 1 },
  { name: 'southeast', row: 1, col: 1 },
  { name: 'south', row: 1, col: 0 },
  { name: 'southwest', row: 1, col: -1 },
  { name: 'west', row: 0, col: -1 },
  { name: 'northwest', row: -1, col: -1 },
]

export const directionByName = (name: DirectionName): Direction => {
  const direction = DIRECTIONS.find((candidate) => candidate.name === name)
  if (!direction) throw new Error(`Unknown direction: ${name}`)
  return direction
}
