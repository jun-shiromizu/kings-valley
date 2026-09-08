import { describe, expect, it } from 'vitest'
import { createInitialState } from './board'
import { chooseRandomMove, chooseTacticalMove } from './com'
import { advanceGame } from './game'
import { getLegalMovesForPlayer } from './moves'
import { positionKey } from './position-key'
import type { GameState, Move, Piece, Player } from './types'

const stateFor = (pieces: Piece[], overrides: Partial<GameState> = {}): GameState => ({
  pieces,
  currentPlayer: 'com',
  turnOrder: 'com-first',
  difficulty: 'normal',
  startedPlayer: 'com',
  positionCounts: {},
  result: { status: 'playing' },
  ...overrides,
})

const signature = (move: Move | undefined): string | undefined =>
  move && `${move.pieceId}:${move.direction}:${move.to.row}:${move.to.col}`

const isWinFor = (state: GameState, player: Player) =>
  (state.result.status === 'won' || state.result.status === 'lost') && state.result.winner === player

const immediateWinningMoves = (state: GameState, player: Player): Move[] => {
  if (state.result.status !== 'playing' || state.currentPlayer !== player) return []
  return getLegalMovesForPlayer(state, player).filter((move) => isWinFor(advanceGame(state, move), player))
}

const remainingHumanWins = (state: GameState, move: Move) => immediateWinningMoves(advanceGame(state, move), 'human').length

const immediateComWin = () =>
  stateFor([
    { id: 'com-king', owner: 'com', type: 'king', position: { row: 0, col: 2 } },
    { id: 'human-blocker', owner: 'human', type: 'soldier', position: { row: 3, col: 2 } },
    { id: 'human-king', owner: 'human', type: 'king', position: { row: 4, col: 4 } },
  ])

const humanVerticalThreat = () =>
  stateFor([
    { id: 'com-king', owner: 'com', type: 'king', position: { row: 0, col: 0 } },
    { id: 'com-soldier', owner: 'com', type: 'soldier', position: { row: 1, col: 2 } },
    { id: 'human-king', owner: 'human', type: 'king', position: { row: 4, col: 2 } },
  ])

const multipleHumanThreats = () =>
  stateFor([
    { id: 'com-king', owner: 'com', type: 'king', position: { row: 0, col: 0 } },
    { id: 'com-vertical-blocker', owner: 'com', type: 'soldier', position: { row: 1, col: 2 } },
    { id: 'com-horizontal-blocker', owner: 'com', type: 'soldier', position: { row: 2, col: 1 } },
    { id: 'human-vertical-king', owner: 'human', type: 'king', position: { row: 4, col: 2 } },
    { id: 'human-horizontal-king', owner: 'human', type: 'king', position: { row: 2, col: 4 } },
  ])

const noLegalMoveTerminal = () =>
  stateFor([
    { id: 'human-king', owner: 'human', type: 'king', position: { row: 0, col: 0 } },
    { id: 'com-east-blocker', owner: 'com', type: 'soldier', position: { row: 0, col: 1 } },
    { id: 'com-south-blocker', owner: 'com', type: 'soldier', position: { row: 1, col: 0 } },
    { id: 'com-trapper', owner: 'com', type: 'soldier', position: { row: 1, col: 4 } },
  ])

describe('com', () => {
  it('合法手から選び、乱数1でも配列外にならない', () => {
    const state = createInitialState('com-first')
    const chosen = chooseRandomMove(state, 'com', () => 1)

    expect(chosen).toBeDefined()
    expect(chosen?.pieceId.startsWith('com-')).toBe(true)
  })

  it('合法手がない場合はundefinedを返す', () => {
    const state = createInitialState('human-first')

    expect(chooseRandomMove({ ...state, pieces: [] }, 'com')).toBeUndefined()
    expect(chooseTacticalMove({ ...state, pieces: [] }, 'com')).toBeUndefined()
  })

  it('EASY 用のランダム選択は即時勝利手もプレイヤーの脅威も特別扱いしない', () => {
    expect(signature(chooseRandomMove(immediateComWin(), 'com', () => 0))).not.toBe('com-king:south:2:2')
    expect(chooseRandomMove(humanVerticalThreat(), 'com', () => 0)?.pieceId).toBe('com-king')
  })

  it.each(['normal', 'hard'] as const)('%s は即時勝利を選び、元の局面を変更しない', (difficulty) => {
    const state = { ...immediateComWin(), difficulty }
    const before = structuredClone(state)

    expect(signature(chooseTacticalMove(state, 'com', () => 0))).toBe('com-king:south:2:2')
    expect(state).toEqual(before)
  })

  it('COM の即時勝利はプレイヤーの即時勝利を防ぐ手より優先する', () => {
    const state = stateFor([
      { id: 'com-king', owner: 'com', type: 'king', position: { row: 0, col: 2 } },
      { id: 'com-blocker', owner: 'com', type: 'soldier', position: { row: 3, col: 2 } },
      { id: 'human-king', owner: 'human', type: 'king', position: { row: 4, col: 4 } },
      { id: 'human-blocker', owner: 'human', type: 'soldier', position: { row: 1, col: 1 } },
    ])

    expect(signature(chooseTacticalMove(state, 'com', () => 0))).toBe('com-king:south:2:2')
  })

  it('複数の COM 即時勝利手は注入した乱数で選ぶ', () => {
    const state = stateFor([
      { id: 'com-king-left', owner: 'com', type: 'king', position: { row: 0, col: 0 } },
      { id: 'com-king-right', owner: 'com', type: 'king', position: { row: 0, col: 4 } },
      { id: 'human-blocker-left', owner: 'human', type: 'soldier', position: { row: 3, col: 3 } },
      { id: 'human-blocker-right', owner: 'human', type: 'soldier', position: { row: 3, col: 1 } },
    ])

    expect(signature(chooseTacticalMove(state, 'com', () => 0))).toBe('com-king-left:southeast:2:2')
    expect(signature(chooseTacticalMove(state, 'com', () => 0.999))).toBe('com-king-right:southwest:2:2')
  })

  it.each(['normal', 'hard'] as const)('%s はプレイヤーの即時勝利を阻止する', (difficulty) => {
    expect(chooseTacticalMove({ ...humanVerticalThreat(), difficulty }, 'com', () => 0)?.pieceId).toBe('com-soldier')
  })

  it('現在は脅威がなくても、プレイヤーの即時勝利を作る手を避ける', () => {
    const state = stateFor([
      { id: 'com-king', owner: 'com', type: 'king', position: { row: 0, col: 0 } },
      { id: 'com-blocker', owner: 'com', type: 'soldier', position: { row: 3, col: 2 } },
      { id: 'com-backstop', owner: 'com', type: 'soldier', position: { row: 1, col: 2 } },
      { id: 'human-king', owner: 'human', type: 'king', position: { row: 4, col: 2 } },
    ])
    const chosen = chooseTacticalMove(state, 'com', () => 0)

    expect(chosen?.pieceId).not.toBe('com-blocker')
    expect(remainingHumanWins(state, chosen!)).toBe(0)
  })

  it('複数のプレイヤー脅威では最も多く減らせる候補を選ぶ', () => {
    const state = multipleHumanThreats()
    const legalMoves = getLegalMovesForPlayer(state, 'com')
    const threatCount = immediateWinningMoves({ ...state, currentPlayer: 'human' }, 'human').length
    const minimum = Math.min(...legalMoves.map((move) => remainingHumanWins(state, move)))

    expect(threatCount).toBeGreaterThan(minimum)
    expect(minimum).toBeGreaterThan(0)
    expect(remainingHumanWins(state, chooseTacticalMove(state, 'com', () => 0)!)).toBe(minimum)
  })

  it('同率の防御候補は注入した乱数で選ぶ', () => {
    const state = multipleHumanThreats()
    const legalMoves = getLegalMovesForPlayer(state, 'com')
    const minimum = Math.min(...legalMoves.map((move) => remainingHumanWins(state, move)))
    const best = legalMoves.filter((move) => remainingHumanWins(state, move) === minimum)

    expect(best).toHaveLength(2)
    expect(chooseTacticalMove(state, 'com', () => 0)).toEqual(best[0])
    expect(chooseTacticalMove(state, 'com', () => 0.999)).toEqual(best[1])
  })

  it('脅威を減らせない場合は合法手全体から乱数で選ぶ', () => {
    const state = stateFor([
      { id: 'com-king', owner: 'com', type: 'king', position: { row: 0, col: 0 } },
      { id: 'human-king', owner: 'human', type: 'king', position: { row: 4, col: 2 } },
      { id: 'human-blocker', owner: 'human', type: 'soldier', position: { row: 1, col: 2 } },
    ])
    const legalMoves = getLegalMovesForPlayer(state, 'com')

    expect(chooseTacticalMove(state, 'com', () => 0)).toEqual(legalMoves[0])
    expect(chooseTacticalMove(state, 'com', () => 1)).toEqual(legalMoves[legalMoves.length - 1])
  })

  it('反復引き分け候補を COM の即時勝利として数えず、実際の勝利を優先する', () => {
    const state = immediateComWin()
    const drawMove = getLegalMovesForPlayer(state, 'com').find((move) => advanceGame(state, move).result.status === 'playing')
    if (!drawMove) throw new Error('Expected a non-terminal move')
    const drawKey = positionKey(advanceGame(state, drawMove))
    const stateBeforeDraw = { ...state, positionCounts: { [drawKey]: 2 } }

    expect(advanceGame(stateBeforeDraw, drawMove).result).toEqual({ status: 'draw', reason: 'repetition' })
    expect(isWinFor(advanceGame(stateBeforeDraw, drawMove), 'com')).toBe(false)
    expect(signature(chooseTacticalMove(stateBeforeDraw, 'com', () => 0))).toBe('com-king:south:2:2')
  })

  it('合法手なしで次手番が敗北する候補を COM の即時勝利として選ぶ', () => {
    const state = noLegalMoveTerminal()
    const terminalMove = getLegalMovesForPlayer(state, 'com').find((move) => signature(move) === 'com-trapper:west:1:1')
    if (!terminalMove) throw new Error('Expected a trapping move')

    expect(advanceGame(state, terminalMove).result).toEqual({ status: 'lost', winner: 'com', loser: 'human' })
    expect(signature(chooseTacticalMove(state, 'com', () => 0))).toBe('com-trapper:west:1:1')
  })

  it('終局済みまたは手番ではない局面では着手を選ばない', () => {
    const state = createInitialState('com-first', 'hard')

    expect(chooseTacticalMove({ ...state, result: { status: 'draw', reason: 'repetition' } }, 'com')).toBeUndefined()
    expect(chooseTacticalMove({ ...state, currentPlayer: 'human' }, 'com')).toBeUndefined()
  })
})
