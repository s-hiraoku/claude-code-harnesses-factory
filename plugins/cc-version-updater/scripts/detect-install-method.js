#!/usr/bin/env node
/**
 * detect-install-method.js
 * Auto-detect Claude Code installation method
 *
 * Output: native, homebrew, or npm
 *
 * Cross-platform Node.js implementation
 */

const { execSync } = require('child_process');

/**
 * Check if a command exists
 */
function commandExists(command) {
  try {
    execSync(`${command} --version`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Execute command and check if it succeeds
 */
function execSucceeds(command) {
  try {
    execSync(command, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect installation method
 */
function detectInstallMethod() {
  // Check if installed via Homebrew (macOS/Linux)
  if (commandExists('brew')) {
    if (execSucceeds('brew list --cask claude-code')) {
      return 'homebrew';
    }
  }

  // Check if installed via npm
  if (commandExists('npm')) {
    if (execSucceeds('npm list -g @anthropic-ai/claude-code')) {
      return 'npm';
    }
  }

  // Default to native
  return 'native';
}

// Main
console.log(detectInstallMethod());
