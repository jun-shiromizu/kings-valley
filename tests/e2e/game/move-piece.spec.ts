import { expect, test } from '@playwright/test'
import { createInitialState, findPiece, getLegalMovesForPiece, type Piece } from '../../../src/domain'
import { boardPieces, expectHumanMoveAndSingleComResponse } from '../support/game-board'

test('GAME-MOVE-001 合法方向を選んでプレイヤーの駒を動かす', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('radio', { name: /先手/ }).check()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()

  const initialState = createInitialState('human-first')
  const humanKing = findPiece(initialState, 'human-king') as Piece
  const legalMoves = getLegalMovesForPiece(initialState, humanKing)
  const northMove = legalMoves.find((move) => move.direction === 'north')
  expect(northMove).toEqual(
    expect.objectContaining({
      pieceId: 'human-king',
      direction: 'north',
      to: { row: 1, col: 2 },
    }),
  )

  await expectHumanMoveAndSingleComResponse(page, 'あなたの王様', 'northへ移動', northMove!)
})

test('GAME-ACCESS-001 キーボードで駒を選び移動する', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('radio', { name: /先手/ }).check()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()

  const initialState = createInitialState('human-first')
  const humanKing = findPiece(initialState, 'human-king') as Piece
  const legalMoves = getLegalMovesForPiece(initialState, humanKing)
  const northMove = legalMoves.find((move) => move.direction === 'north')
  expect(northMove).toEqual(
    expect.objectContaining({
      pieceId: 'human-king',
      direction: 'north',
      to: { row: 1, col: 2 },
    }),
  )

  const king = page.getByRole('button', { name: 'あなたの王様' })
  await king.focus()
  await page.keyboard.press('Enter')

  const moveArrow = page.getByRole('button', { name: 'northへ移動' })
  await expect(moveArrow).toBeVisible()

  const beforeMove = await boardPieces(page)
  await moveArrow.focus()
  await page.keyboard.press('Enter')

  await expectHumanMoveAndSingleComResponse(page, 'あなたの王様', 'northへ移動', northMove!, beforeMove, false, false)
})
