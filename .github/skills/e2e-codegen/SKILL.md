---
name: e2e-codegen
description: 'Kings Valley の YAML E2E 仕様から Playwright の spec.ts を実装・更新する。Use when YAMLからE2Eコードを作る、Playwrightテストを実装する、specsのシナリオを自動テストへ反映する、と依頼されたとき。'
---

# Playwright コード生成

`specs/` の利用者視点の仕様を `tests/e2e/` の Playwright テストへ1対1で対応させる。

## 対応

```text
specs/top/start-game.yaml  -> tests/e2e/top/start-game.spec.ts
specs/game/move-piece.yaml -> tests/e2e/game/move-piece.spec.ts
```

## 実装ルール

- `test` 名の先頭に YAML の scenario ID を含める。
- `getByRole`、`getByLabel`、`getByText` を優先し、CSS selector と XPath を避ける。
- 盤マスや方向など role だけで一意にならない対象は、意味のある accessible name または安定した `data-testid` を使う。
- `waitForTimeout` を使わず、手番表示、駒位置、dialog、disabled 状態などを待つ。
- テスト同士でページや状態を共有しない。各テストをトップページから独立して開始する。
- localStorage、認証、外部 API、DB fixture を追加しない。
- exact pixel、色だけ、アニメーション途中を主要な期待値にしない。

## ランダム性

COM や「ランダム」の結果を固定する必要がある場合は、ページ遷移前にアプリが使用する乱数源を制御する。プロダクション用の隠し URL や状態注入 API は追加しない。正確な手を問わないシナリオでは、合法な COM 着手後にプレイヤーへ手番が戻ることを検証する。

## 手順

1. YAML、正本、既存テスト、画面の accessible name を確認する。
2. `source` と scenario ID を維持してテストを実装する。
3. 必要最小限の page helper だけ共通化する。
4. `e2e-runner` で対象 spec を実行する。
5. 失敗時は locator を弱めず、UI のアクセシビリティまたは同期点を修正できないか確認する。

証跡のスクリーンショットや trace は Playwright 設定に従い、テストコード内へ一律に埋め込まない。