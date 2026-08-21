import { expect, test } from '@playwright/test'

test('TOP-START-001 先手を選んで開始する', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('radio', { name: /先手/ }).check()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()

  await expect(page).toHaveURL(/#\/game$/)
  await expect(page.getByText('あなたが先手')).toBeVisible()
  await expect(page.getByText('あなたの手番')).toBeVisible()
})

test('TOP-START-002 後手を選んで開始する', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('radio', { name: /後手/ }).check()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()

  await expect(page).toHaveURL(/#\/game$/)
  await expect(page.getByText('COM が先手')).toBeVisible()
  await expect(page.getByText('COM が考えています')).toBeVisible()
})

test('TOP-START-003 ランダム設定で有効な先手を生成する', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('radio', { name: /ランダム/ }).check()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()

  await expect(page).toHaveURL(/#\/game$/)
  await expect(page.getByText(/あなたが先手|COM が先手/)).toBeVisible()
})
