---
title: Session management
description: Inspect aflock's on-disk session state, propagation files, metrics model, and the current status of the merkle-tree design.
---

This page is for readers who want to know what aflock persists, where it
persists it, and how that relates to the draft merkle-tree design in the spec.

## Runtime state layout

`internal/state.Manager` uses `~/.aflock/sessions` by default.

Each session gets its own directory:

```text
~/.aflock/
├── sessions/
│   └── <session-id>/
│       ├── state.json
│       └── attestations/
└── propagation/
    └── <sha256(policy-path)>.json
```

Session IDs are validated against `^[a-zA-Z0-9_-]+$` before they are used in
paths, which is an important guard against path traversal.

## What `state.json` contains

`SessionState` persists:

- session metadata: ID, start time, policy, policy path
- cumulative metrics: tokens, cost, turns, tool-call counts, file reads/writes
- action records with decision and reason
- material classifications from `dataFlow`
- parent and child session linkage for sub-agents

## How metrics move

```text
UserPromptSubmit -> turns++
PreToolUse       -> action record added
PostToolUse      -> file read/write tracking
MCP tool calls   -> action record and metrics saved through state.Manager
SubagentStop     -> child metrics merged into parent
```

## Merkle-tree concept

The repository specification and examples spend real time on session ordering
proofs:

```text
session JSONL
  -> hash each entry
  -> build merkle tree
  -> record root in attestations
  -> later prove order, completeness, and turn distance
```

That concept appears throughout `docs/reference/specification.md` and the
example policies under `materialsFrom.session`.

## Current implementation status

Today, the persisted `SessionMaterial` struct only stores:

- `path`
- `merkleRoot`
- `algorithm`

And the runtime session manager focuses on plain JSON state, not on building
and verifying merkle proofs for each hook event. In other words:

- the merkle-tree story is an important design direction
- the on-disk session state you can inspect today is the simpler
  `state.json`-based runtime record

That distinction is important when you explain aflock to newcomers. The
specification is not fake, but it is ahead of the currently shipped session
state machinery.

## Why the simpler state still matters

Even without full merkle proofs, the session state is already useful for:

- debugging denied actions
- checking post-hoc limit breaches
- inspecting data-flow classifications
- carrying parent context into sub-agents
- summarizing a session through `aflock status`

## Related topics

- [Sublayouts](../sublayouts/)
- [Attestations and verification](../attestations-and-verification/)
- [in-toto attestations](/in-toto-attestations/)

## Repository anchors

- `aflock/internal/state/session.go`
- `aflock/internal/state/propagation.go`
- `aflock/pkg/aflock/types.go`
- `aflock/docs/reference/specification.md`
