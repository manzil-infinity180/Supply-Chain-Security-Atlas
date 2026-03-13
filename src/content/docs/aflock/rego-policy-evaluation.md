---
title: Rego policy evaluation
description: Use the Rego-style evaluator patterns shown in aflock examples, and understand where they fit relative to the current implementation.
---

This page is for readers who want deterministic, reviewable policy logic beyond
simple allowlists.

## Where Rego appears in the repo

Rego shows up in two places:

- the schema types `StepAttestation.RegoPolicies` and `EvaluatorsPolicy.Rego`
- repository examples such as `examples/todo-app-verification.aflock` and
  `examples/compliance-evaluation.aflock`

The examples are the best source for how the project expects Rego to be used,
even though the current CLI verifier is still most complete in the step-based
`roots` and `steps` path.

## Common pattern: aggregate across attestations

The shipped examples use Rego to answer questions that single tool calls cannot:

- did total spend exceed the session budget?
- were all expected controls assessed?
- do all evidence references point to real evidence?
- were required screenshots or test runs produced?

That is why Rego matters in aflock. It lets you express cumulative checks over
collections of attestations instead of one-off tool gates.

## Example: cumulative spend

This pattern is copied from the repository examples:

```txt
package todoapp

import rego.v1

turns := [t | some t in input.attestationsFrom["turn-*"]]
sum_spend := sum([t.predicate.metrics.costUSD | some t in turns])

deny contains msg if {
  sum_spend > input.policy.limits.maxSpendUSD.value
  msg := sprintf(
    "Cumulative spend $%.2f exceeds limit $%.2f",
    [sum_spend, input.policy.limits.maxSpendUSD.value],
  )
}
```

## Example: required evidence

From the compliance example:

```txt
package compliance

import rego.v1

control_attestations := [t | some t in input.attestationsFrom["control-*"]]
evidence_attestations := {e.predicate.evidenceId | some e in input.attestationsFrom["evidence-*"]}

missing_evidence contains msg if {
  some t in control_attestations
  some ref in t.predicate.evidenceRefs
  not ref in evidence_attestations
  msg := sprintf("Control %s references missing evidence: %s", [t.predicate.controlId, ref])
}

deny contains msg if {
  some msg in missing_evidence
}
```

## Writing useful aflock Rego

- Prefer aggregate checks over single-event checks.
- Pull limits and expected values from `input.policy` so the policy stays
  declarative.
- Return human-readable `deny` messages. They will matter during audits and CI
  failures.
- Keep the predicate schema stable across tools so the policy can aggregate
  cleanly.

## A practical mental model

Use aflock in layers:

1. `tools`, `files`, `domains`, and `dataFlow` for immediate blocking
2. `limits` for runtime and post-hoc quantitative control
3. Rego for cross-attestation reasoning
4. AI evaluators only where deterministic logic is not enough

That layering is what keeps the system explainable.

## Current-state caveat

The repository clearly intends a richer Rego-driven verification model than the
current CLI exposes. Treat the examples as the design target and the step
verifier as the most concrete implementation path today.

## Related topics

- [Attestations and verification](../attestations-and-verification/)
- [Policy reference](../policy-reference/)
- [witness](/witness/) for broader in-toto policy workflows

## Repository anchors

- `aflock/examples/todo-app-verification.aflock`
- `aflock/examples/compliance-evaluation.aflock`
- `aflock/pkg/aflock/types.go`
