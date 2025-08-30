# Perplexity MCP — Setup and Reuse

This guide helps you run a Perplexity MCP server once and reuse it across projects and AI clients (Cursor/Claude/VS Code MCP).

> Note: Replace `<server-command>` with the actual entrypoint provided by the Perplexity MCP server package/image you use (e.g., `npx mcp-server-perplexity`).

## 1) Prerequisites
- Perplexity API key
- Node (or Docker) depending on how you run the server

## 2) Secrets management
- Required env: `PERPLEXITY_API_KEY`
- Recommended: use `direnv`, 1Password CLI, or OS keychain. Never commit secrets.

## 3) Global wrapper script
Create a single wrapper so all clients reference the same command and env.

Example at `~/bin/perplexity-mcp`:

```
#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${PERPLEXITY_API_KEY:-}" ]]; then
  echo "PERPLEXITY_API_KEY is not set" >&2
  exit 1
fi

# Real command, e.g., 'npx mcp-server-perplexity'
: "${PERPLEXITY_MCP_COMMAND:=<server-command>}"

exec ${PERPLEXITY_MCP_COMMAND} "$@"
```

Make it executable: `chmod +x ~/bin/perplexity-mcp`

Alternatively, use this repo’s wrapper `scripts/run-perplexity-mcp.sh`.

## 4) Configure your MCP clients

- Claude Desktop (macOS): `~/Library/Application Support/Claude/claude_desktop_config.json`
```
{
  "mcpServers": {
    "perplexity": {
      "command": "/Users/<you>/bin/perplexity-mcp",
      "args": ["serve"],
      "env": { "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}" }
    }
  }
}
```

- VS Code MCP extension (`settings.json`):
```
"mcp.servers": {
  "perplexity": {
    "command": "/Users/<you>/bin/perplexity-mcp",
    "args": ["serve"],
    "env": { "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}" }
  }
}
```

- Cursor / others: point to the wrapper script similarly and pass the env.

## 5) Optional per‑project config
Place `mcp.json` at repo root (or use `mcp.example.json` in this repo) to standardize local usage.

## 6) Docker (optional)
Run the Perplexity MCP server in a container and connect clients over TCP/unix socket through a shim script.

## Tips
- Keep wrapper paths stable (e.g., `~/bin/perplexity-mcp`) so configs are reusable.
- Use `direnv` to load `PERPLEXITY_API_KEY` per‑directory, or set globally in your shell.
- Document the actual `<server-command>` you standardize on in `AGENTS.md`.

