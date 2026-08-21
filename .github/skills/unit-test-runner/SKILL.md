---
name: unit-test-runner
description: 'Vitest によるユニットテストを実行する。Use when ユニットテストを実行する、テストを走らせる、vitest、カバレッジを確認する、テストが通るか確認して、と依頼されたとき。'
---

# ユニットテスト実行

Vitest でユニットテストを実行し、結果を確認する。

## When to Use This Skill

- 「ユニットテストを実行して」「テストを走らせて」と依頼されたとき
- 特定のファイルやテストだけ実行したいとき
- カバレッジレポートを確認したいとき
- テストが通るか確認したいとき

## 前提条件

```bash
# 依存パッケージがインストール済み
npm install
```

## 実行コマンド

### 基本実行

```bash
# 全テスト実行
npm run test:unit

# ウォッチモード（ファイル変更時に自動再実行）
npm run test:unit -- --watch

# 単一実行（CI向け）
npm run test:unit -- --run
```

### 特定ファイル・テストの実行

```bash
# 特定ファイル
npx vitest run src/composables/__tests__/useHistory.spec.ts

# ファイル名パターンでフィルタ
npx vitest run --reporter=verbose useHistory

# テスト名でフィルタ（-t オプション）
npx vitest run -t "正解を記録できる"
```

### カバレッジ

```bash
# カバレッジレポート生成
npm run test:coverage

# HTML レポートを開く
# → coverage/index.html をブラウザで確認
```

### デバッグ

```bash
# Vitest UI（ブラウザベースのインタラクティブUI）
npx vitest --ui
```

## package.json スクリプト（想定）

```json
{
  "scripts": {
    "test:unit": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

## vitest.config.ts（想定）

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  test: {
    globals: true,
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/__tests__/**', 'src/main.ts'],
    },
  },
})
```

## 実行結果の読み方

### 成功時

```
 ✓ src/composables/__tests__/useHistory.spec.ts (3 tests) 2ms
 ✓ src/composables/__tests__/useQuizSession.spec.ts (5 tests) 8ms
 ✓ src/components/__tests__/QuizQuestion.spec.ts (2 tests) 15ms

 Test Files  3 passed (3)
      Tests  10 passed (10)
   Start at  14:32:01
   Duration  1.23s
```

### 失敗時

```
 ❯ src/composables/__tests__/useHistory.spec.ts (3 tests | 1 failed) 3ms
   ✓ 正解を記録できる
   ✗ 最新の回答で上書きされる
   ✓ 履歴をクリアできる

⎯⎯⎯ Failed Tests ⎯⎯⎯

 FAIL  src/composables/__tests__/useHistory.spec.ts > useHistory > 最新の回答で上書きされる
AssertionError: expected true to be false

 ❯ src/composables/__tests__/useHistory.spec.ts:18:32
     16|     markCorrect('0001')
     17|     markIncorrect('0001')
     18|     expect(isCorrect('0001')).toBe(false)
       |                                ^
```

### 失敗時の対応手順

1. エラーメッセージとスタックトレースを確認
2. 期待値と実際値の差分を確認
3. テスト対象のソースコードを確認
4. テストコードの前提条件（モック設定等）を確認
5. 必要に応じて `--reporter=verbose` で詳細出力

## トラブルシューティング

### Vuetify コンポーネントがレンダリングされない

```typescript
// global.plugins に vuetify を追加する
import { createVuetify } from 'vuetify'
const vuetify = createVuetify()

mount(Component, {
  global: { plugins: [vuetify] },
})
```

### localStorage が undefined

```typescript
// vitest.config.ts で environment: 'jsdom' を設定する
// jsdom は localStorage をサポートしている
```

### fetch が undefined

```typescript
// テストファイルでモックする
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)
```

### Vue Router 関連のエラー

```typescript
import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }],
})

mount(Component, {
  global: { plugins: [router] },
})
```
