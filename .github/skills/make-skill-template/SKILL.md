---
name: make-skill-template
description: '本リポジトリに新しい Agent Skill を設計・作成し、frontmatter と参照を検証する。Use when Skillを作る、AgentSkillsを追加する、SKILL.mdを雛形から作る、既存Skillを分割する、と依頼されたとき。'
---

# Agent Skill 作成

繰り返し使うプロジェクト固有ワークフローを `.github/skills/` に追加する。

## Skill を選ぶ条件

- 複数手順を持つ、オンデマンドの専門ワークフローに Skill を使う。
- ほぼすべての作業へ常時適用する規約は `.github/copilot-instructions.md` を検討する。
- 1回限りの短い定型操作は prompt、外部システム連携は MCP を検討する。
- 既存 Skill と責務が重複する場合は、新設せず既存 Skill を更新する。

## 配置

```text
.github/skills/<skill-name>/
├── SKILL.md
├── scripts/       # 必要な場合だけ
├── references/    # 必要な場合だけ
└── assets/        # 必要な場合だけ
```

## frontmatter

```yaml
---
name: skill-name
description: '何を行うか。Use when 具体的な依頼語や利用場面。'
---
```

- `name` は1〜64文字の小文字英数字とハイフンを使い、フォルダー名と一致させる。
- `description` は1024文字以内で、WHAT と WHEN、検索に使う具体的なキーワードを含める。
- 必要に応じて `argument-hint`、`user-invocable`、`disable-model-invocation` を追加する。
- コロンなど YAML で意味を持つ文字を含む値は引用符で囲む。

## 本文

1. Skill の目的と対象範囲を書く。
2. 前提または正本を示す。
3. 判断基準と番号付き手順を書く。
4. 実行後の検証と失敗時の扱いを書く。
5. 他 Skill を参照する場合は実在する名前を記載する。

本文は500行未満を目安にし、詳細資料は `references/` へ分ける。付属ファイルへのリンクは `SKILL.md` からの相対パスにする。

## 作成手順

1. 既存 Skill を検索し、責務の重複がないことを確認する。
2. 利用者のトリガー語と期待する成果物を決める。
3. `.github/skills/<name>/SKILL.md` を作成する。
4. 必要なリソースだけを同梱する。
5. frontmatter、folder/name 一致、相対リンク、参照 Skill を検証する。
6. Skill 一覧の検索で description が意図した用途を表すことを確認する。

本リポジトリには Skill 専用 validation script がないため、存在しない npm command を案内しない。将来 validator が追加された場合は、`package.json` を確認してから実行する。