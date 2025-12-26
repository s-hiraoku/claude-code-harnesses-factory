#!/usr/bin/env node
/**
 * version-check.js
 * Detect and notify about new Claude Code versions
 *
 * Cross-platform Node.js implementation
 * No external dependencies (jq, curl, bash)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// ===== Configuration =====
const PLUGIN_DIR = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(PLUGIN_DIR, '.cache');
const PENDING_UPGRADE_FILE = path.join(CACHE_DIR, 'pending-upgrade.json');
const CHANGELOG_SUMMARY_FILE = path.join(CACHE_DIR, 'changelog-summary.json');

// ===== Initialization =====
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// ===== Utility Functions =====

/**
 * Output JSON to stdout for Claude Code hooks
 */
function outputJson(systemMessage, additionalContext = null) {
  const result = { systemMessage };
  if (additionalContext) {
    result.additionalContext = additionalContext;
  }
  console.log(JSON.stringify(result));
}

/**
 * Make HTTPS GET request
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'cc-version-updater' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Execute command and return output
 */
function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

/**
 * Convert \033 escape sequences to actual escape characters
 */
function convertEscapeSequences(str) {
  return str.replace(/\\033/g, '\x1b');
}

/**
 * Compare semantic versions
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (partsA[i] > partsB[i]) return 1;
    if (partsA[i] < partsB[i]) return -1;
  }
  return 0;
}

// ===== Post-upgrade Summary Display =====
function showPostUpgradeSummary() {
  if (!fs.existsSync(CHANGELOG_SUMMARY_FILE)) {
    return false;
  }

  try {
    const info = JSON.parse(fs.readFileSync(CHANGELOG_SUMMARY_FILE, 'utf8'));
    const prevVersion = info.previousVersion || 'unknown';
    const newVersion = info.latestVersion || 'unknown';
    const summaryRaw = info.summary || 'Summary not available';

    // Convert escape sequences
    const summary = convertEscapeSequences(summaryRaw);

    const systemMsg = `\n${summary}`;
    const contextMsg = `[cc-version-updater] Claude Code has been upgraded from v${prevVersion} to v${newVersion}. The summary above has been displayed. If the user asks follow-up questions, refer to the changelog-interpreter skill for guidance.`;

    outputJson(systemMsg, contextMsg);

    // Delete file (display only once)
    fs.unlinkSync(CHANGELOG_SUMMARY_FILE);
    return true;
  } catch (err) {
    return false;
  }
}

// ===== Version Retrieval =====
function getCurrentVersion() {
  const output = execCommand('claude --version');
  if (!output) return null;

  const match = output.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

async function getLatestVersion() {
  const output = execCommand('npm show @anthropic-ai/claude-code version');
  return output || null;
}

// ===== Changelog Retrieval =====
async function getChangelogs(currentVersion, latestVersion) {
  try {
    const data = await httpsGet('https://api.github.com/repos/anthropics/claude-code/releases?per_page=20');
    const releases = JSON.parse(data);

    const changelogs = releases
      .map(release => ({
        version: release.tag_name.replace(/^v/, ''),
        changelog: release.body || 'No changelog available'
      }))
      .filter(({ version }) => {
        // Version must be > current AND <= latest
        return compareVersions(version, currentVersion) > 0 &&
               compareVersions(version, latestVersion) <= 0;
      })
      .sort((a, b) => compareVersions(b.version, a.version)); // Descending

    return changelogs;
  } catch {
    return [];
  }
}

// ===== Save to pending-upgrade.json =====
function savePendingUpgrade(currentVersion, latestVersion, changelogs) {
  const data = {
    previousVersion: currentVersion,
    latestVersion: latestVersion,
    changelogs: changelogs,
    detectedAt: new Date().toISOString()
  };
  fs.writeFileSync(PENDING_UPGRADE_FILE, JSON.stringify(data, null, 2));
}

// ===== UI Notification =====
function showUpdateNotification(currentVersion, latestVersion, versionCount) {
  // ANSI color codes
  const B = '\x1b[1;34m';  // Bold blue
  const O = '\x1b[38;5;208m';  // Orange
  const R = '\x1b[0m';  // Reset

  const versionInfo = versionCount > 1 ? ` (${versionCount} versions)` : '';

  const systemMsg = `
${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   New Claude Code version available!

   Current: v${currentVersion}  →  Latest: v${latestVersion}${versionInfo}

   Run ${O}/update-claude ${B}to upgrade.
${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}`;

  const contextMsg = `A new version v${latestVersion} of Claude Code is available (${versionCount} version(s) to upgrade). The current version is v${currentVersion}. If the user wants to upgrade, guide them to use the /update-claude command.`;

  outputJson(systemMsg, contextMsg);
}

// ===== Main Process =====
async function main() {
  // First, check for post-upgrade summary display
  if (showPostUpgradeSummary()) {
    process.exit(0);
  }

  // Get versions
  const currentVersion = getCurrentVersion();
  const latestVersion = await getLatestVersion();

  // Compare versions (do nothing if same or can't determine)
  if (!latestVersion || !currentVersion || currentVersion === latestVersion) {
    console.log('{}');
    process.exit(0);
  }

  // Check if update is actually needed
  if (compareVersions(currentVersion, latestVersion) >= 0) {
    console.log('{}');
    process.exit(0);
  }

  // New version available - get changelogs
  const changelogs = await getChangelogs(currentVersion, latestVersion);
  const versionCount = changelogs.length || 1;

  // Save to pending-upgrade.json
  savePendingUpgrade(currentVersion, latestVersion, changelogs);

  // Display notification
  showUpdateNotification(currentVersion, latestVersion, versionCount);

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  console.log('{}');
  process.exit(0);
});
