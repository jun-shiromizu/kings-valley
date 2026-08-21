---
name: deploy
description: 'GitHub Pages へのデプロイを行う。Use when デプロイする、GitHub Pagesに公開する、本番環境に反映する、GitHub Actionsワークフローを作る、と依頼されたとき。'
---

# GitHub Pages デプロイ

Vue 3 アプリを GitHub Pages に手動デプロイする手順。

## デプロイ方式

- GitHub Pages の公式 artifact 方式を採用
- Pull Request では CI のみ実行する
- デプロイは GitHub Actions でビルド → Pages artifact を手動公開する
- branch への手動 push は行わない。全てワークフロー経由でデプロイ

## 現在の関連ワークフロー

- PR 検証: `.github/workflows/ci.yml`
- 手動デプロイ: `.github/workflows/deploy.yml`

## PR からマージまでの前提

- 最初に `main` への直接 push が禁止されている前提を確認する
- `main` へ直接 push せず、必ずブランチを切って Pull Request を作成する
- PR では `Required PR Checks` ワークフローが自動実行される
- branch protection の required check には `required-pr-checks` を設定する

## デプロイ前の必須条件

- **デプロイ前に必ずローカルで全テストを通すこと**
- 一部の関連テストだけで済ませず、少なくとも以下をすべて成功させてから PR を作成・更新すること
  - `npx vitest run`
  - `npm run test:e2e`
  - `npm run build`
- いずれか 1 つでも失敗した場合は、**デプロイ作業を中断して先に修正すること**
- GitHub Actions で検知させる前にローカルで失敗を止めることを優先する

## 公開 URL

```
https://jun-shiromizu.github.io/english-idiom-target-1000/
```

## 前提: vite.config.ts の設定

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  base: '/english-idiom-target-1000/',   // ← GitHub Pages のサブパスに必須
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
})
```

## 前提: Vue Router の設定

GitHub Pages は SPA のサーバーサイドルーティングに対応していないため `createWebHashHistory` を使用：

```typescript
import { createWebHashHistory, createRouter } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})
```

## GitHub Actions ワークフロー

ファイル: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

"on":
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: github-pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v6
        with:
          node-version: '24'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx vue-tsc --noEmit

      - name: Unit test
        run: npx vitest run

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## GitHub Pages の有効化手順

初回のみリポジトリで設定が必要：

1. GitHub リポジトリの Settings > Pages を開く
2. Source を「GitHub Actions」に設定
3. Save

## デプロイの流れ

```
ローカルで npx vitest run / npm run test:e2e / npm run build を全て成功
  ↓
作業ブランチを push して Pull Request を作成
  ↓
PR で Required PR Checks が成功
  ↓
PR を main にマージ
  ↓
Actions タブから Deploy to GitHub Pages を手動実行
  ↓
npm ci → typecheck → unit test → build → Pages artifact upload → Pages deploy
  ↓
GitHub Pages が配信
```

## 手動デプロイの実行場所

1. GitHub リポジトリの `Actions` タブを開く
2. `Deploy to GitHub Pages` を選ぶ
3. `Run workflow` を押す
4. 対象ブランチは通常 `main` を選ぶ

## ローカルビルド確認

デプロイ前にローカルでビルド成果物を確認する：

```bash
# ビルド
npm run build

# ビルド成果物をローカルプレビュー（base パス込みで確認）
npm run preview
# → http://localhost:4173/english-idiom-target-1000/
```

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| ページが真っ白 | `base` 設定が抜けている | `vite.config.ts` の `base` を確認 |
| ルーティングが 404 | `createBrowserHistory` を使っている | `createWebHashHistory` に変更 |
| 画像が表示されない | `public/` ではなく `src/assets/` に配置している | 画像は `public/` に置くか import する |
| Actions が失敗する | `permissions` や Pages 設定が不足している | ワークフロー YAML と Settings > Pages を確認 |
| 公開が進まない | Pages の Source が `GitHub Actions` ではない | Settings > Pages の Source を切り替える |
| PR が `Expected` で止まる | required check 名が GitHub の表示名と噛み合っていない | branch protection では `required-pr-checks` を required にする |

## 本番動作確認

デプロイ後に以下を確認する（e2e-runner スキル参照）：

```bash
# 本番 URL を対象に E2E テスト実行
$env:BASE_URL="https://jun-shiromizu.github.io/english-idiom-target-1000/"; npm run test:e2e
```

## このスキルで期待する判断

- デプロイ依頼を受けたら、まず PR 経由で `main` に入っているかを確認する
- `main` に未反映なら、先に修正ブランチ・PR フローを案内または実施する
- `main` 反映済みなら、`Deploy to GitHub Pages` を手動実行する
- デプロイ後は可能なら本番 URL への E2E か最低限の動作確認まで行う
