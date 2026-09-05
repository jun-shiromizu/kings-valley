import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function startGame(page: Page, difficulty: 'easy' | 'normal' | 'hard' = 'easy') {
  await page.goto('./')
  await expect(page.getByRole('radio', { name: 'easy' })).toBeChecked()
  await page.getByRole('radio', { name: /先手/ }).check()
  await page.getByRole('radio', { name: difficulty }).check()
  await expect(page.getByRole('radio', { name: difficulty })).toBeChecked()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()
  await expect(page).toHaveURL(/#\/game$/)
}

const playHumanMove = async (page: Page) => {
  const pieces = page.locator('.piece--human:not([disabled])')
  const pieceCount = await pieces.count()

  for (let index = 0; index < pieceCount; index += 1) {
    await pieces.nth(index).click()
    const moves = page.getByRole('button', { name: /へ移動$/ })
    if ((await moves.count()) > 0) {
      await moves.first().click()
      return
    }
  }

  throw new Error('No movable human piece was found')
}

const playUntilResult = async (page: Page) => {
  const dialog = page.getByRole('dialog')
  const humanTurn = page.getByText('あなたの手番')

  for (let turn = 0; turn < 30; turn += 1) {
    if (await dialog.isVisible()) return

    await expect.poll(async () => (await dialog.isVisible()) || (await humanTurn.isVisible())).toBe(true)
    if (await dialog.isVisible()) return

    await playHumanMove(page)
  }

  await expect(dialog).toBeVisible()
}

test('ENDGAME-NAV-001 ゲーム画面からトップページへ戻る', async ({ page }) => {
  await startGame(page)
  await page.getByRole('button', { name: 'トップページへ戻る' }).click()

  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole('button', { name: 'ゲームスタート' })).toBeVisible()
})

test('ENDGAME-NAV-002 終局ダイアログのもう一度で hard を設定した新しい対局を開始する', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0
  })
  await startGame(page, 'hard')
  await playUntilResult(page)
  await page.getByRole('button', { name: 'もう一度', exact: true }).click()

  await expect(page.getByRole('grid', { name: '5 x 5 のゲーム盤' })).toBeVisible()
  await expect(page.getByText('あなたの手番')).toBeVisible()
})

test('ENDGAME-STATE-001 再読み込みで対局を破棄する', async ({ page }) => {
  await startGame(page)
  await page.reload()

  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole('button', { name: 'ゲームスタート' })).toBeVisible()
})

test('ENDGAME-STATE-002 未定義ルートからトップページへ戻る', async ({ page }) => {
  await page.goto('./#/not-found')

  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole('button', { name: 'ゲームスタート' })).toBeVisible()
})
