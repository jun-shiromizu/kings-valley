---
name: e2e-reporter
description: 'Kings Valley の Playwright 実行結果と証跡を整理して報告する。Use when E2E結果をまとめる、失敗原因を報告する、HTMLレポートやtraceを確認する、テスト証跡を整理する、と依頼されたとき。'
---

# E2E 結果報告

テスト実行結果を、再現と判断に必要な情報へ絞って報告する。

## 確認元

- Playwright の標準出力
- `playwright-report/`
- `test-results/` の trace、スクリーンショット、動画
- 対応する `specs/` YAML と `tests/e2e/` spec
- CI 実行時は対象 workflow run と artifact

生成物の場所や保持期間は `playwright.config.ts` と workflow を確認し、存在を推測しない。

## 報告項目

```md
## E2E テスト結果

- 対象: 
- 環境 / URL: 
- コマンド: 
- 結果: Passed / Failed / Skipped
- 所要時間: 

## 失敗

| Scenario | 症状 | 原因 | 対応 |
| --- | --- | --- | --- |

## 証跡

- HTML report: 
- Trace / screenshot: 

## 未確認事項

- 
```

## 判定

- Passed: 対象 scenario がすべて成功し、意図しない skip がない。
- Failed: 製品不具合、テスト不具合、環境不具合を区別して記載する。
- Blocked: 起動不能、依存不足、権限不足などでテスト自体を評価できない。

失敗時は scenario ID、最初の本質的エラー、再現条件を示す。成功件数だけで品質を断定せず、未実行 browser、viewport、本番確認などの残余リスクを明記する。