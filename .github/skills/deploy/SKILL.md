---
name: deploy
description: 'Kings Valley を GitHub Pages へ自動デプロイする設定を実装・確認する。Use when デプロイする、GitHub Pagesに公開する、Actions workflowを作る、本番反映や公開URLを確認する、と依頼されたとき。'
---

# GitHub Pages デプロイ

Vite の静的成果物を GitHub Pages の公式 artifact 方式で公開する。

## 正本と前提

- `docs/product-requirements.md` の配信要件を確認する。
- 公開 URL は `https://jun-shiromizu.github.io/kings-valley/` とする。
- `main` への push を契機に自動デプロイする。
- 初回のみ Settings > Pages > Source を `GitHub Actions` に設定する必要がある。

## アプリ設定

- `vite.config.ts` の `base` を `/kings-valley/` にする。
- Vue Router は `createWebHashHistory(import.meta.env.BASE_URL)` を使用する。
- アセットは Vite の import または base path を考慮した URL で参照する。

## Workflow 要件

`.github/workflows/deploy.yml` に次を設定する。

- trigger: `main` への push と、再実行用の `workflow_dispatch`
- permissions: `contents: read`, `pages: write`, `id-token: write`
- concurrency: `github-pages` グループ
- Node.js Active LTS と npm cache
- `npm ci`
- `npm run type-check`
- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `actions/configure-pages`
- `actions/upload-pages-artifact` で `dist/` をアップロード
- `actions/deploy-pages` と `github-pages` environment で公開

E2E を workflow 内で実行する場合は Playwright browser の導入と dev server 起動を明示する。最小デプロイ workflow では E2E を別の CI またはデプロイ後確認に分けてよい。

Actions のバージョンは作成時点の公式ドキュメントにある安定版を確認し、古い例を固定的に流用しない。

## 実施手順

1. package scripts、Vite base、Router history、workflow を確認する。
2. ローカルで型チェック、Lint、単体テスト、ビルドを実行する。
3. `npm run preview` で `/kings-valley/` 配下のアセットと `#/game` を確認する。
4. 変更を `main` へ反映する。コミットや PR が必要なら `commit-and-pr` を使う。
5. Actions の build/deploy jobs と Pages URL を確認する。
6. 本番 URL でトップ、ゲーム開始、再読み込み、アセット表示を確認する。必要に応じて `e2e-runner` を使う。

## 失敗時の確認

| 症状 | 確認点 |
| --- | --- |
| 空白画面・アセット404 | Vite の `base` とアセット URL |
| ルート404 | hash history とアクセス URL |
| artifact がない | `dist/` の生成と upload path |
| deploy が拒否される | Pages Source、permissions、environment |
| npm script がない | `package.json` と README の予定コマンド |

失敗した workflow の再実行だけで回避せず、設定または検証失敗の原因を修正する。