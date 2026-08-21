# Kings Valley

5 x 5 マスの盤面で、プレイヤーと COM が対戦するターン制アブストラクトゲームです。駒は盤の端またはほかの駒にぶつかる直前まで一直線に進み、自分の王様を先に中央マスへ停止させた側が勝利します。

## 開発状況

初期リリースのアプリ本体、単体テスト、E2E テスト、GitHub Pages デプロイ設定を実装済みです。

プロダクト要件の正本は [docs/product-requirements.md](docs/product-requirements.md) です。初期案は [docs/spec.md](docs/spec.md) に残しています。記述が異なる場合は、プロダクト要件を優先します。

## 主な機能

- プレイヤー対 COM の1人用対局
- 先手、後手、ランダムの選択
- クリック、タップ、キーボードによる駒操作
- 移動可能方向の矢印表示
- ランダムに合法手を選ぶ COM
- 勝敗、合法手なし、同一局面3回による終局判定
- スマートフォン、タブレット、PC 対応

## ゲームルール

- 各陣営は王様1個と兵士4個を持ちます。
- 駒は縦、横、斜めの8方向へ移動できます。
- 駒は途中で止まれず、盤の端またはほかの駒の直前で停止します。
- 王様と兵士のどちらも中央マスへ進入、通過、停止できます。
- 自分の王様を中央マスに停止させると勝利です。
- 合法手がない手番側は敗北です。
- 駒配置と手番が同じ局面が3回現れると引き分けです。

詳細なルールと受け入れ基準は [docs/product-requirements.md](docs/product-requirements.md) を参照してください。

## 採用技術

実装では次の構成を使用します。

- Vue 3
- TypeScript
- Vite
- Vue Router
- Vitest
- Playwright
- GitHub Actions / GitHub Pages

## セットアップ

Node.js 22 以降と npm を前提に、次のコマンドで開発できます。

```sh
npm install
npm run dev
```

品質確認用のコマンドは次のとおりです。

```sh
npm run type-check
npm run lint
npm run format:check
npm run test:unit
npm run test:e2e
npm run build
```

## デプロイ

`main` ブランチへの push または手動実行を契機に、GitHub Actions が型チェック、Lint、単体テスト、ビルドを行い、GitHub Pages へデプロイします。Vite の公開ベースパスにはリポジトリ名 `/kings-valley/` を使用します。

## ドキュメント

- [プロダクト要件](docs/product-requirements.md): ルール、機能要件、非機能要件、受け入れ基準の正本
- [初期仕様](docs/spec.md): 要件策定前のアイデアと初期条件