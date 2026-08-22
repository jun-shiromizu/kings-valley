import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { createInitialState, findPiece, getLegalMovesForPiece, type GameState, type Move, type Piece } from '../../../src/domain'

export type PieceSnapshot = {
  id: string
  row: number
  col: number
}

export const boardPieceButtons = (page: Page): Locator => page.locator('.board__cell .piece')

export const initialBoardSnapshot = (): PieceSnapshot[] =>
  createInitialState('com-first').pieces.map((piece) => ({
    id: piece.id,
    row: piece.position.row,
    col: piece.position.col,
  }))

export const boardPieces = async (page: Page): Promise<PieceSnapshot[]> => {
  await expect(boardPieceButtons(page)).toHaveCount(10)

  return boardPieceButtons(page).evaluateAll((elements) =>
    elements
      .map((element) => {
        const button = element as HTMLButtonElement
        const id = button.dataset.pieceId
        const cellLabel = button.parentElement?.getAttribute('aria-label') ?? ''
        const match = cellLabel.match(/(\d+)行(\d+)列/)
        if (!id || !match) return null

        return {
          id,
          row: Number(match[1]),
          col: Number(match[2]),
        }
      })
      .filter((piece): piece is PieceSnapshot => piece !== null),
  )
}

const changedPieces = (beforeMove: PieceSnapshot[], afterMove: PieceSnapshot[]) => {
  const beforeById = new Map(beforeMove.map((piece) => [piece.id, piece]))

  return afterMove.filter((piece) => {
    const before = beforeById.get(piece.id)
    return !before || before.row !== piece.row || before.col !== piece.col
  })
}

const applyMoveToSnapshot = (pieces: PieceSnapshot[], move: Move): PieceSnapshot[] =>
  pieces.map((piece) =>
    piece.id === move.pieceId
      ? {
          ...piece,
          row: move.to.row,
          col: move.to.col,
        }
      : piece,
  )

export const snapshotToPiecesState = (pieces: PieceSnapshot[]): Pick<GameState, 'pieces'> => ({
  pieces: pieces.map((piece) => {
    const initialPiece = findPiece(createInitialState('human-first'), piece.id)
    if (!initialPiece) throw new Error(`Unknown piece id: ${piece.id}`)

    return {
      ...initialPiece,
      position: { row: piece.row, col: piece.col },
    }
  }),
})

export const expectLegalSingleComMove = (beforeMove: PieceSnapshot[], afterMove: PieceSnapshot[]) => {
  const changed = changedPieces(beforeMove, afterMove)
  expect(changed).toHaveLength(1)

  const movedPiece = changed[0]
  expect(movedPiece?.id.startsWith('com-')).toBe(true)

  const beforeState = snapshotToPiecesState(beforeMove)
  const piece = findPiece(beforeState, movedPiece!.id) as Piece
  const legalMoves = getLegalMovesForPiece(beforeState, piece)
  const legalDestinations = new Set(legalMoves.map((move) => `${move.to.row},${move.to.col}`))

  expect(legalDestinations.has(`${movedPiece!.row},${movedPiece!.col}`)).toBe(true)
}

export const waitForStableBoard = async (page: Page, stableMs = 700) => {
  const settled = await page.waitForFunction(
    ({ stableMs }) => {
      const current = Array.from(document.querySelectorAll('.board__cell .piece'))
        .map((element) => {
          const button = element as HTMLButtonElement
          const id = button.dataset.pieceId
          const cellLabel = button.parentElement?.getAttribute('aria-label') ?? ''
          const match = cellLabel.match(/(\d+)行(\d+)列/)
          if (!id || !match) return null
          return `${id}:${Number(match[1])}:${Number(match[2])}`
        })
        .filter((piece): piece is string => piece !== null)
        .sort()
        .join('|')

      const state = (
        window as Window & {
          __kvBoardStability?: { snapshot: string; changedAt: number }
        }
      ).__kvBoardStability
      const now = Date.now()

      if (!state || state.snapshot !== current) {
        ;(
          window as Window & {
            __kvBoardStability?: { snapshot: string; changedAt: number }
          }
        ).__kvBoardStability = { snapshot: current, changedAt: now }
        return false
      }

      return now - state.changedAt >= stableMs
    },
    { stableMs },
  )

  await settled.dispose()
}

const expectPostHumanMove = async (page: Page, boardBeforeMove: PieceSnapshot[], expectedMove: Move) => {
  const status = page.getByText('COM が考えています')
  const yourTurn = page.getByText('あなたの手番')
  const expectedAfterHumanSnapshot = applyMoveToSnapshot(boardBeforeMove, expectedMove)

  await expect(yourTurn).toBeVisible({ timeout: 3000 })
  await expect(status).toHaveCount(0)
  await waitForStableBoard(page)

  const finalBoard = await boardPieces(page)
  expect(finalBoard).toContainEqual(
    expect.objectContaining({
      id: expectedMove.pieceId,
      row: expectedMove.to.row,
      col: expectedMove.to.col,
    }),
  )
  expect(finalBoard).not.toEqual(boardBeforeMove)
  expectLegalSingleComMove(expectedAfterHumanSnapshot, finalBoard)
}

export const expectSingleComMoveFromInitialRender = async (page: Page, beforeMove: PieceSnapshot[]) => {
  await expect(page.getByText('あなたの手番')).toBeVisible({ timeout: 3000 })
  await expect(page.getByText('COM が考えています')).toHaveCount(0)
  await waitForStableBoard(page)

  const finalBoard = await boardPieces(page)
  expectLegalSingleComMove(beforeMove, finalBoard)
  await expect(page.getByRole('button', { name: 'あなたの王様' })).toBeEnabled()
  await page.waitForTimeout(1000)
  expect(await boardPieces(page)).toEqual(finalBoard)
}

export const expectHumanMoveAndSingleComResponse = async (
  page: Page,
  pieceName: string,
  moveName: string,
  expectedMove: Move,
  beforeMove: PieceSnapshot[] | null = null,
  performSelection = true,
  performMove = true,
) => {
  const piece = page.getByRole('button', { name: pieceName })
  await expect(piece).toBeEnabled()

  const boardBeforeMove = beforeMove ?? (await boardPieces(page))

  if (performSelection) {
    await piece.click()
  }

  if (performMove) {
    const moveButton = page.getByRole('button', { name: moveName })
    await expect(moveButton).toBeVisible()
    await moveButton.click()
    await expect(moveButton).toHaveCount(0)
  }

  await expectPostHumanMove(page, boardBeforeMove, expectedMove)
  await expect(piece).toBeEnabled()
}
