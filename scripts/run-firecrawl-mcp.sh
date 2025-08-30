#!/usr/bin/env bash
set -euo pipefail

# Wrapper to start Firecrawl MCP consistently across projects.
#
# Requirements:
# - FIRECRAWL_API_KEY set in environment (direnv/1Password/.env not committed)
# - FIRECRAWL_MCP_COMMAND set to the actual server command (e.g., 'npx mcp-server-firecrawl')
#
# Usage:
#   ./scripts/run-firecrawl-mcp.sh serve
#   FIRECRAWL_MCP_COMMAND="npx <server>" ./scripts/run-firecrawl-mcp.sh serve

if [[ -z "${FIRECRAWL_API_KEY:-}" ]]; then
  echo "FIRECRAWL_API_KEY is not set" >&2
  exit 1
fi

if [[ -z "${FIRECRAWL_MCP_COMMAND:-}" ]]; then
  echo "FIRECRAWL_MCP_COMMAND is not set (e.g., 'npx mcp-server-firecrawl')" >&2
  exit 1
fi

exec ${FIRECRAWL_MCP_COMMAND} "$@"
