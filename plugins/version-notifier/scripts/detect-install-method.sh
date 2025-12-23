#!/bin/bash
#
# detect-install-method.sh
# Auto-detect Claude Code installation method
#
# Output: native, homebrew, or npm
#

set -e

# Check if installed via Homebrew
if command -v brew &>/dev/null; then
  if brew list --cask claude-code &>/dev/null 2>&1; then
    echo "homebrew"
    exit 0
  fi
fi

# Check if installed via npm
if command -v npm &>/dev/null; then
  if npm list -g @anthropic-ai/claude-code &>/dev/null 2>&1; then
    echo "npm"
    exit 0
  fi
fi

# Default to native
echo "native"
