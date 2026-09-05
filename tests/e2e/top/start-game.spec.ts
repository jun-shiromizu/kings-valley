import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const initialComCells = ['0行0列', '0行1列', '0行2列', '0行3列', '0行4列']
const legalComOpeningDestinations: Record<string, string[]> = {
  '0行0列': ['3行0列', '3行3列'],
  '0行1列': ['1行0列', '3行1列', '3行4列'],
  '0行2列': ['2行0列', '3行2列', '2行4列'],
  '0行3列': ['1行4列', '3行0列', '3行3列'],
  '0行4列': ['3行1列', '3行4列'],
}

const expectComOpeningMove = async (page: Page) => {
  await expect(page.getByText('COM が先手')).toBeVisible()
  await expect(page.getByText('あなたの手番')).toBeVisible()

  const comPieceCells = await page
    .locator('.piece--com')
    .evaluateAll((pieces) => pieces.map((piece) => piece.parentElement?.getAttribute('aria-label') ?? ''))
  const occupiedInitialCells = comPieceCells.filter((cell) => initialComCells.includes(cell))
  const movedComPieceCells = comPieceCells.filter((cell) => !initialComCells.includes(cell))
  const vacatedInitialCells = initialComCells.filter((cell) => !comPieceCells.includes(cell))

  expect(comPieceCells).toHaveLength(5)
  expect(occupiedInitialCells).toHaveLength(4)
  expect(movedComPieceCells).toHaveLength(1)
  expect(vacatedInitialCells).toHaveLength(1)
  expect(legalComOpeningDestinations[vacatedInitialCells[0]]).toContain(movedComPieceCells[0])
}

test('TOP-START-001 easy は初期選択され、難易度をキーボードで選択できる', async ({ page }) => {
  await page.goto('./')
  const easy = page.getByRole('radio', { name: 'easy' })
  const normal = page.getByRole('radio', { name: 'normal' })
  const easyOption = page.locator('.difficulty-option').filter({ has: easy })

  await expect(easy).toBeChecked()
  await easy.focus()
  await expect(easy).toBeFocused()
  await expect(easyOption).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('ArrowDown')
  await expect(normal).toBeChecked()
})

test('TOP-START-002 先手と normal を選んで開始する', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('radio', { name: /先手/ }).check()
  await page.getByRole('radio', { name: 'normal' }).check()
  await expect(page.getByRole('radio', { name: 'normal' })).toBeChecked()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()

  await expect(page).toHaveURL(/#\/game$/)
  await expect(page.getByText('あなたが先手')).toBeVisible()
  await expect(page.getByText('あなたの手番')).toBeVisible()
})

test('TOP-START-003 後手と hard を選んで開始すると COM が初手を指す', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('radio', { name: /後手/ }).check()
  await page.getByRole('radio', { name: 'hard' }).check()
  await expect(page.getByRole('radio', { name: 'hard' })).toBeChecked()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()

  await expect(page).toHaveURL(/#\/game$/)
  await expectComOpeningMove(page)
})

test('TOP-START-004 ランダム設定で COM 先手を固定すると normal でも COM が初手を指す', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.9
  })
  await page.goto('./')
  await page.getByRole('radio', { name: /ランダム/ }).check()
  await page.getByRole('radio', { name: 'normal' }).check()
  await expect(page.getByRole('radio', { name: 'normal' })).toBeChecked()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()

  await expect(page).toHaveURL(/#\/game$/)
  await expectComOpeningMove(page)
})
