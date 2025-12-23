# Version Notifier 開発ドキュメント

Version Notifier プラグインの開発で得られた知見をまとめたドキュメント。

## ドキュメント一覧

| ドキュメント | 内容 |
|--------------|------|
| [architecture.md](./architecture.md) | プラグインの全体設計とフロー図 |
| [hooks-guide.md](./hooks-guide.md) | Claude Code Hooks の使い方と出力形式 |
| [skills-vs-commands.md](./skills-vs-commands.md) | Skills と Commands の違いと使い分け |
| [troubleshooting.md](./troubleshooting.md) | 開発中に遭遇した問題と解決策 |

## クイックリファレンス

### Hook 出力形式
```json
{
  "systemMessage": "ユーザーに表示",
  "additionalContext": "Claude のコンテキスト"
}
```

### ファイル構成
```
plugins/version-notifier/
├── .claude-plugin/plugin.json   # マニフェスト
├── hooks/hooks.json             # Hook 定義
├── commands/update-claude.md    # /update-claude コマンド
├── skills/changelog-interpreter/SKILL.md  # 解釈スキル
├── scripts/
│   ├── version-check.sh         # バージョンチェック
│   └── detect-install-method.sh # インストール方法検出
└── .cache/                      # ランタイムキャッシュ
```

### キャッシュファイル
| ファイル | 用途 |
|----------|------|
| `pending-upgrade.json` | 検出した新バージョン情報 |
| `changelog-summary.json` | Claude 生成の要約 |

## 重要な学び

### 1. Skills は自動応答しない
Skills はあくまで Claude が使う知識。Claude に自動的に発言させる仕組みは Claude Code にはない。

### 2. ローカルプラグインの Hooks は発火しない
`--plugin-dir` で指定したプラグインの hooks は discovery されない（既知のバグ）。`.claude/settings.json` に直接定義する。

### 3. 高品質な要約には Claude を使う
Hook 内で API を叩くより、アップグレード時に Claude に要約を生成させて保存する方が、品質が高く柔軟。

### 4. Skills と Commands の組み合わせ
Command が「何をするか」、Skill が「どうやるか」を定義。この分離により、再利用性と保守性が向上。
