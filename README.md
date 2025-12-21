# Claude Code Harnesses Factory

Claude Code プラグインのマーケットプレイス。

## Plugins

| Plugin | Description | Status |
|--------|-------------|--------|
| [`version-notifier`](./plugins/version-notifier/) | 新バージョンリリース時に Changelog を通知・解説 | Available |
| `context-advisor` | コンテキストウィンドウの使用状況を分析・最適化 | Planned |

## Installation

### マーケットプレイスとして追加

```bash
# マーケットプレイスを追加
/plugin marketplace add s-hiraoku/claude-code-harnesses-factory

# 利用可能なプラグインを確認
/plugin search

# プラグインをインストール
/plugin install version-notifier
```

### 個別プラグインのインストール

```bash
/plugin install version-notifier@s-hiraoku/claude-code-harnesses-factory
```

## Project Structure

```
claude-code-harnesses-factory/
├── .claude-plugin/
│   └── marketplace.json      # Marketplace configuration
├── .claude/                   # Development tools (repo-local)
│   ├── agents/
│   ├── skills/
│   └── hooks/
├── plugins/                   # Distributable plugins
│   ├── version-notifier/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── hooks/
│   │   │   └── hooks.json
│   │   ├── scripts/
│   │   │   └── version-check.sh
│   │   └── README.md
│   └── context-advisor/       # (planned)
├── scripts/                   # Development scripts
└── README.md
```

## Development

### Testing Plugins

```bash
# Launch Claude Code with a specific plugin
./scripts/test-plugin.sh version-notifier

# Launch with all plugins
./scripts/test-plugin.sh --all
```

### Testing Hook Scripts

```bash
# Test a hook script and see its output
./scripts/test-hook.sh version-notifier
```

### Validating Plugins

```bash
# Validate all plugins
./scripts/validate-plugin.sh

# Validate a specific plugin
./scripts/validate-plugin.sh version-notifier
```

### Creating a New Plugin

1. Create plugin directory:
   ```bash
   mkdir -p plugins/my-plugin/.claude-plugin
   mkdir -p plugins/my-plugin/hooks
   mkdir -p plugins/my-plugin/scripts
   ```

2. Create `plugin.json`:
   ```json
   {
     "name": "my-plugin",
     "version": "1.0.0",
     "description": "My awesome plugin",
     "hooks": "./hooks/hooks.json"
   }
   ```

3. Validate and test:
   ```bash
   ./scripts/validate-plugin.sh my-plugin
   ./scripts/test-plugin.sh my-plugin
   ```

## Attribution

Skills in `.claude/` are adapted from [claude-code-templates](https://github.com/davila7/claude-code-templates) by Daniel Avila (MIT License).

## License

MIT License - See [LICENSE](LICENSE) for details.
