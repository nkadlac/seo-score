#!/usr/bin/env bash
set -euo pipefail

# Wrapper to start Perplexity MCP consistently across projects.
#
# Requirements:
# - PERPLEXITY_API_KEY set in environment (direnv/1Password/.env not committed)
# - PERPLEXITY_MCP_COMMAND set to the actual server command (e.g., 'npx mcp-server-perplexity')
#
# Usage:
#   ./scripts/run-perplexity-mcp.sh serve
#   PERPLEXITY_MCP_COMMAND="npx <server>" ./scripts/run-perplexity-mcp.sh serve

if [[ -z "${PERPLEXITY_API_KEY:-}" ]]; then
  echo "PERPLEXITY_API_KEY is not set" >&2
  exit 1
fi

if [[ -z "${PERPLEXITY_MCP_COMMAND:-}" ]]; then
  echo "PERPLEXITY_MCP_COMMAND is not set (e.g., 'npx mcp-server-perplexity')" >&2
  exit 1
fi

exec ${PERPLEXITY_MCP_COMMAND} "$@"
