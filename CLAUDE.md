# Claude Code Harnesses Factory

Claude Code プラグインのマーケットプレイス。

## このリポジトリについて

- **マーケットプレイス**: `plugins/` 配下のプラグインを配布
- **開発環境**: `.claude/` に開発支援ツール（このリポジトリ専用）

## 配布プラグイン

| Plugin | Description |
|--------|-------------|
| `version-notifier` | 新バージョン通知 |
| `context-advisor` | コンテキスト最適化（予定） |

## 開発支援ツール (.claude/)

このリポジトリをクローンした開発者向け。

### Skills

| Skill | Purpose |
|-------|---------|
| `skill-creator` | スキル作成ガイド |
| `agent-development` | エージェント開発ガイド |
| `command-development` | コマンド作成ガイド |
| `mcp-builder` | MCP サーバー構築ガイド |
| `mcp-integration` | MCP 統合ガイド |

### Agents

| Agent | Purpose |
|-------|---------|
| `mcp-server-architect` | MCP サーバー設計・実装の専門家 |

## プラグイン構成リファレンス

```
plugins/my-plugin/
├── .claude-plugin/
│   └── plugin.json      # マニフェスト（必須）
├── hooks/
│   └── hooks.json       # Hook 定義
├── commands/            # スラッシュコマンド
├── skills/              # スキル
├── scripts/             # 実行スクリプト
└── README.md
```

## Attribution

Skills sourced from [claude-code-templates](https://github.com/davila7/claude-code-templates) (MIT License).
