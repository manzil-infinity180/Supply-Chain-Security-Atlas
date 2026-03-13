---
title: Getting started
description: Build aflock from source, create your first policy, and wire it into Claude Code or MCP.
---

This page is for a first local setup. It uses the commands and templates that
exist in `aflock/cmd/aflock/main.go` and `aflock/plugin/hooks/hooks.json`.

## Prerequisites

- Go 1.25 or newer
- Claude Code
- a project directory where you want `.aflock` to live
- optional: a local SPIRE agent if you want signing instead of policy-only
  enforcement

## Build aflock

The repository README and tutorial both install aflock from source:

```bash
git clone https://github.com/aflock-ai/aflock.git
cd aflock
make build
cp ./bin/aflock /usr/local/bin/aflock
```

## Create a starter policy

Run `aflock init` in your project root:

```bash
cd /path/to/project
aflock init
```

That command writes a `.aflock` file with the template embedded in the CLI:

```json
{
  "version": "1.0",
  "name": "my-policy",
  "limits": {
    "maxSpendUSD": { "value": 10, "enforcement": "fail-fast" },
    "maxTurns": { "value": 50, "enforcement": "post-hoc" }
  },
  "tools": {
    "allow": ["Read", "Edit", "Write", "Glob", "Grep", "Bash", "LSP"],
    "deny": ["Task"],
    "requireApproval": ["Bash:rm *", "Bash:git push"]
  },
  "files": {
    "allow": ["src/**", "tests/**"],
    "deny": ["**/.env", "**/secrets/**"],
    "readOnly": ["package.json", "go.mod"]
  }
}
```

## Sign the policy

`aflock sign` wraps the JSON policy in a DSSE envelope. If you do not pass a
key, aflock generates an ephemeral ECDSA key and prints the public key to
stderr for later verification.

```bash
aflock sign .aflock -o .aflock.signed
```

You can also provide an explicit PEM-encoded ECDSA private key:

```bash
aflock sign .aflock --key ./keys/policy-signing.pem --output .aflock.signed
```

## Option 1: Claude Code hooks

The repository ships a hook manifest in `plugin/hooks/hooks.json`. The
important events are `SessionStart`, `PreToolUse`, `PostToolUse`,
`PermissionRequest`, `UserPromptSubmit`, `Stop`, `SubagentStop`, and
`SessionEnd`.

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/bin/aflock --hook SessionStart",
            "timeout": 10
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/bin/aflock --hook PreToolUse",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

Hook mode is the lightest integration. It blocks or asks before tool use and
stores session state in `~/.aflock/sessions/<session-id>/state.json`.

## Option 2: MCP server

Start the server on stdio for Claude Code or another MCP client:

```bash
aflock serve --policy .aflock
```

Or expose an HTTP SSE endpoint:

```bash
aflock serve --policy .aflock --http 8787
```

The server registers tools including `get_identity`, `get_policy`,
`check_tool`, `bash`, `read_file`, `write_file`, `get_session`, and
`sign_attestation`.

## Typical first checks

Show active sessions:

```bash
aflock status
```

Verify step attestations for the current git tree hash:

```bash
aflock verify --policy .aflock
```

Verify a specific tree hash from a custom attestation directory:

```bash
aflock verify --policy .aflock --tree-hash abc123 --attestations ./attestations
```

## What to expect from the current implementation

- Hook mode enforces policy and records session state, but the richer
  step-oriented attestation path currently lives in MCP `bash` with
  `attest=true`.
- `verify` is centered on step attestations under
  `~/.aflock/attestations/<tree-hash>/`.
- If SPIRE is unavailable, MCP still enforces policy, but signing is disabled.

## Next steps

- Tighten the generated template with the [policy reference](../policy-reference/)
- Understand [agent identity](../agent-identity/) before relying on model or
  environment constraints
- Choose between [MCP and hooks](../mcp-integration/) for your deployment model

## Repository anchors

- `aflock/cmd/aflock/main.go`
- `aflock/plugin/hooks/hooks.json`
- `aflock/docs/tutorials/getting-started.md`
