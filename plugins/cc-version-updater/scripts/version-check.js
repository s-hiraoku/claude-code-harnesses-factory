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
const INFOGRAPHICS_DIR = path.join(CACHE_DIR, 'infographics');
const PENDING_UPGRADE_FILE = path.join(CACHE_DIR, 'pending-upgrade.json');
const PREPARED_UPGRADE_FILE = path.join(CACHE_DIR, 'prepared-upgrade.json');
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

// ===== Language Detection =====
function detectLanguage() {
  const locale = process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES || 'en_US';
  if (locale.startsWith('ja')) return 'ja';
  if (locale.startsWith('zh')) return 'zh';
  if (locale.startsWith('ko')) return 'ko';
  return 'en';
}

// ===== Localization Strings =====
const L10N = {
  en: {
    welcome: 'Welcome to Claude Code',
    updateSummary: 'Update Summary',
    keyChanges: 'Key changes from',
    newFeatures: 'New Features',
    improvements: 'Improvements & Fixes',
    visualSummary: 'Visual Summary Available!',
    openCommand: 'Run: open',
    summaryReady: 'Summary & infographic ready!',
  },
  ja: {
    welcome: 'Claude Code へようこそ',
    updateSummary: 'アップデート概要',
    keyChanges: '主な変更点',
    newFeatures: '新機能',
    improvements: '改善と修正',
    visualSummary: 'ビジュアルサマリーが利用可能です！',
    openCommand: '開く: open',
    summaryReady: 'サマリーとインフォグラフィック準備完了！',
  },
  zh: {
    welcome: '欢迎使用 Claude Code',
    updateSummary: '更新摘要',
    keyChanges: '主要变更',
    newFeatures: '新功能',
    improvements: '改进和修复',
    visualSummary: '可视化摘要已准备就绪！',
    openCommand: '打开: open',
    summaryReady: '摘要和信息图已准备就绪！',
  },
  ko: {
    welcome: 'Claude Code에 오신 것을 환영합니다',
    updateSummary: '업데이트 요약',
    keyChanges: '주요 변경 사항',
    newFeatures: '새 기능',
    improvements: '개선 및 수정',
    visualSummary: '비주얼 요약을 사용할 수 있습니다!',
    openCommand: '열기: open',
    summaryReady: '요약 및 인포그래픽 준비 완료!',
  },
};

// ===== Parse Changelog =====
function parseChangelog(changelogText) {
  const lines = changelogText.split('\n');
  const features = [];
  const improvements = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- Added') || trimmed.match(/^- .*(?:support|tool|command|feature)/i)) {
      const text = trimmed.replace(/^- (Added |feat: )?/, '');
      const words = text.split(' ');
      features.push({
        name: words.slice(0, 4).join(' '),
        description: text,
      });
    } else if (trimmed.startsWith('- Fixed') || trimmed.startsWith('- Improved') ||
               trimmed.startsWith('- fix:') || trimmed.startsWith('- perf:')) {
      improvements.push(trimmed.replace(/^- (Fixed |Improved |fix: |perf: )?/, ''));
    }
  }

  return { features, improvements };
}

// ===== Generate Summary Text =====
function generateSummary(data, lang = 'en') {
  const l = L10N[lang] || L10N.en;
  const { previousVersion, latestVersion, changelogs } = data;

  // Parse all changelogs
  let allFeatures = [];
  let allImprovements = [];

  for (const { changelog } of changelogs) {
    const parsed = parseChangelog(changelog);
    allFeatures = allFeatures.concat(parsed.features);
    allImprovements = allImprovements.concat(parsed.improvements);
  }

  // ANSI escape codes (escaped for JSON storage)
  const C = '\\033[1;36m';  // Cyan
  const M = '\\033[1;35m';  // Magenta
  const G = '\\033[0;32m';  // Green
  const W = '\\033[1;37m';  // White bold
  const R = '\\033[0m';     // Reset

  let summary = `${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}\\n`;
  summary += `${W}${l.welcome} v${latestVersion}!${R}\\n`;
  summary += `${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}\\n\\n`;

  // Summary header
  summary += `${C}## ${l.updateSummary}${R}\\n\\n`;
  summary += `${l.keyChanges} v${previousVersion} -> v${latestVersion}:\\n\\n`;

  // Features (max 5)
  if (allFeatures.length > 0) {
    summary += `${M}### ${l.newFeatures}${R}\\n`;
    for (const feat of allFeatures.slice(0, 5)) {
      summary += `${M}*${R} ${feat.description}\\n`;
    }
    summary += '\\n';
  }

  // Improvements (max 5)
  if (allImprovements.length > 0) {
    summary += `${G}### ${l.improvements}${R}\\n`;
    for (const imp of allImprovements.slice(0, 5)) {
      summary += `${G}-${R} ${imp}\\n`;
    }
  }

  return summary;
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
    const infographicPath = info.infographicPath || null;
    const lang = info.language || detectLanguage();
    const l = L10N[lang] || L10N.en;

    // Convert escape sequences
    const summary = convertEscapeSequences(summaryRaw);

    // Build system message
    let systemMsg = `\n${summary}`;

    // Add prominent infographic link if available
    if (infographicPath && fs.existsSync(infographicPath)) {
      const C = '\x1b[1;36m';  // Cyan bold
      const O = '\x1b[38;5;208m';  // Orange
      const R = '\x1b[0m';

      systemMsg += `\n\n${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}`;
      systemMsg += `\n${O}  ${l.visualSummary}${R}`;
      systemMsg += `\n${C}  ${infographicPath}${R}`;
      systemMsg += `\n`;
      systemMsg += `\n${C}  ${l.openCommand} "${infographicPath}"${R}`;
      systemMsg += `\n${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}`;
    }

    const contextMsg = `[cc-version-updater] Claude Code has been upgraded from v${prevVersion} to v${newVersion}. The summary above has been displayed.` +
      (infographicPath ? ` Infographic available at: ${infographicPath}.` : '') +
      ` If the user asks follow-up questions, refer to the changelog-interpreter skill for guidance.`;

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
function showUpdateNotificationWithReady(currentVersion, latestVersion, versionCount, lang = 'en') {
  const l = L10N[lang] || L10N.en;

  // ANSI color codes
  const B = '\x1b[1;34m';   // Bold blue
  const G = '\x1b[1;32m';   // Bold green
  const O = '\x1b[38;5;208m';  // Orange
  const R = '\x1b[0m';  // Reset

  const versionInfo = versionCount > 1 ? ` (${versionCount} versions)` : '';

  const systemMsg = `
${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   New Claude Code version available!

   Current: v${currentVersion}  →  Latest: v${latestVersion}${versionInfo}

   ${G}${l.summaryReady}${R}${B}
   Run ${O}/update-claude ${B}to upgrade.
${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}`;

  const contextMsg = `A new version v${latestVersion} of Claude Code is available (${versionCount} version(s) to upgrade). The current version is v${currentVersion}. Summary and infographic have been pre-generated. Guide user to use /update-claude command.`;

  outputJson(systemMsg, contextMsg);
}

// ===== Generate Infographic =====
function generateInfographic(pendingUpgradePath, lang, outputPath) {
  try {
    // Create infographics directory
    if (!fs.existsSync(INFOGRAPHICS_DIR)) {
      fs.mkdirSync(INFOGRAPHICS_DIR, { recursive: true });
    }

    const pythonScript = path.join(__dirname, 'generate-infographic.py');
    if (!fs.existsSync(pythonScript)) {
      return null;
    }

    // Check if Python and Pillow are available
    try {
      execSync('python3 -c "from PIL import Image"', { timeout: 5000, stdio: 'pipe' });
    } catch {
      return null;  // Pillow not available
    }

    // Generate infographic
    execSync(`python3 "${pythonScript}" "${pendingUpgradePath}" "${lang}" "${outputPath}"`, {
      timeout: 15000,
      stdio: 'pipe',
    });

    return fs.existsSync(outputPath) ? outputPath : null;
  } catch {
    return null;
  }
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

  // Detect user language
  const lang = detectLanguage();

  // Save to pending-upgrade.json first (needed for infographic generation)
  savePendingUpgrade(currentVersion, latestVersion, changelogs);

  // Generate summary text (template-based)
  const summaryData = {
    previousVersion: currentVersion,
    latestVersion: latestVersion,
    changelogs: changelogs,
  };
  const summary = generateSummary(summaryData, lang);

  // Generate infographic (Python/Pillow)
  const infographicFilename = `changelog-${currentVersion}-to-${latestVersion}.png`;
  const infographicPath = path.join(INFOGRAPHICS_DIR, infographicFilename);
  const generatedInfographic = generateInfographic(PENDING_UPGRADE_FILE, lang, infographicPath);

  // Save prepared upgrade data
  const preparedData = {
    previousVersion: currentVersion,
    latestVersion: latestVersion,
    changelogs: changelogs,
    summary: summary,
    infographicPath: generatedInfographic,
    language: lang,
    generatedAt: new Date().toISOString(),
    readyForUpgrade: true,
  };
  fs.writeFileSync(PREPARED_UPGRADE_FILE, JSON.stringify(preparedData, null, 2));

  // Display notification with "ready" indicator
  showUpdateNotificationWithReady(currentVersion, latestVersion, versionCount, lang);

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  console.log('{}');
  process.exit(0);
});
