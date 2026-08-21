---
name: vue-dev
description: 'Kings Valley の Vue 3 画面、コンポーネント、ルーター、対局状態を実装・修正する。Use when Vueを実装する、トップページやゲーム画面を作る、盤面UIや操作を追加する、configを設定する、と依頼されたとき。'
---

# Vue 3 実装

Vue 3、TypeScript、Vite、Composition API、Vue Router で Kings Valley を実装する。

## 正本

`docs/product-requirements.md` を先に読み、画面、操作、アクセシビリティ、終局、再読み込みの要件を受け入れ条件にする。ゲームルールの実装では `game-logic-dev` を併用する。

## 構成の目安

```text
src/
├── domain/           # Vue に依存しない型、盤面、合法手、終局、COM
├── composables/      # 対局進行と UI 状態の調停
├── components/       # 盤面、駒、方向、手番、終局表示
├── views/            # TopView、GameView
├── router/           # #/、#/game、fallback
├── assets/
├── App.vue
└── main.ts
```

既存構成がある場合は、名前を機械的に合わせず責務の境界を維持する。

## 実装原則

- `<script setup lang="ts">` と厳格な型を使い、`any` を避ける。
- 盤面計算、勝敗、反復、COM 選択をコンポーネント内に実装しない。
- composable は domain の純粋関数を呼び、選択中の駒、入力ロック、COM 待機、画面表示を管理する。
- タイマーは破棄時と再戦時に解除し、終局後の COM 着手を防ぐ。
- 対局状態はメモリだけに保持し、localStorage、外部 API、認証を追加しない。
- `/game` を直接開いた場合や再読み込み時はトップへ戻す。
- Router は `createWebHashHistory(import.meta.env.BASE_URL)` を使う。

## UI と操作

- 盤面は CSS Grid の5 x 5、正方形、レスポンシブな安定寸法にする。
- プレイヤーを常に手前、COM を奥へ表示する。
- 陣営、王様、兵士、選択、中央、手番を色だけに依存せず識別可能にする。
- 駒と移動方向は semantic button とし、明確な accessible name を付ける。
- 合法な方向だけを矢印で示し、クリック、タップ、キーボードで同じ操作を行えるようにする。
- COM 手番、移動中、終局後は競合する入力を無効にする。
- 終局結果は dialog 相当として通知し、「もう一度」と「トップページ」を提供する。
- `aria-live` で手番、COM 思考中、終局を通知する。
- `prefers-reduced-motion` ではアニメーションを抑える。
- 320px 以上で文字、矢印、駒、結果表示の重なりと横スクロールがないことを確認する。

## 進め方

1. 対象要件と既存実装・近接テストを確認する。
2. domain と UI のどちらが責務を持つか決め、最小変更を実装する。
3. `unit-test-codegen` でロジックまたはコンポーネントのテストを追加する。
4. 必要な主要導線は `e2e-spec-writer` と `e2e-codegen` で追加する。
5. 型チェック、Lint、単体テスト、E2E、ビルドを対象範囲に応じて実行する。