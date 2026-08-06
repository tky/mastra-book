# mastra-book — 学習メモ

技術評論社『**MastraによるAIエージェント開発・運用［実践入門］**』(2026年7月刊, 上田瀟逸・伊野瀬出・御田稔 著) を読みながら手を動かす、個人学習用のディレクトリ。

- 学習方針: まず動かしてから理論を理解する（ハンズオン優先）
- LLM: コストをかけないため **Google Gemini 無料枠**（Ollama によるローカル LLM も候補）

## 書籍サンプルコード

公式サンプルコードは以下の GitHub リポジトリ（著者配布）:

- **https://github.com/huanshenyi/mastra-book**

「章ごとにまとめ、ハンズオン完了時の動作形態で保管」されている。各章の起動コマンド等は各ディレクトリの `README.md` を参照。

### 章とディレクトリの対応

| 章 | ディレクトリ | 形式 |
|---|---|---|
| 第1章 | なし | 概念解説のみ |
| 第2-4章 | `chapter2-4/` | スニペット集 |
| 第5章 | `chapter5/` | Mastra プロジェクト（RAG 最小実装） |
| 第6-7章 | `chapter6-7/hitl-research/` | Mastra + Next.js |
| 第8-9章 | `chapter8-9/image-ai-service/` | 画像生成アプリ（章末スナップショット） |
| 第10-12章 | `chapter8-12/image-ai-service/` | 完成形フルスタック |
| 第13章 | `chapter13/` | デプロイ別プロジェクト |

### サンプルの前提環境

- Node.js 24 以上 / npm
- 主要技術: Mastra, Next.js, AI SDK
- OS: macOS / Linux / WSL2

## このディレクトリの構成

- `my-mastra-app/` — `npm create mastra` で作成した自分の実験用アプリ（Mastra Platform 有効・`google/gemini-3.5-flash` 使用）。
  - 開発サーバー: `cd my-mastra-app && npm run dev` → Studio が `http://localhost:4111`

## 学習メモ（要点）

- **「作る」と「登録する」は別ステップ**: `new Agent(...)` / `createTool(...)` を書いて `export` しても、`src/mastra/index.ts` の `Mastra({ agents, tools })` に追加しないと Studio に出ない。ツールはさらにエージェントの `tools` に渡して初めて使える。
- **Mastra ↔ Claude Code**: Mastra はエージェントを「作る」フレームワーク、Claude Code は完成品のエージェント製品。子エージェントの `description` で自律的に呼び分ける仕組み（スーパーバイザーパターン）は両者共通。
- **連携の向き**: Claude Code → 自作 Mastra は MCP（Mastra を MCP サーバー化）。自作 Mastra → Claude Code は CLI ヘッドレス(`claude -p`) or Agent SDK でプロセス起動。
- **AI SDK**: Vercel 製の OSS。デプロイ先は自由・プロバイダ非依存。Mastra はこの AI SDK の上に構築されている（`@ai-sdk/google`, `textStream` 等）。
