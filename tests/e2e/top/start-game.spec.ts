import { expect, test } from '@playwright/test'
import { createInitialState, findPiece, getLegalMovesForPiece, type Piece } from '../../../src/domain'
import { expectHumanMoveAndSingleComResponse, expectSingleComMoveFromInitialRender, initialBoardSnapshot } from '../support/game-board'

test('TOP-START-001 先手を選んで開始する', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('radio', { name: /先手/ }).check()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()

  await expect(page).toHaveURL(/#\/game$/)
  await expect(page.getByText('あなたが先手')).toBeVisible()
  await expect(page.getByText('あなたの手番')).toBeVisible()
  await expect(page.getByRole('button', { name: 'あなたの王様' })).toBeEnabled()
})

test('TOP-START-002 後手を選んで開始するとCOMが初手を指して人間へ手番が戻る', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('radio', { name: /後手/ }).check()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()

  await expect(page).toHaveURL(/#\/game$/)
  await expect(page.getByText('COM が先手')).toBeVisible()
  await expect(page.getByText('COM が考えています')).toBeVisible()

  await expectSingleComMoveFromInitialRender(page, initialBoardSnapshot())
})

test('TOP-START-003 ランダムで人間先手になった場合は人間が着手でき、その後COMが1手だけ応手する', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.1
  })

  await page.goto('./')
  await page.getByRole('radio', { name: /ランダム/ }).check()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()

  await expect(page).toHaveURL(/#\/game$/)
  await expect(page.getByText('あなたが先手')).toBeVisible()
  await expect(page.getByText('あなたの手番')).toBeVisible()

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
