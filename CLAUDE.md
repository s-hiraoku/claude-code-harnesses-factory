# Claude Code Harnesses Factory

A marketplace for Claude Code plugins.

## About This Repository

- **Marketplace**: Distributes plugins from `plugins/` directory
- **Development Tools**: Development support tools in `.claude/` (for this repository only)

## Available Plugins

| Plugin | Description |
|--------|-------------|
| `version-notifier` | New version notification |
| `context-advisor` | Context optimization (planned) |

## Development Tools (.claude/)

For developers who clone this repository.

### Skills

| Skill | Purpose |
|-------|---------|
| `skill-creator` | Skill creation guide |
| `agent-development` | Agent development guide |
| `command-development` | Command creation guide |
| `mcp-builder` | MCP server building guide |
| `mcp-integration` | MCP integration guide |

### Agents

| Agent | Purpose |
|-------|---------|
| `mcp-server-architect` | MCP server design & implementation expert |

## Plugin Structure Reference

```
plugins/my-plugin/
├── .claude-plugin/
│   └── plugin.json      # Manifest (required)
├── hooks/
│   └── hooks.json       # Hook definitions
├── commands/            # Slash commands
├── skills/              # Skills
├── scripts/             # Execution scripts
└── README.md
```

## Attribution

Skills sourced from [claude-code-templates](https://github.com/davila7/claude-code-templates) (MIT License).
