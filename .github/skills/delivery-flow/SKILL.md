---
name: delivery-flow
description: 'Issue対応、実装、ブランチ、コミット、PR、push、GitHub Pages反映の依頼を整理して適切な Skill へ振り分ける。Use when Issueに対応する、機能を実装してPRにする、コミットする、レビューに出す、デプロイする、と依頼されたとき。'
---

# 開発・配布フロー

依頼の範囲と Git の現在状態を確認し、必要な専門 Skill を順に使用する。

## 最初の確認

1. 依頼が調査、実装、テスト、コミット、PR、デプロイのどこまでを含むか確認する。
2. 現在のブランチ、作業ツリー、リモート、既存 PR を確認する。
3. ユーザー指定のブランチ、Issue 番号、未コミット差分を尊重する。
4. `docs/product-requirements.md` に関わる変更では、要件と実装を照合する。

## 振り分け

| 作業 | Skill |
| --- | --- |
| Vue 画面、ルーター、状態管理 | `vue-dev` |
| 盤面、合法手、終局、COM | `game-logic-dev` |
| Vitest の追加・修正 | `unit-test-codegen` |
| Vitest の実行 | `unit-test-runner` |
| E2E 仕様、実装、実行、報告 | `e2e-spec-writer`, `e2e-codegen`, `e2e-runner`, `e2e-reporter` |
| コミット、push、PR | `commit-and-pr` |
| Pages workflow、公開、確認 | `deploy` |

## 標準フロー

1. Issue または要件から受け入れ条件を特定する。
2. 既存ブランチを使うか、依頼に合う作業ブランチを作る。
3. 実装し、リスクに応じた単体テストと E2E テストを追加する。
4. 型チェック、Lint、テスト、ビルドを実行する。
5. 明示的に依頼されている場合はコミット、push、PR 作成へ進む。
6. `main` 反映後の Pages 公開依頼では workflow と本番動作を確認する。

ブランチ保護や required check は GitHub 上の実設定を確認して従い、存在を推測しない。すでに完了している工程は繰り返さない。