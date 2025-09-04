#!/usr/bin/env bash
set -euo pipefail

# Simple wrapper to run the Figma MCP server via npx
if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to run the Figma MCP server" >&2
  exit 1
fi

exec npx mcp-server-figma "$@"

