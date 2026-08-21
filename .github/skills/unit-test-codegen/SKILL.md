---
name: unit-test-codegen
description: 'Vue 3 + Vitest のユニットテストコードを生成する。Use when ユニットテストを書く、テストコードを生成する、composableのテストを作る、コンポーネントのテストを作る、と依頼されたとき。'
---

# ユニットテストコード生成

Vue 3 コンポーネントおよび composable のユニットテストを Vitest + Vue Test Utils で生成する。

## When to Use This Skill

- 「ユニットテストを書いて」「テストコードを生成して」と依頼されたとき
- composable や util のテストを作成するとき
- コンポーネントのテストを作成するとき
- 既存テストにケースを追加するとき

## 前提技術

| ライブラリ | 用途 |
|---|---|
| Vitest | テストランナー・アサーション |
| @vue/test-utils | コンポーネントマウント・操作 |
| @pinia/testing | Pinia ストアのモック（使用時） |

## テストファイル配置ルール

ソースファイルと同じディレクトリに `__tests__/` フォルダを作成し、テストを配置する。

```
src/
├── composables/
│   ├── useGitHubData.ts
│   ├── useHistory.ts
│   ├── useQuizSession.ts
│   └── __tests__/
│       ├── useGitHubData.spec.ts
│       ├── useHistory.spec.ts
│       └── useQuizSession.spec.ts
├── components/
│   ├── QuizQuestion.vue
│   ├── QuizAnswer.vue
│   └── __tests__/
│       ├── QuizQuestion.spec.ts
│       └── QuizAnswer.spec.ts
└── views/
    ├── HomeView.vue
    └── __tests__/
        └── HomeView.spec.ts
```

## コード生成ルール

### 1. テストの基本構造

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('対象の名前', () => {
  beforeEach(() => {
    // 各テスト前のセットアップ
  })

  it('正常系: 期待する動作の説明', () => {
    // Arrange
    // Act
    // Assert
  })

  it('異常系: エラー時の動作の説明', () => {
    // ...
  })
})
```

### 2. Composable のテスト

composable は `@vue/test-utils` の `renderHook` もしくは `withSetup` ヘルパーでテストする。

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHistory } from '../useHistory'
import { flushPromises } from '@vue/test-utils'

describe('useHistory', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('正解を記録できる', () => {
    const { markCorrect, isCorrect } = useHistory()
    markCorrect('0001')
    expect(isCorrect('0001')).toBe(true)
  })

  it('不正解を記録できる', () => {
    const { markIncorrect, isCorrect } = useHistory()
    markIncorrect('0001')
    expect(isCorrect('0001')).toBe(false)
  })

  it('履歴をクリアできる', () => {
    const { markIncorrect, clearHistory, getHistory } = useHistory()
    markIncorrect('0001')
    clearHistory()
    expect(getHistory()).toEqual({})
  })
})
```

### 3. コンポーネントのテスト

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import QuizQuestion from '../QuizQuestion.vue'

const vuetify = createVuetify()

function mountComponent(props = {}) {
  return mount(QuizQuestion, {
    props,
    global: {
      plugins: [vuetify],
    },
  })
}

describe('QuizQuestion', () => {
  it('熟語を表示する', () => {
    const wrapper = mountComponent({
      questionText: 'a piece of ~ (1)',
    })
    expect(wrapper.text()).toContain('a piece of ~')
  })

  it('タップで回答表示イベントを発火する', async () => {
    const wrapper = mountComponent({
      questionText: 'a piece of ~ (1)',
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('reveal')).toBeTruthy()
  })
})
```

### 4. 外部API呼び出しのモック

GitHub API 呼び出しは `vi.mock` または `vi.spyOn` でモックする。

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGitHubData } from '../useGitHubData'

// fetch をモック
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('useGitHubData', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('JSONデータを取得できる', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        idioms: ['a piece of ~'],
        means: [{ 'idiom-jp': '１つの～', 'example-sentence': '...', 'sentence-jp': '...' }],
        notes: [],
      }),
    })

    const { fetchIdiomData } = useGitHubData()
    const data = await fetchIdiomData('0001')

    expect(data.idioms).toEqual(['a piece of ~'])
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('取得失敗時にエラーをスローする', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

    const { fetchIdiomData } = useGitHubData()
    await expect(fetchIdiomData('9999')).rejects.toThrow()
  })
})
```

### 5. localStorage のテスト

Vitest は jsdom 環境で localStorage を使用可能。テスト前に `localStorage.clear()` でリセットする。

```typescript
beforeEach(() => {
  localStorage.clear()
})
```

## テスト方針

### テスト対象の優先度

| 優先度 | 対象 | 理由 |
|---|---|---|
| 高 | composables (`useHistory`, `useQuizSession`) | ビジネスロジックの中核 |
| 高 | `useGitHubData`（データ変換ロジック） | 画像パス変換、Markdown相対パス解決 |
| 中 | コンポーネント（イベント発火・props表示） | UI動作の担保 |
| 中 | views（バグ修正時の状態変更ロジック） | リグレッション防止 |
| 低 | views（統合的な画面テスト） | E2Eテストでカバー可能 |

### バグ修正・仕様変更時のリグレッションテスト規約

**バグ修正をする際は必ず対応するテストを追加してから push すること。**

#### 追加先の判断基準

| バグの種類 | テスト追加先 |
|---|---|
| composable の計算ロジックのバグ | `src/composables/__tests__/*.spec.ts` に `it` を追加 |
| view の状態変更ロジックのバグ | `src/views/__tests__/*.spec.ts` に `it` を追加（新規作成でも可） |
| UI の表示/非表示・操作のバグ | `specs/<画面>/<アクション>.yaml` にシナリオ追加 → E2Eテストコードに反映 |

#### view のユニットテストを書くときの注意

Vuetify コンポーネントは `ResizeObserver` を使用するため、jsdom 環境ではポリフィルが必要。
`src/test-setup.ts` に追加済みなので新たなセットアップは不要。

```typescript
// ResizeObserver は src/test-setup.ts で polyfill 済み
// vitest.config.ts の setupFiles に登録されている
```

ボタンの特定には `.findAll('button').find(b => b.text().includes('ボタン名'))` を使用する。

```typescript
import { mount, flushPromises } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import SomeView from '../SomeView.vue'

const vuetify = createVuetify()
// vue-router をモック
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

it('バグ修正のリグレッションテスト', async () => {
  // localStorage に前提データをセット
  localStorage.setItem('key', JSON.stringify(data))

  const wrapper = mount(SomeView, { global: { plugins: [vuetify] } })
  await flushPromises()  // onMounted の完了を待つ

  const btn = wrapper.findAll('button').find(b => b.text().includes('ボタン名'))
  await btn!.trigger('click')

  // localStorage や emitted イベントで結果を検証
  const saved = JSON.parse(localStorage.getItem('key')!)
  expect(saved.someField).toBe(expectedValue)
})
```

#### テストコメントの書き方

リグレッションテストであることを明示するコメントを付ける。

```typescript
/**
 * リグレッションテスト:
 * 〈再現手順の一行説明〉というバグの防止
 */
it('...', async () => { ... })
```

### テスト命名規則

- `describe`: 対象の名前（関数名 or コンポーネント名）
- `it`: 「〜する」「〜できる」の形式で日本語で記述

```typescript
describe('useHistory', () => {
  it('正解を記録できる', () => { ... })
  it('最新の回答で上書きされる', () => { ... })
  it('指定範囲の履歴をクリアできる', () => { ... })
})
```

### カバレッジ目標

- composables: 90% 以上
- コンポーネント: 主要なユーザー操作パスをカバー
- views: 基本的なレンダリング確認のみ
