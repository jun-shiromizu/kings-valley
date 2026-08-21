---
name: e2e-spec-writer
description: 'Kings Valley の Playwright E2E テスト仕様を YAML で作成・更新する。Use when E2E仕様を書く、テストシナリオを設計する、specs配下にYAMLを追加する、主要導線の受け入れ条件を整理する、と依頼されたとき。'
---

# E2E 仕様作成

`docs/product-requirements.md` の利用者視点の受け入れ基準を、実装から独立した YAML シナリオにする。

## 配置

```text
specs/
├── top/
├── game/
└── endgame/
```

ファイル名は `<対象>-<振る舞い>.yaml` とし、1ファイルを1つの機能群に絞る。

## 形式

```yaml
title: プレイヤーが先手で対局を開始する
source: docs/product-requirements.md FR-01
scenarios:
  - id: TOP-START-001
    name: 先手を選んで開始する
    precondition: トップページを表示している
    steps:
      - action: 先手を選択する
      - action: ゲームスタートを実行する
    expect:
      - ゲームページが表示される
      - プレイヤーの手番と表示される
```

## 記述ルール

- `source` に要件 ID または受け入れ基準を記載する。
- `precondition` は認証、localStorage、DB、外部 API を前提にせず、画面表示または UI 操作で作れる状態にする。
- action は利用者の操作、expect は観測可能な結果を書く。
- CSS selector、待ち時間、関数名など実装詳細を書かない。
- ランダム設定では可能な結果の集合を定義する。固定結果が必要なら `random` を固定する旨を明記する。
- ルールの全組み合わせは単体テストへ寄せ、E2E は主要導線と統合境界に絞る。

## 初期リリースの機能群

- 先手、後手、ランダムでの開始
- 初期盤面、手番、中央、駒種の表示
- 駒選択、再選択解除、選択切替、合法方向
- プレイヤー移動後の COM 着手と入力ロック
- 勝利、敗北、引き分けの表示
- もう一度、トップページ、再読み込み、未定義ルート
- 320px とデスクトップでの主要操作、キーボード操作

作成後は重複 ID、曖昧な期待値、正本との矛盾を確認し、`e2e-codegen` へ渡す。