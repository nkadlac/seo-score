# Firecrawl MCP — Setup and Reuse

This doc shows how to run a Firecrawl MCP server once and make it available to AI clients (Cursor/Claude/VS Code MCP), so it’s reusable across all projects.

## 1) Choose how you’ll run the server

Options (pick one):
- Node package (npx): install the Firecrawl MCP server package and run via `npx <server-command>`
- Docker: run a container exposing a local port/socket

Note: package name/command can vary by distro. Replace `<server-command>` below with the actual entrypoint from Firecrawl’s MCP server.

## 2) Manage secrets safely

- Required env: `FIRECRAWL_API_KEY`
- Recommended: use 1Password CLI, `direnv`, or a `.env` (never commit). Example with direnv:

```
# .envrc (in ~ or a project)
export FIRECRAWL_API_KEY=op://vault/item/field
```

## 3) Add a global wrapper script

Create a single script in `~/bin/firecrawl-mcp` (or similar) so all clients can call it.

Example wrapper (adjust `<server-command>`):

```
#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${FIRECRAWL_API_KEY:-}" ]]; then
  echo "FIRECRAWL_API_KEY is not set" >&2
  exit 1
fi

# Replace with the real command, e.g. `npx mcp-server-firecrawl`
: "${FIRECRAWL_MCP_COMMAND:=<server-command>}"

exec ${FIRECRAWL_MCP_COMMAND} "$@"
```

Make it executable: `chmod +x ~/bin/firecrawl-mcp`

## 4) Configure your MCP clients

The goal: point each client to the same wrapper script and env.

- Claude Desktop (macOS): edit `~/Library/Application Support/Claude/claude_desktop_config.json` and add:

```
{
  "mcpServers": {
    "firecrawl": {
      "command": "/Users/<you>/bin/firecrawl-mcp",
      "args": ["serve"],
      "env": { "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}" }
    }
  }
}
```

- VS Code MCP extension: add to `settings.json`:
```
"mcp.servers": {
  "firecrawl": {
    "command": "/Users/<you>/bin/firecrawl-mcp",
    "args": ["serve"],
    "env": { "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}" }
  }
}
```

- Cursor / other MCP‑capable clients: configure similarly by pointing at the wrapper script and passing env.

## 5) Optional per‑project config

If a client supports project‑local MCP config, place a file like `mcp.json` at repo root and point it to the same wrapper (see `mcp.example.json` in this repo).

## 6) Docker example (optional)

Run a local container and point clients to a small shim script that calls the server over TCP/unix socket. Exact options depend on the Firecrawl server image.

## Tips
- Keep the wrapper path stable (e.g., `~/bin/firecrawl-mcp`) so it works across all repos.
- Use `direnv` to auto‑load `FIRECRAWL_API_KEY` for local development, or rely on your global shell env.
- Document your chosen `<server-command>` in AGENTS.md for your team.

