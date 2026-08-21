---
name: e2e-fixture-dev
description: 'E2Eテストの fixture（前提条件セットアップ）と precondition カタログを管理する。Use when fixtureを作る、前提条件を追加する、preconditionを整備する、ログイン済み状態を用意する、と依頼されたとき。'
---

# fixture / precondition の開発・管理

テストの前提条件（認証、画面遷移、データ準備等）を fixture として実装し、precondition カタログに登録する。

## When to Use This Skill

- 新しい前提条件（precondition）が必要になったとき
- 「ログイン済み状態の fixture を作って」と依頼されたとき
- spec の precondition に対応する fixture が存在しないとき
- fixture のリファクタリングや修正を行うとき

## 設計方針

詳細は `.e2e-test-auto/tips/テスト項目・テストケース_fixture管理.md` を参照すること。

## ファイル構成

```
fixtures/
├── _preconditions.yaml   # precondition カタログ（key → fixture の対応表）
├── base.ts               # fixture 定義（loggedInPage 等）
└── test-data.ts          # テストデータ定数（USERS, PRODUCTS 等）
```

## precondition カタログ

`fixtures/_preconditions.yaml` に、使用可能な precondition を定義する。spec の YAML ではこのカタログに存在する key のみを `precondition` に使える。

```yaml
preconditions:
  - key: "未ログイン状態"
    fixture: page
    description: Playwright 標準の page。ログイン画面が表示される状態。

  - key: "standard_userでログイン済み"
    fixture: loggedInPage
    description: standard_user でログイン済み、/inventory.html にいる状態。
    defined_in: fixtures/base.ts
```

## fixture 作成手順

### 1. 必要な前提条件を特定する

spec の YAML で使いたい precondition を決める。

### 2. Playwright Codegen で DOM を調査する

```bash
npm run codegen
```

前提条件に到達するまでの操作を手動で行い、生成されるロケータを収集する。

### 3. fixture を実装する

`fixtures/base.ts` に fixture を追加する。

```typescript
// 既存の fixture に依存する場合は階層化する
export const test = base.extend<{
  loggedInPage: Page;
  pageWithCart: Page;  // ← 新しい fixture
}>({
  loggedInPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
  pageWithCart: async ({ loggedInPage: page }, use) => {
    // loggedInPage に依存（ログイン済み状態から開始）
    await page
      .locator('[data-test="inventory-item"]', { hasText: 'Sauce Labs Backpack' })
      .getByRole('button', { name: 'Add to cart' })
      .click();
    await page.getByTestId('shopping-cart-link').click();
    await use(page);
  },
});
```

### 4. カタログに登録する

`fixtures/_preconditions.yaml` に新しいエントリを追加する。

```yaml
  - key: "カートに商品が入っている"
    fixture: pageWithCart
    description: ログイン済み + Sauce Labs Backpack がカートに1件入っている状態。
    defined_in: fixtures/base.ts
```

### 5. 動作確認する

新しい fixture を使ったテストを1件書いて実行し、前提条件が正しくセットアップされることを確認する。

## fixture 実装のルール

### ロケータ

- Playwright Codegen で取得した正確なロケータを使う
- セマンティックロケータ優先だが、fixture 内では `getByTestId()` や `locator()` も許容する（安定性を優先）

### 依存チェーン

- fixture は他の fixture に依存できる（`loggedInPage` → `pageWithCart` → `pageAtCheckoutStep2`）
- 循環依存は作らない
- チェーンが深くなりすぎる場合（4段以上）は、中間 fixture を見直す

### 命名規則

| パターン | fixture 名 | 例 |
|---|---|---|
| ログイン済み | `loggedInPage` | standard_user でログイン済み |
| 特定画面にいる | `pageAt<画面名>` | `pageAtCheckoutStep2` |
| データが準備済み | `pageWith<データ>` | `pageWithCart` |

## チェックリスト

- [ ] `fixtures/_preconditions.yaml` に登録したか
- [ ] fixture の依存先が存在するか
- [ ] Codegen で取得した正確なロケータを使っているか
- [ ] テスト実行で前提条件が正しくセットアップされるか確認したか
