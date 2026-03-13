---
title: MCP and hooks
description: Choose between aflock's hook-based enforcement and its persistent MCP server, and understand what each mode actually does.
---

aflock supports two runtime integration styles:

- Claude Code hooks for lightweight policy enforcement around tool execution
- an MCP server for policy-aware tools, persistent state, and signing

This page is for readers deciding which mode to deploy.

## Hook mode

Hook mode runs `aflock hook <event>` as Claude Code lifecycle events fire.
Supported hook names are defined in `pkg/aflock/types.go` and the plugin
manifest:

- `SessionStart`
- `PreToolUse`
- `PostToolUse`
- `PermissionRequest`
- `UserPromptSubmit`
- `Stop`
- `SubagentStop`
- `SessionEnd`
- `Notification`
- `PreCompact`

### Hook flow

```text
SessionStart
  -> load policy from AFLOCK_POLICY or cwd
  -> discover identity
  -> create ~/.aflock/sessions/<session>/state.json

PreToolUse
  -> evaluate tool/file/domain/dataFlow rules
  -> record action
  -> allow, deny, or ask

PostToolUse
  -> track file reads and writes
  -> check fail-fast limits

UserPromptSubmit
  -> increment turn counter

Stop / SubagentStop / SessionEnd
  -> post-hoc checks and session finalization
```

### Important implementation detail

`handlePermissionRequest()` currently returns an empty response and does not add
extra policy logic beyond what already happened in `PreToolUse`. If you need a
more complete enforcement surface, the MCP server is the stronger path.

## MCP mode

`aflock serve` starts a long-lived `internal/mcp.Server`. It loads the policy,
discovers identity, initializes session state, and then registers policy-aware
MCP tools.

### Registered tools

| Tool | Purpose |
| --- | --- |
| `get_identity` | return the derived agent identity |
| `get_policy` | return the loaded `.aflock` policy |
| `check_tool` | run a policy pre-check without executing |
| `bash` | execute shell commands under policy |
| `read_file` | read files under policy |
| `write_file` | write files under policy |
| `get_session` | inspect metrics and action count |
| `sign_attestation` | sign an arbitrary in-toto Statement predicate |

### Standard `bash` execution

For normal `bash` calls, aflock:

1. checks `tools`, `files`, `domains`, and `dataFlow`
2. records the action in session state
3. signs and stores an action attestation when SPIRE-backed signing is enabled

### Step attestation mode

If you call `bash` with `attest=true`, aflock switches to a richer path:

```json
{
  "command": "go test ./...",
  "attest": true,
  "step": "test",
  "reason": "Capture CI test evidence"
}
```

In that path, aflock runs attestors, signs the resulting collection, and stores
the DSSE envelope under:

```text
~/.aflock/attestations/<git-tree-hash>/<step>.intoto.json
```

That directory layout is what `aflock verify` reads later.

## Stdio vs HTTP SSE

Use stdio when Claude Code is launching aflock directly:

```bash
aflock serve --policy .aflock
```

Use HTTP SSE when another client needs a stable endpoint:

```bash
aflock serve --policy .aflock --http 8787
```

## Which mode should you use?

| Need | Better fit |
| --- | --- |
| fastest setup inside Claude Code | hooks |
| persistent state and tool execution through aflock | MCP |
| attestation signing through SPIRE | MCP |
| step-based verification by git tree hash | MCP |

## Repository anchors

- `aflock/plugin/hooks/hooks.json`
- `aflock/internal/hooks/handler.go`
- `aflock/internal/mcp/server.go`
