# トラブルシューティング

開発中に遭遇した問題とその解決策。

## Hook が発火しない

### 症状
`--plugin-dir` で指定したプラグインの SessionStart hook が実行されない。

### 原因
Claude Code の既知のバグ。ローカルプラグインの hooks は `~/.claude/plugins/*/hooks/hooks.json` からしか discovery されない。

### 解決策
`.claude/settings.json` に直接定義：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash /absolute/path/to/version-check.sh"
          }
        ]
      }
    ]
  }
}
```

## Hook の出力がユーザーに表示されない

### 症状
Hook スクリプトが実行されているが、ユーザーにメッセージが表示されない。

### 原因
出力フォーマットが間違っている。

### 解決策
正しい JSON 形式で出力：

```json
{"systemMessage": "表示するメッセージ", "additionalContext": "Claude へのコンテキスト"}
```

**注意:** `hookSpecificOutput` は使用しない。ルートレベルに直接記述する。

## ANSI カラーが正しく表示されない

### 症状
色が最初の行にしか適用されない、またはエスケープ文字がそのまま表示される。

### 原因
1. 各行に色コードを付けていない
2. エスケープ文字の記述方法が間違っている

### 解決策

```bash
# 正しい書き方
local B=$'\033[1;34m'  # $'...' 形式を使う

# 各行に色コードを付ける
local msg="
${B}━━━━━━━━━━━━━━━━
${B}   メッセージ
${B}━━━━━━━━━━━━━━━━"
```

## `${CLAUDE_PLUGIN_ROOT}` が空

### 症状
Command 内で `${CLAUDE_PLUGIN_ROOT}` を使用しているが、空になる。

### 原因
ローカル開発時（`.claude/commands/` 経由）は環境変数が設定されない。

### 解決策
テスト用ファイルでは絶対パスを使用：

```bash
# テスト用（.claude/commands/update-claude.md）
cat "/absolute/path/to/plugins/version-notifier/.cache/pending-upgrade.json"

# 本番用（plugins/version-notifier/commands/update-claude.md）
cat "${CLAUDE_PLUGIN_ROOT}/.cache/pending-upgrade.json"
```

## Skill が自動的に使われない

### 症状
SessionStart hook でコンテキストに「このスキルを使って」と書いたが、Claude が自動的に応答しない。

### 原因
Claude Code には自動応答の仕組みがない。Skill はあくまで Claude が使う知識であり、Claude に発言を強制することはできない。

### 解決策
自動応答が必要な場合は、Hook の `systemMessage` に直接内容を含める：

```bash
# 自動表示したい場合
local system_msg="表示したい内容をここに全部書く"
output_json "$system_msg" "$context_msg"
```

または、アップグレード時に Claude に要約を生成させ、その結果を保存しておき、次回起動時に表示する（本プラグインの採用方式）。

## JSON のエスケープエラー

### 症状
改行やクォートを含むテキストを JSON に含めると壊れる。

### 解決策
`jq` を使ってエスケープ：

```bash
jq -n \
  --arg summary "$summary_text" \
  '{summary: $summary}'
```

## Hook の実行が遅い

### 症状
SessionStart hook で npm や curl を呼ぶと起動が遅くなる。

### 解決策
1. 必要最小限の処理に留める
2. キャッシュを活用（毎回 API を呼ばない）
3. タイムアウトを設定：

```bash
npm show @anthropic-ai/claude-code version 2>/dev/null || echo ""
curl -s --max-time 5 "https://api.github.com/..."
```

## デバッグ方法

### 開発環境セットアップ（推奨）

`scripts/dev-setup.sh` でプラグインをシンボリックリンクすると、本番と同じ環境でテストできます。

```bash
# セットアップ（1回だけ）
./scripts/dev-setup.sh

# 状態確認
./scripts/dev-setup.sh --status

# リンク削除
./scripts/dev-setup.sh --remove
```

これで `claude` を普通に起動するだけでプラグインが動作します。

### キャッシュをクリア
```bash
rm -rf plugins/version-notifier/.cache/*
```

### バージョンを偽装（テスト用）
`version-check.sh` の `get_current_version()` を編集：

```bash
get_current_version() {
  # DEBUG: バージョン偽装
  echo "2.0.74"
  # claude --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1
}
```
