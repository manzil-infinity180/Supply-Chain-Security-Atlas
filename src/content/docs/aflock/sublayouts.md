---
title: Sublayouts
description: Delegate work to sub-agents while carrying forward policy context, inherited materials, and tighter effective limits.
---

This page is for readers who want to let an agent spawn child agents without
handing them the parent's full authority.

## The policy shape

`pkg/aflock/types.go` defines `Sublayout` with:

- `name`
- `policy`
- `policyDigest`
- `functionaries`
- `limits`
- `inherit`
- `attestationPrefix`

Repository examples use this for delegated roles such as
`evidence-collector`, `control-assessor`, and `report-generator`.

## What the current implementation actually does

The hook path implements a practical sub-agent handoff using propagation files.

### Parent side

When `PreToolUse` sees a sub-agent-spawning tool (`Agent` or `Task`), aflock
writes a propagation record under `~/.aflock/propagation/`. That record carries:

- parent session ID
- policy path
- observed material classifications
- parent metrics
- parent limits

### Child side

At `SessionStart`, the child session reads and consumes that propagation file.
If one is present and still within the 60-second TTL, the child inherits:

- the parent session ID
- the parent's material classifications
- effective limits attenuated against the parent's remaining budget

## Limit attenuation

The core rule is:

```text
child effective limit = min(child policy limit, parent remaining budget)
```

If the parent has already exhausted a budget, the child gets zero for that
budget. That is the key safety property in the current sublayout code.

## Merge-back behavior

On `SubagentStop`, aflock loads the child session, merges actions, metrics, and
materials back into the parent session when a parent exists, and then checks
post-hoc child limits before allowing completion.

## Example policy fragment

This follows the repository examples closely:

```json
{
  "sublayouts": [
    {
      "name": "evidence-collector",
      "policy": "./policies/evidence-collector.aflock",
      "limits": {
        "maxSpendUSD": { "value": 5, "enforcement": "fail-fast" },
        "maxTurns": { "value": 20, "enforcement": "fail-fast" }
      },
      "inherit": ["domains", "functionaries"],
      "attestationPrefix": "evidence-"
    }
  ]
}
```

## Design intent versus current behavior

The draft specification describes recursive verification of namespaced
attestations and stronger sublayout semantics. The current implementation gives
you the operational core first:

- parent-to-child material inheritance
- budget attenuation
- merge-back into the parent session

That is enough to reason about delegated work without pretending the full
specification is already complete.

## Related topics

- [Session management](../session-management/) for where propagation files live
- [Agent identity](../agent-identity/) for parent identity chaining
- [Attestations and verification](../attestations-and-verification/)

## Repository anchors

- `aflock/pkg/aflock/types.go`
- `aflock/internal/hooks/handler.go`
- `aflock/internal/state/propagation.go`
- `aflock/examples/compliance-evaluation.aflock`
