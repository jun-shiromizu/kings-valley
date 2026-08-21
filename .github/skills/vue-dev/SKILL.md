---
name: vue-dev
description: 'このプロジェクト（英熟語暗記アプリ）の Vue 3 実装ガイドライン。Use when 実装する、コードを書く、composableを作る、コンポーネントを作る、config を設定する、と依頼されたとき。'
---

# Vue 3 実装ガイドライン

英熟語暗記アプリ（Vue 3 + Vuetify）の実装規約。このスキルは実装作業の全般で参照すること。

## プロジェクト構成

```
src/
├── App.vue
├── main.ts
├── router/
│   └── index.ts
├── views/
│   ├── HomeView.vue          … トップページ（設定フォーム・履歴クリア）
│   ├── QuizView.vue          … 出題画面
│   └── ResultView.vue        … 結果サマリー画面
├── components/
│   ├── QuizQuestion.vue      … 問題表示（タップで回答表示に切替）
│   ├── QuizAnswer.vue        … 回答表示（正解/不正解ボタン・スワイプ）
│   ├── ProgressBar.vue       … 進捗インジケーター（n / total）
│   └── SupplementContent.vue … 補足 Markdown → HTML 表示
├── composables/
│   ├── useGitHubData.ts      … GitHub API / Raw URL データ取得
│   ├── useQuizSession.ts     … セッション管理・出題順生成
│   └── useHistory.ts         … 正解/不正解履歴（localStorage）
├── types/
│   └── index.ts              … 型定義
└── config.ts                 … GitHub リポジトリ設定値
```

## config.ts の設計

```typescript
// src/config.ts
export const GITHUB_OWNER = 'jun-shiromizu'
export const DATA_REPO = 'english-idiom-target-1000-data'
export const DATA_BRANCH = 'main'

export const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${DATA_REPO}/contents`
export const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${DATA_REPO}/${DATA_BRANCH}`
```

## 型定義（src/types/index.ts）

```typescript
export interface IdiomData {
  idioms: string[]
  means: Mean[]
  notes: string[]
}

export interface Mean {
  'idiom-jp': string
  synonyms?: string[]
  'example-sentence': string
  'sentence-jp': string
}

export type QuizMode = 'idiom' | 'sentence'
export type QuizTarget = 'all' | 'incorrect'
export type QuizOrder = 'sequential' | 'random'

export interface QuizSettings {
  startNumber: number
  endNumber: number
  mode: QuizMode
  target: QuizTarget
  order: QuizOrder
}

export interface QuizItem {
  number: string         // 4桁ゼロ埋め "0001"
  idiomData: IdiomData
  questionText: string   // 出題テキスト
  idiomIndex: number     // idioms 配列のインデックス（複数熟語対応）
  meanIndex?: number     // 例文出題時の means インデックス
  supplementHtml: string[] // 補足 Markdown を変換した HTML 文字列の配列
}

export interface QuizSession {
  settings: QuizSettings
  items: QuizItem[]
  currentIndex: number
  results: Record<number, boolean> // QuizItem インデックス → 正解/不正解
}
```

## useGitHubData の設計

```typescript
// src/composables/useGitHubData.ts
export function useGitHubData() {
  // GitHub Contents API でディレクトリ一覧取得
  async function listFiles(path: string): Promise<string[]>

  // Raw URL でファイル内容取得
  async function fetchRaw(path: string): Promise<string>

  // 指定番号の IdiomData を取得
  async function fetchIdiomData(number: string): Promise<IdiomData>

  // 指定番号の補足 Markdown ファイル一覧を取得し HTML に変換
  async function fetchSupplements(number: string): Promise<string[]>
}
```

### 画像パス変換ルール

補足 Markdown 内の相対画像パスをアプリ表示用に変換する：

```typescript
// ./img/1234-bar-foo.png → Raw URL フルパスに変換
function resolveImagePaths(markdown: string, number: string): string {
  return markdown.replace(
    /!\[([^\]]*)\]\(\.\/img\/([^)]+)\)/g,
    (_, alt, filename) =>
      `![${alt}](${GITHUB_RAW_BASE}/img/${filename})`
  )
}
```

### ファイル番号フォーマット

```typescript
// 数値を4桁ゼロ埋め文字列に変換
function formatNumber(n: number): string {
  return String(n).padStart(4, '0')
}
```

## useHistory の設計

localStorage のキー: `idiom-app-history`

```typescript
// src/composables/useHistory.ts

// 保存形式: Record<string, boolean>
// キー: "{number}" または "{number}-{idiomIndex}"（複数熟語の場合）
// 値: true=正解, false=不正解

export function useHistory() {
  function getHistory(): Record<string, boolean>
  function setResult(number: string, idiomIndex: number, correct: boolean): void
  function isIncorrect(number: string, idiomIndex: number): boolean
  function clearAll(): void
  function clearRange(start: number, end: number): void
}
```

## useQuizSession の設計

localStorage のキー: `idiom-app-session`

```typescript
// src/composables/useQuizSession.ts
export function useQuizSession() {
  // 設定と IdiomData 配列から QuizItem[] を生成
  function buildItems(settings: QuizSettings, dataMap: Map<string, IdiomData>): QuizItem[]

  // セッションを localStorage に保存
  function saveSession(session: QuizSession): void

  // 保存済みセッションを復元
  function loadSession(): QuizSession | null

  // セッションをクリア
  function clearSession(): void
}
```

### 出題リスト生成ロジック

1. 範囲内の全熟語データから `QuizItem[]` を生成
   - `mode: 'idiom'` の場合: 熟語が複数あれば **idioms 配列分** に展開
   - `mode: 'sentence'` の場合: means 配列分に展開
2. `target: 'incorrect'` の場合: `useHistory` で最新回答が不正解のものだけ残す
3. `order: 'random'` の場合: Fisher-Yates シャッフルを適用

## QuizQuestion コンポーネント

```typescript
// Props
interface Props {
  questionText: string  // 出題テキスト（例: "a piece of ~ (1)"）
}
// Emits
// 'reveal' — タップ/クリックで回答表示を要求
```

## QuizAnswer コンポーネント

```typescript
// Props
interface Props {
  item: QuizItem
}
// Emits
// 'correct'   — 正解ボタン or 右スワイプ
// 'incorrect' — 不正解ボタン or 左スワイプ
```

### スワイプ検出（モバイル）

```typescript
// touch イベントで実装（外部ライブラリ不使用）
let startX = 0
function onTouchStart(e: TouchEvent) { startX = e.touches[0].clientX }
function onTouchEnd(e: TouchEvent) {
  const diff = e.changedTouches[0].clientX - startX
  if (diff > 50) emit('correct')
  else if (diff < -50) emit('incorrect')
}
```

## Vuetify の使い方

- UI コンポーネント・スタイリングは **Vuetify を主軸** とする
- Tailwind CSS は使用しない
- よく使うコンポーネント:
  - フォーム: `v-select`, `v-text-field`, `v-btn`, `v-switch`
  - レイアウト: `v-container`, `v-row`, `v-col`
  - カード: `v-card`, `v-card-title`, `v-card-text`, `v-card-actions`
  - ダイアログ: `v-dialog`
  - 進捗: `v-progress-linear`

## ルーター設定

```typescript
// src/router/index.ts
const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/quiz', name: 'quiz', component: QuizView },
  { path: '/result', name: 'result', component: ResultView },
]
```

- `QuizView` にはセッションデータが必要。直接アクセス時は `/` にリダイレクト
- `ResultView` にも結果データが必要。直接アクセス時は `/` にリダイレクト

## GitHub Pages 向けの注意

Vite の `base` 設定をリポジトリ名に合わせる：

```typescript
// vite.config.ts
export default defineConfig({
  base: '/english-idiom-target-1000/',
  // ...
})
```

Vue Router は `createWebHashHistory` を使用する（GitHub Pages は SPA のサーバーサイドルーティングに対応していないため）：

```typescript
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})
```
