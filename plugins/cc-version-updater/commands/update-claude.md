---
description: Upgrade Claude Code to the latest version
---

# Claude Code Upgrade

Execute the Claude Code upgrade process.

## Steps

### 1. Check Upgrade Info

First, check if pre-generated summary exists (prepared-upgrade.json), otherwise fall back to pending-upgrade.json:

```bash
cat "${CLAUDE_PLUGIN_ROOT}/.cache/prepared-upgrade.json" 2>/dev/null || \
cat "${CLAUDE_PLUGIN_ROOT}/.cache/pending-upgrade.json" 2>/dev/null || \
echo "{}"
```

**Important**: If `prepared-upgrade.json` exists with `readyForUpgrade: true`:
- The summary and infographic have been **pre-generated** at session start
- You can skip Steps 5-7 after upgrade and directly use the prepared content

**Language Detection**: Automatically detect the user's language from their messages in this conversation. Use that language for all output.

### 2. Confirm with User

Use AskUserQuestion tool to confirm:
- **Question**: "Upgrade Claude Code from v{previousVersion} to v{latestVersion}?" (include version count if multiple: "... (N versions)")
- **Options**: Yes / No

**Note**: The `changelogs` field contains an array of all versions between current and latest.

### 3. Detect Installation Method

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/detect-install-method.js"
```

### 4. Execute Upgrade

Based on the detected installation method, run the appropriate upgrade command:

**Native (default):**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Homebrew:**
```bash
brew upgrade --cask claude-code
```

**npm:**
```bash
npm install -g @anthropic-ai/claude-code@latest
```

Display the upgrade output to the user.

### 5. Finalize Summary

**If `prepared-upgrade.json` exists with `readyForUpgrade: true`:**

Simply copy the prepared data to changelog-summary.json:

```bash
cp "${CLAUDE_PLUGIN_ROOT}/.cache/prepared-upgrade.json" "${CLAUDE_PLUGIN_ROOT}/.cache/changelog-summary.json"
rm -f "${CLAUDE_PLUGIN_ROOT}/.cache/pending-upgrade.json"
rm -f "${CLAUDE_PLUGIN_ROOT}/.cache/prepared-upgrade.json"
```

Skip to Step 8.

**If NO pre-generated content exists**, follow Steps 5.1-5.3 below:

#### Step 5.1: Read the Skill

```bash
cat "${CLAUDE_PLUGIN_ROOT}/skills/changelog-interpreter/SKILL.md"
```

#### Step 5.2: Gather Information (REQUIRED)

Use **WebSearch** to get accurate information:

**For each version in the changelogs array**, search:
1. Search: `"Claude Code v{version}" site:anthropic.com`
2. Search: `"Claude Code v{version}" release notes`

Then use **WebFetch** on:
- `https://github.com/anthropics/claude-code/releases`
- `https://docs.anthropic.com/en/docs/claude-code`

#### Step 5.3: Generate Formatted Summary

Create the summary following the skill's exact format:

1. **Use the user's language** (detected from their messages in this conversation)
2. **Use ANSI color codes** (e.g., `\033[1;36m` for cyan)
3. **Include decorative header** with `━━━` lines
4. **Structure**: Update Summary -> New Features in Detail (per version) -> Improvements & Fixes
5. **For each feature**: Include "How to use" and "Use cases"
6. **Escape for JSON**: Use `\\033` instead of `\033`

### 6. Save Summary (Only if not pre-generated)

Save the generated summary as JSON:

```bash
jq -n \
  --arg prev "{previousVersion}" \
  --arg latest "{latestVersion}" \
  --arg summary "{generatedSummary}" \
  '{
    previousVersion: $prev,
    latestVersion: $latest,
    summary: $summary,
    generatedAt: (now | todate)
  }' > "${CLAUDE_PLUGIN_ROOT}/.cache/changelog-summary.json"

rm -f "${CLAUDE_PLUGIN_ROOT}/.cache/pending-upgrade.json"
```

### 7. Generate Infographic (Only if not pre-generated)

**Skip this step if using pre-generated content from prepared-upgrade.json.**

If you need to generate manually:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/generate-infographic.py" \
  "${CLAUDE_PLUGIN_ROOT}/.cache/pending-upgrade.json" \
  "{lang}" \
  "${CLAUDE_PLUGIN_ROOT}/.cache/infographics/changelog-{prevVersion}-to-{newVersion}.png"
```

Update the summary JSON with infographic path:

```bash
jq --arg path "${CLAUDE_PLUGIN_ROOT}/.cache/infographics/changelog-{prevVersion}-to-{newVersion}.png" \
   '.infographicPath = $path' \
   "${CLAUDE_PLUGIN_ROOT}/.cache/changelog-summary.json" > tmp.json && \
   mv tmp.json "${CLAUDE_PLUGIN_ROOT}/.cache/changelog-summary.json"
```

### 8. Prompt Restart

Display success message:

```
Upgrade complete!

Please restart Claude Code:
1. Exit this session (exit or Ctrl+C)
2. Run `claude` again

The new features guide will be displayed on next startup.
```

If infographic was generated, also display the path prominently:

```
Infographic: {infographicPath}
Run: open "{infographicPath}"
```

### 9. On Cancel

Abort the process.
