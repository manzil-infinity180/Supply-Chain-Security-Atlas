---
title: aflock
description: Overview of aflock as an AI agent policy and attestation framework, grounded in the current repository implementation.
sidebar:
  badge:
    text: Highest priority
    variant: tip
---

`aflock` is a Go-based policy framework for AI agents. It combines three ideas:

- a signed `.aflock` policy file
- real-time enforcement through Claude Code hooks or an MCP server
- signed attestations that can later be verified

This section is for engineers who already understand agent tooling and want a
clear map of what aflock actually implements today, what the richer draft spec
describes, and how those pieces fit into the wider SSCS toolchain.

## What aflock is trying to protect

The repository is centered on constraining common agent failure modes:

- unbounded spend, token, or wall-clock usage
- unsafe tool invocations such as destructive `Bash` commands
- access to secrets, credentials, and protected files
- data exfiltration through web and shell-based network paths
- unconstrained delegation to sub-agents

The implementation splits that work between policy evaluation in
`internal/policy`, runtime state in `internal/state`, identity discovery in
`internal/identity`, and attestation/verification code in `internal/attestation`
and `internal/verify`.

## Architecture at a glance

```text
Claude Code hooks                  MCP mode
-----------------                  -----------------------------
SessionStart/PreToolUse/...        AI agent calls aflock tools
          |                                    |
          v                                    v
   internal/hooks.Handler              internal/mcp.Server
          |                                    |
          +------------> internal/policy <-----+
                              |
                              v
                     .aflock policy document
                              |
          +-------------------+-------------------+
          |                                       |
          v                                       v
   internal/state                         internal/identity
 session files under                     PID trace, Claude session
 ~/.aflock/sessions                      discovery, SPIFFE mapping
          |
          v
 if SPIRE is available -> internal/attestation signs DSSE envelopes
                              |
                              v
                   internal/verify checks sessions
                   or step attestations by git tree hash
```

Two details matter when reading the rest of the docs:

1. The repo contains both a current implementation and a broader draft
   specification. The implementation is authoritative for command behavior.
2. Some concepts, especially session merkle trees and multi-phase verification,
   are described more completely in `docs/reference/specification.md` than in
   the CLI code that exists today.

## What is implemented today

- `aflock init`, `sign`, `serve`, `verify`, `status`, and `hook` commands
- hook-driven enforcement for Claude Code lifecycle events
- MCP tools such as `get_identity`, `check_tool`, `bash`, `read_file`,
  `write_file`, `get_session`, and `sign_attestation`
- identity derivation from process inspection, Claude session metadata, binary
  metadata, environment type, policy digest, and optional parent identity
- session state persistence under `~/.aflock/sessions`
- step-based verification using `roots`, `steps`, and DSSE-signed attestations
- SPIRE-backed signing when the workload API is available

## Read this section in order

- [Getting started](./getting-started/) covers the current CLI and the smallest
  policy that is useful.
- [Policy reference](./policy-reference/) separates implemented fields from
  draft-spec fields that appear in examples and prose.
- [Agent identity](./agent-identity/) explains how aflock discovers who the
  agent really is instead of trusting self-reported claims.
- [MCP and hooks](./mcp-integration/) shows the two runtime integration modes.
- [Attestations and verification](./attestations-and-verification/) covers what
  gets signed, when it is signed, and what `verify` currently checks.
- [Rego policy evaluation](./rego-policy-evaluation/) walks through the shipped
  Rego-style examples.
- [Sublayouts](./sublayouts/) explains child-session inheritance and limit
  attenuation.
- [Session management](./session-management/) covers the `~/.aflock` state
  layout and where the merkle-tree design currently sits.

## Related sections

- [witness](/witness/) for general in-toto attestation workflows
- [rookery](/rookery/) for the attestation modules aflock imports
- [SPIFFE / SPIRE](/spiffe-spire/) for workload identity background
- [in-toto attestations](/in-toto-attestations/) for DSSE and Statement basics

## Repository anchors

- `aflock/README.md`
- `aflock/cmd/aflock/main.go`
- `aflock/pkg/aflock/types.go`
- `aflock/internal/identity/`
- `aflock/internal/mcp/server.go`
- `aflock/internal/hooks/handler.go`
