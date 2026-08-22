import { expect, test } from '@playwright/test'

async function startGame(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto('./')
  await page.getByRole('radio', { name: /先手/ }).check()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()
  await expect(page).toHaveURL(/#\/game$/)
}

test('ENDGAME-NAV-001 ゲーム画面からトップページへ戻る', async ({ page }) => {
  await startGame(page)
  await page.getByRole('button', { name: 'トップページへ戻る' }).click()

  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole('button', { name: 'ゲームスタート' })).toBeVisible()
})

test('ENDGAME-NAV-002 ゲーム画面から再戦する', async ({ page }) => {
  await startGame(page)
  await page.getByRole('button', { name: 'もう一度遊ぶ' }).click()

  await expect(page.getByRole('grid', { name: '5 x 5 のゲーム盤' })).toBeVisible()
  await expect(page.getByText('あなたの手番')).toBeVisible()
})

test('ENDGAME-NAV-004 進行中のゲームを再読み込みするとトップページへ戻る', async ({ page }) => {
  await startGame(page)
  await page.reload()

  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole('button', { name: 'ゲームスタート' })).toBeVisible()
})

test('ENDGAME-NAV-005 未定義ルートにアクセスするとトップページへ戻る', async ({ page }) => {
  await page.goto('./#/unknown-route')

  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole('button', { name: 'ゲームスタート' })).toBeVisible()
})
