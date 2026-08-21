import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'スマートフォン', width: 320, height: 568 },
  { name: 'タブレット', width: 768, height: 1024 },
  { name: 'デスクトップ', width: 1440, height: 900 },
]

test.describe('レスポンシブとアクセシビリティ', () => {
  for (const viewport of viewports) {
    test(`${viewport.name} で横スクロールせず盤面が正方形`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('./')
      await page.getByRole('radio', { name: /先手/ }).check()
      await page.getByRole('button', { name: 'ゲームスタート' }).click()

      const board = page.locator('.board-shell')
      const box = await board.boundingBox()
      expect(box).not.toBeNull()
      expect(Math.abs((box?.width ?? 0) - (box?.height ?? 0))).toBeLessThan(2)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    })
  }

  test('reduced motion では UI の transition を抑制する', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('./')

    const transitionDuration = await page.locator('.start-button').evaluate((element) => getComputedStyle(element).transitionDuration)
    expect(['0.01ms', '1e-05s', '0.00001s']).toContain(transitionDuration)
  })

  test('200% 相当の拡大状態でも開始操作を完了できる', async ({ page }) => {
    await page.goto('./')
    await page.evaluate(() => {
      document.body.style.zoom = '2'
    })
    await page.getByRole('radio', { name: /先手/ }).check()
    await page.getByRole('button', { name: 'ゲームスタート' }).click()

    await expect(page).toHaveURL(/#\/game$/)
    await expect(page.getByText('あなたの手番')).toBeVisible()
  })

  test('タップ操作で駒を選び COM との手番を進められる', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('radio', { name: /先手/ }).check()
    const startButton = page.getByRole('button', { name: 'ゲームスタート' })
    if (test.info().project.name === 'mobile') await startButton.tap()
    else await startButton.click()

    const king = page.getByRole('button', { name: 'あなたの王様' })
    const moveArrow = page.getByRole('button', { name: /へ移動$/ }).first()
    if (test.info().project.name === 'mobile') {
      await king.tap()
      await moveArrow.tap()
    } else {
      await king.click()
      await moveArrow.click()
    }

    await expect(page.getByText('あなたの手番')).toBeVisible({ timeout: 3000 })
  })
})
