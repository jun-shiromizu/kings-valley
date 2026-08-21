---
name: delivery-flow
description: '修正・Issue対応・feature branch・コミット・PR・push・本番反映の依頼を最初に整理し、適切なブランチ運用とスキルへ振り分ける入口スキル。Use when Issueに対応する、feature branchで作業する、mainで修正してと言われる、コミットだけしたい、PRだけ作りたい、pushしたい、レビューに出したい、デプロイしたい、と依頼されたとき。'
---

# 全体運用フロー

このスキルは、修正依頼や Issue 対応依頼を受けたときに、現在の git 状態と依頼内容を整理して、適切な次のスキルや手順へ振り分ける入口スキル。

## 役割

- 依頼が実装なのか、コミット / PR なのか、デプロイなのかを切り分ける
- `main` 直 push 禁止の前提を最初に確認する
- ユーザーがすでに作った feature branch を尊重する
- Issue 番号がある依頼では、その番号をブランチ名や PR に反映する

## 最初に必ず確認すること

1. 現在のブランチは何か
2. 作業ツリーは clean か
3. `main` への直接 push が禁止される前提か
4. ユーザーがすでに branch を切っているか
5. Issue 番号があるか

確認コマンド例:

```bash
git branch --show-current
git fetch origin
git status -sb
```

## 基本ルール

- `main` にいるからといって、そのまま修正して push しない
- ユーザーが `main で雑に push して` と言っても、branch protection に従ってブランチと PR に切り替える
- すでに feature branch があるなら、その branch を使う
- すでに修正済みなら、不要な再実装やブランチ切り直しをしない

## 分岐ルール

### A. 「Issue #999 に対応して」「機能修正して」

- 実装作業に入る
- 実装には `vue-dev` を使う
- テストが必要なら `unit-test-codegen` / `unit-test-runner` / `e2e-*` を使う
- 完了後は `commit-and-pr` スキルの流れへ進む

### B. 「feature branch は自分で作った」「コミットと PR だけやって」

- 既存ブランチをそのまま使う
- 未コミット差分と検証状況を確認する
- `commit-and-pr` スキルを使って、日本語コミットメッセージ作成、コミット、PR 作成へ進む

### C. 「main ブランチで、雑に ●● に対応して push して」

- そのまま `main` に push しない
- `main` の状態を確認し、必要なら作業ブランチを切る
- 実装後は `commit-and-pr` スキルで PR まで進める

### D. 「本番に反映して」「GitHub Pages にデプロイして」

- まず変更が `main` に入っているか確認する
- `main` に未反映なら先に PR / マージまで案内または実施する
- `main` 反映済みなら `deploy` スキルで手動デプロイへ進む

## Issue 番号の扱い

- Issue 番号がある場合は、可能なら branch 名・コミット・PR で追跡できるようにする
- 例:
  - branch: `fix/issue-999-theme-bug`
  - PR 本文: `Issue #999 に対応`

## 呼び出し先の目安

- 実装: `vue-dev`
- ユニットテスト追加: `unit-test-codegen`
- ユニットテスト実行: `unit-test-runner`
- E2E 仕様 / コード / 実行: `e2e-spec-writer`, `e2e-codegen`, `e2e-runner`
- コミット / PR: `commit-and-pr`
- デプロイ: `deploy`

## このスキルで期待する判断

- 依頼がどれだけ雑でも、最初に git 状態と branch protection 前提を確認する
- `main` 直 push の指示をそのまま実行しない
- 既存の feature branch や Issue 情報を見落とさない
- 最後に適切な専門スキルへ渡す