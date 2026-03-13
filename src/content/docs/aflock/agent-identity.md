---
title: Agent identity
description: How aflock derives an agent identity from process metadata, Claude session discovery, binary details, and optional SPIFFE mapping.
---

This page is for readers deciding whether aflock's identity model is trustworthy
enough to anchor signing and authorization decisions.

## Why aflock derives identity

aflock does not start by trusting the agent to tell the truth about itself.
Instead, `internal/identity` tries to derive identity from what the host can
observe:

- the process tree above aflock
- the Claude working directory and session index
- the binary path, version, and digest
- the execution environment type
- the active policy digest
- an optional parent identity for sub-agents

## Current identity formula

`AgentIdentity.DeriveIdentity()` builds a canonical string and hashes it with
SHA-256:

```text
SHA256(
  model@modelVersion |
  binary:name@version |
  binary-digest:sha256... |
  env:type |
  container:... |
  image:... |
  tools:sorted,list |
  policy:sha256... |
  parent:identity-hash
)
```

Compared with the README shorthand, the implementation is slightly richer: it
includes binary and environment details, not just model, tools, and policy.

## Where the model comes from

In MCP mode, aflock uses PID-based discovery:

1. take the parent PID of the running aflock process
2. walk the process chain upward
3. identify the Claude process in that chain
4. get the Claude working directory
5. map the working directory into `~/.claude/projects/<slug>/sessions-index.json`
6. read the active session file to recover model, session ID, and session path

If discovery fails, aflock falls back to `Model = "unknown"` and logs a
warning. That matters because some identity checks are skipped in development
when the model is unknown.

## Binary and environment discovery

aflock records more than the model:

- binary path from `CLAUDE_BINARY` or `exec.LookPath("claude")`
- binary version by running `claude --version`
- binary digest by resolving symlinks or wrapper scripts and hashing the actual
  executable
- environment type as `local`, `container`, or `kubernetes`
- container ID from `/proc/self/cgroup` when possible
- Kubernetes namespace and pod name from service-account and hostname data
- host user ID and hostname

## SPIFFE mapping

`ToSPIFFEID()` maps the derived identity into:

```text
spiffe://<trust-domain>/agent/<model>/<version>/<identity-hash-prefix>
```

The default trust domain in `internal/identity/spire.go` is `aflock.ai`.

The repository also carries a small allowlist of trusted models:

- `claude-opus-4-5-20251101`
- `claude-sonnet-4-20250514`
- `claude-3-5-haiku-20241022`

That allowlist is currently used when enabling SPIRE-backed attestation signing.

## Policy checks that use identity

The current hook path enforces `identity.allowedModels` during `SessionStart`.
The broader schema also defines:

- `allowedEnvironments`
- `requiredTools`

Those fields are part of the type system and the draft docs, but the strongest
runtime check in the current hook handler is model gating plus later policy
evaluation around tools, files, domains, and limits.

## Why this matters for SSCS

aflock is borrowing a SPIRE-style idea: identity should emerge from verified
workload properties, not from whatever token an agent happens to present. That
is why the design fits naturally alongside [SPIFFE / SPIRE](/spiffe-spire/).

## Repository anchors

- `aflock/internal/identity/agent.go`
- `aflock/internal/identity/discover.go`
- `aflock/internal/identity/spire.go`
