# Claude Code Hooks ガイド

## Hook の種類

| Hook | 発火タイミング | 用途 |
|------|----------------|------|
| `SessionStart` | セッション開始時 | 初期化、通知表示 |
| `UserPromptSubmit` | ユーザー入力送信時 | 入力の前処理 |
| `Stop` | セッション終了時 | クリーンアップ |

## 出力フォーマット

Hook スクリプトは JSON を stdout に出力する。

```json
{
  "systemMessage": "ユーザーに表示されるメッセージ",
  "additionalContext": "Claude のコンテキストに追加される情報（ユーザーには見えない）"
}
```

### フィールド説明

| フィールド | 必須 | 説明 |
|------------|------|------|
| `systemMessage` | いいえ | ユーザーの画面に表示されるテキスト。ANSI カラーコード使用可能 |
| `additionalContext` | いいえ | Claude への指示や追加情報。ユーザーには表示されない |

### 出力例

```bash
output_json() {
  local system_msg="$1"
  local context_msg="${2:-}"

  if [ -n "$context_msg" ]; then
    jq -cn \
      --arg sys "$system_msg" \
      --arg ctx "$context_msg" \
      '{"systemMessage": $sys, "additionalContext": $ctx}'
  else
    jq -cn \
      --arg sys "$system_msg" \
      '{"systemMessage": $sys}'
  fi
}
```

## Exit コード

| コード | 意味 |
|--------|------|
| `0` | 成功。stdout の JSON がコンテキストに追加される |
| `2` | エラー。セッションをブロック（致命的エラー用） |
| その他 | 失敗。stderr がログに記録される |

## ANSI カラーコード

`systemMessage` では ANSI エスケープシーケンスが使用可能。

```bash
# 色の定義
local B=$'\033[1;34m'      # 太字青
local G=$'\033[1;32m'      # 太字緑
local O=$'\033[38;5;208m'  # オレンジ（256色）
local C=$'\033[0;36m'      # シアン
local R=$'\033[0m'         # リセット

# 使用例
local msg="${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${G}   ✅ 成功しました！
${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

**注意:** 各行に色コードを付ける必要がある（改行でリセットされるため）。

## ローカル開発時の問題

### 問題: `--plugin-dir` で指定したプラグインの Hooks が実行されない

**原因:** Claude Code の既知のバグ。ローカルプラグインの hooks は discovery されない。

**回避策:** `.claude/settings.json` に直接 hooks を定義：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash /path/to/your/version-check.sh"
          }
        ]
      }
    ]
  }
}
```

### 問題: `${CLAUDE_PLUGIN_ROOT}` が設定されない

**原因:** ローカル開発時（`.claude/commands/` 経由）は環境変数が設定されない。

**回避策:** テスト用ファイルでは絶対パスを使用：

```bash
# 本番用
cat "${CLAUDE_PLUGIN_ROOT}/.cache/pending-upgrade.json"

# テスト用
cat "/absolute/path/to/plugins/version-notifier/.cache/pending-upgrade.json"
```

## Hook 設定ファイル

プラグインの hooks は `hooks/hooks.json` に定義：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"${CLAUDE_PLUGIN_ROOT}/scripts/version-check.sh\""
          }
        ]
      }
    ]
  }
}
```
