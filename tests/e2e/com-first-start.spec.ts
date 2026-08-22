import { expect, test } from '@playwright/test'
import { expectSingleComMoveFromInitialRender, initialBoardSnapshot } from './support/game-board'

test.describe('COM先手の開始', () => {
  test('後手を選ぶとCOMが短い待ち時間の後に初手を指す', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('radio', { name: /後手/ }).check()
    await page.getByRole('button', { name: 'ゲームスタート' }).click()

    await expect(page).toHaveURL(/#\/game$/)
    await expect(page.getByText('COM が先手')).toBeVisible()
    await expectSingleComMoveFromInitialRender(page, initialBoardSnapshot())
  })

  test('ランダムでCOM先手になった場合もCOMが短い待ち時間の後に初手を指す', async ({ page }) => {
    await page.addInitScript(() => {
      Math.random = () => 0.9
    })

    await page.goto('/')
    await page.getByRole('radio', { name: /ランダム/ }).check()
    await page.getByRole('button', { name: 'ゲームスタート' }).click()

    await expect(page).toHaveURL(/#\/game$/)
    await expect(page.getByText('COM が先手')).toBeVisible()
    await expectSingleComMoveFromInitialRender(page, initialBoardSnapshot())
  })
})
