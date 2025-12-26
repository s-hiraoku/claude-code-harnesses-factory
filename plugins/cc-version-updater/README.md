# CC Version Updater Plugin

A plugin that automatically notifies you when a new version of Claude Code is released and makes upgrading easy.

## Features

- Checks version at session start
- Displays notification in UI when a new version is available
- Interactive upgrade via `/update-claude` command
- **AI-generated usage guide**: Claude interprets the changelog and generates practical usage examples and use cases
- Shows the generated summary on next startup after upgrade

## Installation

```bash
# Global install
claude plugins install cc-version-updater@s-hiraoku/claude-code-harnesses-factory

# Project local
claude plugins install cc-version-updater@s-hiraoku/claude-code-harnesses-factory --scope project
```

## Usage

### 1. Receive Notifications

When a new version is available, a notification is displayed at session start:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   New Claude Code version available!

   Current: v2.0.74  →  Latest: v2.0.75

   Run /update-claude to upgrade.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. Upgrade

```
/update-claude
```

Claude will execute the following:
1. Confirmation prompt (yes/no)
2. Auto-detect installation method (Native/Homebrew/npm)
3. Execute upgrade
4. **Generate usage summary** using `changelog-interpreter` skill
5. Save summary for next startup
6. Restart guidance

### 3. View Usage Guide

After upgrading, an AI-generated usage guide is displayed on next startup:

```
🎉 Welcome to Claude Code v2.0.75!

## 🆕 Notable New Features

### LSP Tool
Jump to definitions and search for references within your code.

💡 How to use: "Show me the definition of this function" or "Find references to getUser"

📋 Use cases:
- Navigating large codebases
- Understanding impact of changes before refactoring

### /terminal-setup Command
Now supports Kitty, Alacritty, and other terminals.

💡 How to use: Run /terminal-setup

## 🔧 Improvements & Fixes
- Improved startup performance
- Fixed memory leak in long sessions
```

## Workflow

```
┌─────────────────────────────────────────────────────┐
│              Claude Code Startup                    │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│         SessionStart Hook: version-check.js         │
└─────────────────────┬───────────────────────────────┘
                      ▼
          ┌───────────────────────┐
          │ changelog-summary.json│
          │ exists?               │
          └───────────┬───────────┘
                │
     ┌──────────┴──────────┐
     ▼ Yes                 ▼ No
┌───────────┐      ┌─────────────────┐
│ Display   │      │ Version         │
│ AI Summary│      │ Check           │
│ (exit 0)  │      └────────┬────────┘
└───────────┘               ▼
                 ┌───────────────────┐
                 │ New version?      │
                 └─────────┬─────────┘
                     │
           ┌─────────┴─────────┐
           ▼ No                ▼ Yes
     ┌───────────┐     ┌─────────────────┐
     │ exit 0    │     │ Save to         │
     │ (nothing) │     │ pending-upgrade │
     └───────────┘     └────────┬────────┘
                                ▼
                       ┌─────────────────┐
                       │ Display UI      │
                       │ notification    │
                       │ (exit 0)        │
                       └─────────────────┘

┌─────────────────────────────────────────────────────┐
│            User: /update-claude                     │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│  1. AskUserQuestion: Upgrade?                       │
│  2. Auto-detect installation method                 │
│  3. Execute upgrade                                 │
│  4. Generate summary (changelog-interpreter skill)  │
│  5. Save to changelog-summary.json                  │
│  6. Generate infographic (changelog-infographic)    │
│  7. Display restart message + infographic link      │
└─────────────────────────────────────────────────────┘
```

## File Structure

```
plugins/cc-version-updater/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── hooks/
│   └── hooks.json               # SessionStart hook definition
├── commands/
│   └── update-claude.md         # /update-claude command
├── skills/
│   ├── changelog-interpreter/
│   │   └── SKILL.md             # Changelog interpretation guidelines
│   ├── changelog-infographic/
│   │   └── SKILL.md             # Infographic generation guidelines
│   └── canvas-design/
│       └── SKILL.md             # General visual art generation
├── scripts/
│   ├── version-check.js         # Version check & notification (Node.js)
│   └── detect-install-method.js # Installation method detection (Node.js)
├── .cache/                      # Runtime cache
│   ├── pending-upgrade.json     # Pending upgrade info
│   ├── changelog-summary.json   # AI-generated summary
│   └── infographics/            # Generated infographic images
└── README.md
```

## Cache Files

| File | Purpose |
|------|---------|
| `pending-upgrade.json` | Detected new version info (for /update-claude) |
| `changelog-summary.json` | AI-generated usage summary to display after upgrade |
| `infographics/*.png` | Generated changelog infographic images |

## Skills

### changelog-interpreter

Provides guidelines for Claude to interpret changelogs and generate user-friendly summaries including:
- Feature highlights
- Usage examples
- Use cases
- Improvements and bug fixes

### canvas-design

General-purpose visual art generation skill:
- Creates beautiful .png and .pdf documents using design philosophy
- Suitable for posters, art pieces, and static visuals
- Philosophy-driven approach for museum-quality output

### changelog-infographic

Generates beautiful infographic PNG images from changelog summaries:
- Transforms text summaries into visual artifacts
- "Technical Clarity" design philosophy for professional output
- Saves to cache directory with clickable links
- Museum-quality visual design

**Workflow:**
```
changelog (raw) → changelog-interpreter → summary → changelog-infographic → PNG
```

**Usage:**
After `changelog-interpreter` generates a summary, invoke this skill to create a shareable infographic.

## Supported Installation Methods

| Method | Detection | Upgrade Command |
|--------|-----------|-----------------|
| Native (Recommended) | Default | `curl -fsSL https://claude.ai/install.sh \| bash` |
| Homebrew | `brew list --cask claude-code` | `brew upgrade --cask claude-code` |
| npm | `npm list -g @anthropic-ai/claude-code` | `npm install -g @anthropic-ai/claude-code@latest` |

## Requirements

- **Node.js** - Cross-platform runtime (required for hooks and scripts)
- `npm` - Version checking (typically included with Node.js)

## Development & Testing

```bash
# Test in debug mode (fake version)
# Edit getCurrentVersion() in version-check.js

# Clear cache
rm -rf plugins/cc-version-updater/.cache/*

# Start with plugin directory
claude --plugin-dir ./plugins/cc-version-updater
```

See [docs/cc-version-updater/](../../docs/cc-version-updater/) for detailed development documentation.

## License

MIT
