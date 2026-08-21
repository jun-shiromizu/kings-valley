---
name: e2e-spec-writer
description: 'E2Eテスト仕様書（YAML）を作成・更新する。Use when テスト仕様を書く、テストシナリオを追加する、specs/配下にYAMLを作成する、テストケースを設計する、と依頼されたとき。'
---

# E2Eテスト仕様書の作成

テスターが自然言語でE2Eテストシナリオを記述するための YAML 仕様書を作成する。

## When to Use This Skill

- 新しいテストシナリオを追加したいとき
- 既存のテスト仕様を修正・拡充したいとき
- テスト対象の機能が追加・変更されたとき
- 「テスト仕様を書いて」「テストケースを作って」と依頼されたとき

## フォルダ構成

画面（ページ）別にサブディレクトリを分け、その中にアクション別の YAML を配置する。

```
specs/
├── home/
│   ├── settings-form.yaml       … 出題設定フォーム
│   └── history-clear.yaml       … 不正解履歴クリア
├── quiz/
│   ├── question-display.yaml    … 問題表示
│   ├── answer-display.yaml      … 回答表示
│   └── correct-incorrect.yaml   … 正解/不正解判定
└── result/
    └── summary.yaml             … 結果サマリー
```

## YAML フォーマット

```yaml
feature: <機能名（日本語可）>
action: <アクション名>
page: <対象ページのパス（ハッシュルーターなので # 以降を記載）>

scenarios:
  - id: <画面略称>-<連番3桁>
    category: normal | error | boundary | regression
    status: done | pending | blocked | skipped
    scenario: <シナリオ名（日本語、1行で概要）>
    precondition: <前提条件>
    steps:
      - <操作手順1>
      - <操作手順2>
    expect:
      - <期待結果1>
      - <期待結果2>
```

### 必須フィールド

| フィールド | 説明 |
|---|---|
| `feature` | 機能名。日本語可 |
| `action` | このファイルが対象とするアクション |
| `page` | 対象ページのハッシュパス（例: `#/`, `#/quiz`, `#/result`） |
| `scenarios` | シナリオの配列 |
| `scenarios[].id` | シナリオID。`<画面略称>-<連番3桁>` 形式 |
| `scenarios[].category` | `normal` / `error` / `boundary` / `regression` |
| `scenarios[].status` | `done`（テストコード生成済み）/ `pending`（未着手）/ `blocked` / `skipped` |
| `scenarios[].scenario` | シナリオ名（1行で概要） |
| `scenarios[].steps` | 操作手順の配列 |
| `scenarios[].expect` | 期待結果の配列 |

### 任意フィールド

| フィールド | 説明 |
|---|---|
| `scenarios[].precondition` | 前提条件 |

## シナリオ ID 体系

| 画面 | 略称 | ID例 |
|---|---|---|
| トップページ（設定） | HOME | HOME-001, HOME-201 |
| 出題画面 | QUIZ | QUIZ-001, QUIZ-201 |
| 結果サマリー画面 | RESULT | RESULT-001 |

### 連番レンジ

| レンジ | 観点 |
|---|---|
| 001〜099 | 正常系 |
| 200〜299 | 異常系・バリデーション |
| 300〜399 | 境界値 |
| 400〜499 | リグレッション |

## precondition の書き方

このプロジェクトは認証なし・localStorage 管理のため、前提条件は以下のいずれかを使用：

```yaml
precondition: localStorage がクリアな状態
precondition: 不正解履歴が存在する状態
precondition: 中断セッションが存在する状態
precondition: トップページを表示している状態
precondition: 出題画面を表示している状態（1問目）
precondition: 全問回答済みで結果画面を表示している状態
```

## steps の書き方

1. **ユーザーの操作**を自然言語で書く（DOM要素やセレクタは書かない）
2. 具体的な値がある場合は「」で囲む（例: 開始番号「1」、終了番号「10」を入力）
3. 1ステップ = 1操作
4. 画面遷移が発生する場合は明示する

**良い例:**
```yaml
steps:
  - 開始番号に「1」、終了番号に「10」を入力する
  - 出題形式で「熟語（英語→日本語）」を選択する
  - 「開始」ボタンをクリックする
```

**悪い例:**
```yaml
steps:
  - ".v-select" をクリック                # ← セレクタは書かない
  - 設定を入力して開始する                # ← 複合操作は分割する
```

## expect の書き方

1. **画面上で確認できること**を書く（「〜と表示される」「〜に遷移する」）
2. 具体的な値がある場合は「」で囲む
3. ハッシュルーターのため URL 確認は `#/quiz` のように `#` 付きで記載

## ファイル命名規則

```
<アクション名>[-<観点>].yaml
```

- 小文字英数字 + ハイフンのみ
- 1ファイル上限: 20シナリオ（超えたら分割）

## 重要: テストコードとの同期

仕様を追加・変更した場合は、対応するテストコードも生成・更新すること（e2e-codegen スキル使用）。`status: done` なのにテストファイルが存在しない状態は不正。

## フォルダ構成

画面（ページ）別にサブディレクトリを分け、その中にアクション別の YAML を配置する。

```
specs/
├── _index.yaml              # 全テストのインデックス（自動生成、手動編集不可）
├── login/
│   ├── login-success.yaml
│   └── login-error.yaml
├── inventory/
│   ├── add-to-cart.yaml
│   └── sort-products.yaml
├── cart/
│   └── view-cart.yaml
└── checkout/
    ├── checkout-info.yaml
    └── checkout-complete.yaml
```

## YAML フォーマット

```yaml
feature: <機能名（日本語可）>
action: <アクション名>
page: <対象ページのパス>
owner: <担当者（任意）>

scenarios:
  - id: <画面略称>-<連番3桁>
    category: normal | error | boundary | regression
    status: done | pending | blocked | skipped   # テスト作成状態（実行結果ではない）
    scenario: <シナリオ名（日本語、1行で概要）>
    precondition: <前提条件>
    steps:
      - <操作手順1>
      - <操作手順2>
    expect:
      - <期待結果1>
      - <期待結果2>
```

### 必須フィールド

| フィールド | 説明 |
|---|---|
| `feature` | 機能名。日本語可 |
| `action` | このファイルが対象とするアクション |
| `page` | 対象ページのパス（`/inventory.html` 等） |
| `scenarios` | シナリオの配列 |
| `scenarios[].id` | シナリオID。`<画面略称>-<連番3桁>` 形式 |
| `scenarios[].category` | テスト観点の分類。`normal`(正常系) / `error`(異常系・バリデーション) / `boundary`(境界値) / `regression`(過去バグの再発防止) |
| `scenarios[].status` | テスト作成状態（実行結果ではない）。`done`(テストコード生成・レビュー済み、実行可能) / `pending`(未着手、仕様のみ or コード未生成) / `blocked`(何らかの理由で作成を進められない) / `skipped`(意図的に対象外とした) |
| `scenarios[].scenario` | シナリオ名（1行で概要） |
| `scenarios[].steps` | 操作手順の配列 |
| `scenarios[].expect` | 期待結果の配列 |

### 任意フィールド

| フィールド | 説明 |
|---|---|
| `owner` | 担当者名 |
| `scenarios[].precondition` | 前提条件（**precondition カタログから選択**） |

## precondition の書き方

**`fixtures/_preconditions.yaml`（precondition カタログ）に定義された key のみを使用する。**

- spec を書く前に `fixtures/_preconditions.yaml` を確認する
- カタログに該当する precondition がない場合は、先に fixture の追加を依頼する（`e2e-fixture-dev` スキル参照）
- 自由記述で precondition を作らない（fixture との対応が取れなくなる）

```yaml
# ✅ カタログに存在する key を使う
precondition: standard_userでログイン済み

# ❌ カタログにない文言を自由に書かない
precondition: 管理者ユーザーでダッシュボードにいる  # ← fixture がない
```

## シナリオ ID 体系

| 画面 | 略称 | ID例 |
|---|---|---|
| ログイン | LOGIN | LOGIN-001, LOGIN-201 |
| 商品一覧（inventory） | INV | INV-001, INV-010 |
| カート | CART | CART-001 |
| チェックアウト | CHKOUT | CHKOUT-001, CHKOUT-201 |

### 連番レンジ

| レンジ | 観点 |
|---|---|
| 001〜099 | 正常系 |
| 200〜299 | 異常系 |
| 300〜399 | 境界値 |
| 400〜499 | リグレッション |

## steps の書き方

1. **ユーザーの操作**を自然言語で書く（DOM要素やセレクタは書かない）
2. 具体的な値がある場合は「」で囲む（例: ユーザー名「standard_user」を入力）
3. 1ステップ = 1操作（複合操作は分割する）
4. 画面遷移が発生する場合は明示する

**良い例:**
```yaml
steps:
  - 商品一覧で「Sauce Labs Backpack」のAdd to cartボタンを押す
  - ヘッダーのカートアイコンをクリック
```

**悪い例:**
```yaml
steps:
  - "#inventory_container .btn_inventory" をクリック  # ← セレクタは書かない
  - 商品をカートに入れてカートを開く                    # ← 複合操作は分割する
```

## expect の書き方

1. **画面上で確認できること**を書く（「〜と表示される」「〜に遷移する」）
2. 具体的な値がある場合は「」で囲む
3. URL を確認する場合はパスを明示する（例: `/inventory.html`）
4. DB 確認が必要な場合は「DB:」プレフィックスを付ける

## ファイル命名規則

```
<アクション名>[-<観点>].yaml
```

- 小文字英数字 + ハイフンのみ
- 日本語は使わない
- 1ファイル上限: 20シナリオ（超えたら分割）

## 作成後の確認

1. `npm run gen:index` を実行して `_index.yaml` を更新する
2. 総数・ステータスの変化を確認する

## 重要: テストコードとの同期

**テスト仕様を追加・変更した場合は、必ず対応するテストコードも生成・更新すること。**

仕様だけ変更してテストコードに反映しないと、テストが実態と乖離する。以下の手順で同期を取る：

1. specs の YAML を作成・変更する
2. 対応する tests の .spec.ts を生成・更新する（e2e-codegen スキルを使用）
3. `npm run gen:index` で同期状態を確認する（`done` なのにテストファイルが存在しない場合は警告が出る）

仕様変更のみで作業を終えないこと。テストコードの生成・更新まで完了して1セットとする。
