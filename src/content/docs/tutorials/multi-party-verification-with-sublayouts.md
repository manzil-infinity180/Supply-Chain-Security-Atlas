---
title: Multi-Party Verification with Sublayouts
description: Model delegated AI-agent work with aflock parent and child policies, inherited limits, propagation records, and current implementation boundaries.
---

**Estimated time:** 40 minutes

**Audience:** readers who want to understand delegated agent execution and how
aflock carries policy context across parent and child sessions.

This is the most design-heavy tutorial in the set. The code examples are real
policy fragments, but the important learning outcome is understanding the trust
boundary and the current implementation limits.

## The problem sublayouts solve

If one agent can spawn another agent, you need answers to three questions:

1. how does the child inherit trust context?
2. how do the child's limits relate to the parent's remaining budget?
3. how do the child's results get merged back into the parent's record?

That is the role of `sublayouts` in `aflock/pkg/aflock/types.go` and of the
propagation logic in `aflock/internal/hooks/handler.go`.

## The current execution model

```text
parent session
   |
   +--> PreToolUse on Agent / Task
   |      writes propagation record under ~/.aflock/propagation/
   |
   v
child SessionStart
   |
   +--> reads propagation record
   +--> inherits parent materials
   +--> attenuates limits against parent remaining budget
   |
   v
child SubagentStop
   |
   +--> merges actions, metrics, materials into parent
```

The propagation record expires after 60 seconds in the current implementation.

## Step 1: create a parent policy

This fragment is based on `aflock/examples/compliance-evaluation.aflock`:

```json
{
  "name": "parent-review",
  "limits": {
    "maxSpendUSD": { "value": 20, "enforcement": "fail-fast" },
    "maxTurns": { "value": 40, "enforcement": "post-hoc" }
  },
  "tools": {
    "allow": ["Read", "Glob", "Grep", "Bash", "Task"],
    "deny": ["Write"]
  },
  "files": {
    "allow": ["docs/**", "src/**", "policies/**"],
    "deny": ["**/.env", "**/secrets/**"]
  },
  "sublayouts": [
    {
      "name": "research-agent",
      "policy": "./policies/research.aflock",
      "limits": {
        "maxSpendUSD": { "value": 5, "enforcement": "fail-fast" },
        "maxTurns": { "value": 10, "enforcement": "fail-fast" }
      },
      "inherit": ["files", "domains", "functionaries"],
      "attestationPrefix": "research-"
    }
  ]
}
```

## Step 2: create a stricter child policy

```json
{
  "name": "research-agent",
  "limits": {
    "maxSpendUSD": { "value": 5, "enforcement": "fail-fast" },
    "maxTurns": { "value": 10, "enforcement": "post-hoc" }
  },
  "tools": {
    "allow": ["Read", "Glob", "Grep"],
    "deny": ["Write", "Bash", "Task"]
  },
  "files": {
    "allow": ["docs/**"],
    "deny": ["**/.env", "**/secrets/**"]
  }
}
```

The key idea is not only "the child has a policy". It is "the child cannot
gain authority by delegation."

## Step 3: understand limit attenuation

At child `SessionStart`, aflock reads the propagation record and calls
`attenuateLimits(...)`.

The practical rule is:

```text
child effective limit = min(child policy limit, parent remaining budget)
```

That means a child policy cannot ask for more remaining spend or turns than the
parent still has available.

## Step 4: understand what gets inherited

The current code path inherits:

- parent session ID
- material classifications
- parent metrics, for limit attenuation
- selected policy context expressed through the sublayout definition

What it does **not** yet provide is a fully finished recursive verification
model for namespaced child attestations. The draft specification is ahead of
the operational implementation.

## Step 5: know the current limitation

There is an important repo-backed caveat: `handleSubagentStop` currently merges
state back into the parent and checks child post-hoc limits, but the security
test `R3-291` documents that it still allows unconditionally instead of fully
enforcing required-attestation or sublayout constraints.

That means you should treat sublayouts as a strong delegation primitive for:

- material inheritance
- budget attenuation
- parent/child linkage

But not yet as the final word on recursive verification completeness.

## When this model is still useful

Even with that limitation, the current implementation is already useful when
you need:

- clearer separation between a broad parent task and a narrow child task
- cost and turn budgeting across delegated work
- a parent record that includes child actions and materials

## Suggested local drill

1. Save the parent and child examples from
   `sscs-docs-site/examples/tutorial-assets/aflock-parent.aflock` and
   `sscs-docs-site/examples/tutorial-assets/aflock-child.aflock`.
2. Build `aflock` from source and run `aflock sign` on each file.
3. Read [Getting started](/aflock/getting-started/) and [Sublayouts](/aflock/sublayouts/)
   to map the policies onto hook and MCP mode.
4. Inspect `aflock/internal/hooks/handler_sublayout_test.go` while reading the
   propagation and merge flow.

## Next steps

- Read [aflock sublayouts](/aflock/sublayouts/)
- Read [aflock session management](/aflock/session-management/)
- Read [SPIFFE / SPIRE and aflock](/spiffe-spire/aflock-and-agent-identity/)

## Repository anchors

- `aflock/pkg/aflock/types.go`
- `aflock/internal/hooks/handler.go`
- `aflock/internal/hooks/handler_sublayout_test.go`
- `aflock/internal/hooks/handler_security_test.go`
- `aflock/internal/state/propagation.go`
- `aflock/examples/compliance-evaluation.aflock`
