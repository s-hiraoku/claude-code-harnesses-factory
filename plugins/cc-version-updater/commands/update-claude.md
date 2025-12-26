---
description: Upgrade Claude Code to the latest version
---

# Claude Code Upgrade

Execute the Claude Code upgrade process.

## Steps

### 1. Check Pending Upgrade Info

```bash
cat "${CLAUDE_PLUGIN_ROOT}/.cache/pending-upgrade.json" 2>/dev/null || echo "{}"
```

### 2. Confirm with User

Use AskUserQuestion tool to confirm:
- **Question**: "Upgrade Claude Code from v{previousVersion} to v{latestVersion}?" (include version count if multiple: "... (N versions)")
- **Options**: Yes / No

**Note**: The `changelogs` field contains an array of all versions between current and latest.

**Language Detection**: Automatically detect the user's language from their messages in this conversation. Use that language for all output.

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

### 5. Generate Changelog Summary

**CRITICAL**: You MUST follow the `changelog-interpreter` skill EXACTLY.

#### Step 5.1: Read the Skill

First, read the skill file to understand the required format:

```bash
cat "${CLAUDE_PLUGIN_ROOT}/skills/changelog-interpreter/SKILL.md"
```

#### Step 5.2: Gather Information (REQUIRED)

As specified in the skill, use **WebSearch** to get accurate information:

**For each version in the changelogs array**, search:
1. Search: `"Claude Code v{version}" site:anthropic.com`
2. Search: `"Claude Code v{version}" release notes`

Then use **WebFetch** on:
- `https://github.com/anthropics/claude-code/releases`
- `https://docs.anthropic.com/en/docs/claude-code`

**Note**: If multiple versions are being upgraded, gather information for each version.

#### Step 5.3: Generate Formatted Summary

Create the summary following the skill's exact format:

1. **Use the user's language** (detected from their messages in this conversation)
2. **Use ANSI color codes** (e.g., `\033[1;36m` for cyan)
3. **Include decorative header** with `━━━` lines
4. **Structure**: Update Summary → New Features in Detail (per version) → Improvements & Fixes
5. **For each feature**: Include "💡 How to use" and "📋 Use cases"
6. **Escape for JSON**: Use `\\033` instead of `\033`

**Multi-version format**: When multiple versions are upgraded, create a section for each version:
```
## v{version1} Changes
- Feature 1
- Feature 2

## v{version2} Changes
- Feature 1
- Feature 2
```

### 6. Save Summary

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

### 7. Generate Infographic (Optional)

**CRITICAL**: Follow the `changelog-infographic` skill to create a visual summary.

#### Step 7.1: Read the Skill

```bash
cat "${CLAUDE_PLUGIN_ROOT}/skills/changelog-infographic/SKILL.md"
```

#### Step 7.2: Prepare Input Data

Structure the changelog data for infographic generation:

```json
{
  "previousVersion": "{previousVersion}",
  "latestVersion": "{latestVersion}",
  "features": [
    {
      "name": "Feature Name",
      "description": "Brief description",
      "usage": "How to use",
      "useCases": ["Case 1", "Case 2"]
    }
  ],
  "improvements": ["Improvement 1", "Improvement 2"]
}
```

#### Step 7.3: Generate PNG

Follow the skill's design philosophy ("Technical Clarity") to create a PNG infographic:

1. Create the visual using available image generation capabilities
2. Save to: `${CLAUDE_PLUGIN_ROOT}/.cache/infographics/changelog-{prevVersion}-to-{newVersion}.png`

```bash
mkdir -p "${CLAUDE_PLUGIN_ROOT}/.cache/infographics"
```

#### Step 7.4: Store Infographic Path

Save the infographic path to the summary JSON:

```bash
jq --arg path "${CLAUDE_PLUGIN_ROOT}/.cache/infographics/changelog-{prevVersion}-to-{newVersion}.png" \
   '.infographicPath = $path' \
   "${CLAUDE_PLUGIN_ROOT}/.cache/changelog-summary.json" > tmp.json && \
   mv tmp.json "${CLAUDE_PLUGIN_ROOT}/.cache/changelog-summary.json"
```

### 8. Prompt Restart

```
Upgrade complete!

Please restart Claude Code:
1. Exit this session (exit or Ctrl+C)
2. Run `claude` again

The new features guide will be displayed on next startup.
```

If infographic was generated, also display:

```
📸 Infographic: {infographicPath}
   Click to open, or run: open "{infographicPath}"
```

### 9. On Cancel

Abort the process.
