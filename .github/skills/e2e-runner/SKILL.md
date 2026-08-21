---
name: e2e-runner
description: 'Kings Valley の Playwright E2E テストをローカルまたは GitHub Pages に対して実行し、失敗を調査する。Use when E2Eを実行する、playwright test、特定specを走らせる、本番動作を確認する、と依頼されたとき。'
---

# Playwright E2E 実行

## 前提確認

- `package.json` と `playwright.config.ts` の webServer、baseURL、scripts を確認する。
- 標準 script は `npm run test:e2e` とする。
- browser がない場合だけ、プロジェクトが対象とする browser を `npx playwright install` で導入する。

## 実行

```sh
# 全体
npm run test:e2e

# ファイル限定
npx playwright test tests/e2e/game/move-piece.spec.ts

# scenario 名で限定
npx playwright test -g "GAME-MOVE-001"
```

headed、UI、debug モードは対話的な調査が必要な場合だけ使用する。

本番確認では設定が対応していることを確認してから、PowerShell で次のように base URL を渡す。

```powershell
$env:BASE_URL="https://jun-shiromizu.github.io/kings-valley/"; npm run test:e2e
```

## 失敗時

1. 最初の失敗、期待値、現在 URL、trace、スクリーンショットを確認する。
2. locator、待機条件、乱数、COM タイマー、viewport 依存を切り分ける。
3. 対象 spec を再実行し、通過後に関連範囲を実行する。
4. `e2e-reporter` で結果を整理する。

テストの期待値を弱めて通す、固定時間を増やす、失敗した spec を無効化する対応は行わない。