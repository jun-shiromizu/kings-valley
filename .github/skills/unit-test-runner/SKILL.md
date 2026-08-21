---
name: unit-test-runner
description: 'Kings Valley の Vitest を対象限定または全体で実行し、失敗原因と結果を報告する。Use when ユニットテストを実行する、vitestを走らせる、特定テストを確認する、カバレッジを確認する、と依頼されたとき。'
---

# Vitest 実行

## 前提確認

- `package.json` の scripts と Vitest 設定を確認する。
- 依存関係が未導入の場合だけ `npm install` を行う。
- README の標準 script は `npm run test:unit` とする。

## 実行順序

```sh
# 変更対象だけ
npx vitest run path/to/file.spec.ts

# 名前で限定
npx vitest run -t "中央マス"

# 全単体テスト
npm run test:unit -- --run
```

script が `vitest run` を既に含む場合は重複する `--run` を付けない。watch、UI、coverage はユーザー依頼または既存 script がある場合だけ使う。

## 失敗時

1. 最初の本質的な失敗とスタックを確認する。
2. 要件、テスト、実装のどれが不一致か切り分ける。
3. 乱数、fake timer、共有状態、テスト順依存を確認する。
4. 同じ対象テストで修正を検証してから全体を実行する。

報告にはコマンド、成功・失敗件数、変更に関係する失敗、未実行項目を含める。無関係な既存失敗は勝手に修正しない。