# Skills vs Commands

Claude Code プラグインには 2 種類の拡張方法がある。

## 比較表

| 項目 | Skills | Commands |
|------|--------|----------|
| **呼び出し方** | Claude が自動判断 | ユーザーが `/command` で明示的に呼び出し |
| **トリガー** | コンテキストに基づき Claude が決定 | ユーザーの入力 |
| **ユーザー操作** | 不要（Claude が判断） | 必要（`/` + コマンド名） |
| **用途** | ガイドライン、知識、解釈ルール | アクション、処理の実行 |
| **ファイル** | `skills/{name}/SKILL.md` | `commands/{name}.md` |

## Skills（モデル呼び出し）

Claude が「このスキルを使うべきだ」と判断したときに参照される知識やガイドライン。

### 特徴
- ユーザーが明示的に呼び出すことはできない
- Claude がコンテキストに基づいて自動的に使用
- 処理の「やり方」を定義する

### 例: `changelog-interpreter`
```markdown
---
name: changelog-interpreter
description: changelog を解釈して使い方を生成する
---

# いつ使うか
- /update-claude 実行後、changelog を要約するとき

# 生成ガイドライン
1. 新機能のハイライト
2. 使い方の例
3. ユースケース
```

### 注意点
- **自動応答はできない**: Skills はあくまで「Claude が使う知識」であり、Claude に自動的に発言させることはできない
- **ユーザー入力が必要**: Skills を使うには、何らかのユーザー入力が必要

## Commands（ユーザー呼び出し）

ユーザーが `/command` で明示的に呼び出すアクション。

### 特徴
- ユーザーが `/{command-name}` で呼び出す
- 具体的な処理手順を定義する
- Skills を参照することができる

### 例: `/update-claude`
```markdown
---
description: Claude Code をアップグレード
---

# 手順
1. pending-upgrade.json を確認
2. ユーザーに確認
3. アップグレード実行
4. changelog-interpreter スキルで要約を生成  ← Skills を参照
5. 保存
```

## 使い分けの指針

### Skills を使うケース
- 解釈や生成のルールを定義したい
- 複数の場面で再利用したい知識がある
- Claude の判断に基づいて自動的に適用したい

### Commands を使うケース
- ユーザーが明示的に実行するアクション
- 具体的な処理フローがある
- 外部コマンドの実行が必要

## 組み合わせパターン

```
/update-claude (Command)
    │
    ├── 処理フローを定義
    │
    └── changelog-interpreter (Skill) を参照
            │
            └── 解釈のガイドラインを提供
```

Command が「何をするか」を定義し、Skill が「どうやるか」のガイドラインを提供する。

## よくある誤解

### ❌ 「Skill を使えば Claude が自動的に応答する」

Skills は Claude が使う知識であり、Claude に発言を強制することはできない。SessionStart hooks でコンテキストに情報を注入しても、ユーザーからの入力がなければ Claude は応答しない。

### ❌ 「Command は Skill の代わりになる」

Command はユーザーが明示的に呼び出すもの。自動的な処理には適さない。

### ✅ 正しい理解

- **Hooks**: 自動実行、コンテキスト注入
- **Skills**: Claude の判断に使う知識
- **Commands**: ユーザーが呼び出すアクション

これらを組み合わせて使う。
