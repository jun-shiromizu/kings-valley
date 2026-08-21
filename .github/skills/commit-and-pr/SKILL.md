---
name: commit-and-pr
description: '修正内容を整理し、日本語のコミットメッセージを作成してコミットし、日本語で Pull Request を作成する。Use when 修正してPRまで進める、コミットメッセージを作る、コミットする、PRを作る、変更をレビューに出す、と依頼されたとき。'
---

# 修正から PR 作成まで

このプロジェクトで、修正完了後にブランチ作成、日本語コミットメッセージ作成、コミット、日本語 PR 作成まで進めるためのスキル。

## 目的

- `main` に直接 push せず、安全にブランチと PR を使って変更を取り込む
- コミットメッセージと PR 本文を日本語で統一する
- PR 前に最低限の検証を済ませ、required check に流す前の品質を確保する

## 使う場面

- 小さな修正を入れてそのまま PR まで進めたいとき
- コミットメッセージをどう書くか迷うとき
- PR タイトルと本文を日本語で揃えたいとき
- branch protection に従って `main` 以外のブランチからレビュー依頼したいとき

## 基本方針

- **現在の `main` を起点に新しいブランチを作る**
- **変更に見合った最小限の検証をしてからコミットする**
- **コミットメッセージは日本語で簡潔に書く**
- **PR タイトルも日本語にし、本文には理由と確認内容を書く**

## 標準フロー

### 1. `main` 直 push 禁止の確認

最初に、このリポジトリでは branch protection により `main` への直接 push が禁止されている前提で動く。

- `git push origin main` を作業完了フローの候補に入れない
- 修正を始める前に、必ず作業ブランチを切る前提で進める
- すでに `main` 上で作業していた場合も、そのまま push せずブランチへ逃がしてから PR に載せる

### 2. `main` の状態確認

最初に以下を確認する。

```bash
git branch --show-current
git fetch origin
git status -sb
```

- `main` にいるか
- 作業ツリーが clean か
- `origin/main` と大きくズレていないか

必要なら `main` を `origin/main` に揃えてから始める。

### 3. ブランチ作成

ブランチ名は変更内容が分かるものにする。

```bash
git checkout -b fix/<topic>
git checkout -b chore/<topic>
git checkout -b docs/<topic>
git checkout -b feat/<topic>
```

例:

- `fix/theme-preview`
- `chore/update-deploy-skill`
- `docs/readme-ci-flow`

### 4. 修正と検証

変更内容に応じて、少なくとも次のどれかを実施する。

- 対象ユニットテスト
- `npm run build`
- 必要なら `npm run test:e2e`

このリポジトリでよく使う確認コマンド:

```bash
# ユニットテスト単体実行
npx vitest run src/composables/__tests__/useThemeSettings.spec.ts

# 全ユニットテスト
npx vitest run

# E2E テスト
npm run test:e2e

# ビルド確認
npm run build
```

### 5. 差分確認

コミット前に最低限これを確認する。

```bash
git status --short
git diff --stat
```

意図しないファイルが混ざっていれば除外してから進める。

### 6. 日本語コミットメッセージ作成

コミットメッセージは 1 行で、変更内容を端的に表す。

#### 推奨パターン

- `<対象>を修正`
- `<対象>を更新`
- `<対象>を追加`
- `<対象>を改善`
- `<対象>を整理`
- `<対象>を最新化`

#### 例

- `テーマ設定のダーク配色を追加`
- `CI の required status を固定化`
- `README のデプロイ手順を更新`
- `Dependabot 設定を追加`
- `GitHub データ取得の再帰探索に対応`

#### 避けたい例

- `fix`
- `update`
- `いろいろ修正`
- `対応`

### 7. コミット

```bash
git add <必要なファイル>
git commit -m "README のデプロイ手順を更新"
```

基本は `git add .` ではなく、対象ファイルを明示する。

### 8. Push

```bash
git push -u origin <branch-name>
```

### 9. 日本語 PR 作成

PR タイトルも日本語で簡潔に書く。

#### 推奨パターン

- `<変更内容>を修正`
- `<変更内容>を更新`
- `<変更内容>を追加`
- `<変更内容>に対応`

#### 例

- `README のデプロイ手順を更新`
- `required status を固定化`
- `Dependabot 設定を追加`

## PR 本文テンプレート

```md
## 概要
- 
- 

## 変更理由
- 

## 確認内容
- 
- 

## 補足
- 
```

### 記入例

```md
## 概要
- README に branch protection 用の required check 名を追記
- CI workflow から安定した commit status を publish するよう修正

## 変更理由
- GitHub の表示上の check run 名を required にすると `Expected` のまま止まるケースがあったため

## 確認内容
- npm run build
- GitHub Actions の workflow YAML 診断

## 補足
- branch protection では `required-pr-checks` を required check に設定する
```

## PR 作成前チェックリスト

- 作業ブランチである
- 不要な差分が含まれていない
- 必要な検証を実行した
- コミットメッセージが日本語で具体的
- PR タイトルが日本語で具体的
- PR 本文に概要・理由・確認内容がある

## このリポジトリ固有の注意点

- `main` への直接 push は branch protection で禁止される前提で進める
- required check は `required-pr-checks` を使う
- デプロイは `main` 反映後、Actions の `Deploy to GitHub Pages` を手動実行する
- Dependabot や workflow 変更では、GitHub 上の check 名よりも安定した status context を優先する

## このスキルで期待する動作

このスキルを使うときは、以下を一連で進める。

1. `main` 起点でブランチを切る
2. 変更内容に応じた検証を行う
3. 日本語コミットメッセージを作る
4. コミットして push する
5. 日本語タイトル・本文で PR を作る

途中で branch protection や CI に引っかかった場合は、その原因も含めてユーザーへ報告する。