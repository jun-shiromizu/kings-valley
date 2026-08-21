import { expect, test } from '@playwright/test'

test('GAME-MOVE-001 合法方向を選んでプレイヤーの駒を動かす', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('radio', { name: /先手/ }).check()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()

  const king = page.getByRole('button', { name: 'あなたの王様' })
  await king.click()
  await expect(page.getByRole('button', { name: /へ移動$/ }).first()).toBeVisible()
  await page
    .getByRole('button', { name: /へ移動$/ })
    .first()
    .click()

  await expect(page.getByText('COM が考えています')).toBeVisible()
  await expect(page.getByText('あなたの手番')).toBeVisible({ timeout: 3000 })
})

test('GAME-ACCESS-001 キーボードで駒を選び移動する', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('radio', { name: /先手/ }).check()
  await page.getByRole('button', { name: 'ゲームスタート' }).click()

  const king = page.getByRole('button', { name: 'あなたの王様' })
  await king.focus()
  await page.keyboard.press('Enter')
  const moveArrow = page.getByRole('button', { name: /へ移動$/ }).first()
  await expect(moveArrow).toBeVisible()
  await moveArrow.focus()
  await page.keyboard.press('Enter')

  await expect(page.getByText('あなたの手番')).toBeVisible({ timeout: 3000 })
})
