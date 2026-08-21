---
name: e2e-runner
description: 'E2Eテストを実行する。Use when テストを実行する、テストを走らせる、playwright test、npm test、特定のテストだけ実行、デバッグ実行、と依頼されたとき。'
---

# E2Eテスト実行

Playwright テストを実行し、結果を確認する。

## When to Use This Skill

- 「テストを実行して」「テストを走らせて」と依頼されたとき
- 特定のテストファイルだけ実行したいとき
- デバッグモードやヘッド付きで実行したいとき
- 本番環境（GitHub Pages）の動作確認をするとき

## 前提条件

実行前に以下が完了していること:

```bash
# 依存パッケージがインストール済み
npm install

# Playwright ブラウザがインストール済み
npx playwright install --with-deps chromium
```

## 実行コマンド

### 基本実行

```bash
# 全テスト実行（ローカル開発サーバー対象）
npm run test:e2e

# 特定ファイルのみ
npx playwright test tests/e2e/home.spec.ts

# 特定テスト名でフィルタ
npx playwright test -g "出題設定"
```

### デバッグ・開発用

```bash
# ブラウザを表示して実行（動作確認用）
npm run test:e2e:headed

# Playwright UI モード（インタラクティブ）
npx playwright test --ui

# デバッグモード（ステップ実行）
npx playwright test --debug
```

### テスト対象の切り替え

```bash
# ローカル開発サーバー（デフォルト）
npm run test:e2e

# 本番環境（GitHub Pages）
$env:BASE_URL="https://jun-shiromizu.github.io/english-idiom-target-1000/"; npm run test:e2e
```

PowerShell 以外の場合:
```bash
# bash / zsh
BASE_URL=https://jun-shiromizu.github.io/english-idiom-target-1000/ npm run test:e2e
```

## 実行結果の確認

### テスト成功時

```
Running 5 tests using 1 worker

  ✓ home.spec.ts:8:5 › トップページ › 出題設定フォームが表示される (1.2s)
  ✓ home.spec.ts:20:5 › トップページ › 開始ボタンで出題画面に遷移する (2.1s)
  ✓ quiz.spec.ts:8:5 › 出題画面 › 問題が表示される (1.8s)
  ✓ quiz.spec.ts:25:5 › 出題画面 › 正解ボタンで次の問題に進む (2.4s)
  ✓ result.spec.ts:8:5 › 結果画面 › 正解数が表示される (1.5s)

  5 passed (9.0s)
```

### テスト失敗時

1. コンソール出力でエラー内容を確認
2. `test-results/` 配下にスクリーンショット・トレースが保存される
3. `npx playwright show-report` で HTML レポートを開いて詳細確認

### Trace Viewer で失敗を分析

```bash
# 失敗テストのトレースを開く
npx playwright show-trace test-results/<test-name>/trace.zip
```

## package.json スクリプト（想定）

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

## playwright.config.ts（想定）

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173/english-idiom-target-1000/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173/english-idiom-target-1000/',
    reuseExistingServer: true,
  },
  retries: process.env.CI ? 2 : 0,
})
```

## フォルダ構成

```
tests/
└── e2e/
    ├── home.spec.ts      … トップページ
    ├── quiz.spec.ts      … 出題画面
    └── result.spec.ts    … 結果サマリー画面
```

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| ブラウザが見つからない | `npx playwright install --with-deps chromium` |
| タイムアウトする | GitHub API のレートリミット超過の可能性。時間をおいて再実行 |
| ローカルでは通るがCIで落ちる | ヘッドレス固有の問題。`video: 'on'` で動作確認 |
| 要素が見つからない | セマンティックロケータの name が変わっていないか確認 |
| ハッシュルーターで URL がずれる | `#/quiz` 形式になっている想定で locator を調整 |
