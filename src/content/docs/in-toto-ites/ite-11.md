---
title: "ITE-11: verifying attributes in in-toto attestations"
description: The draft proposal for embedding CEL-based attribute checks directly in in-toto layouts.
---

## Summary

ITE-11 extends the layout story from [ITE-10](../ite-10/). Instead of verifying
only materials, products, and functionaries, layouts would also be able to
check attestation attributes directly through `expectedAttributes` rules.

The draft uses CEL, the Common Expression Language, for those rules.

## What problem it solves

Today, many attribute checks are pushed into custom inspection scripts. That is
awkward because those scripts need to load attestations, verify signatures, and
then evaluate custom logic outside the layout's built-in semantics.

ITE-11 tries to bring the simple cases back into the verifier itself.

## Example: test-result verification

```yaml
expectedAttributes:
  - "predicate.result == 'PASSED'"
```

## Example: provenance attribute checks

```yaml
expectedAttributes:
  - "predicate.runDetails.builder.id == '<expected value>'"
  - "predicate.externalParameters.repository == '<expected value>'"
  - "predicate.externalParameters.ref == '<expected value>'"
```

## Example: runtime-isolation checks

```yaml
expectedAttributes:
  - "predicate.monitor.type == 'https://github.com/cilium/tetragon'"
  - "predicate.monitor.tracePolicy.policies.exists(p, p['Name'] == 'connect')"
  - "size(predicate.monitorLog.network) == 0"
```

## Why the choice of CEL matters

The proposal argues for CEL because it is:

- lightweight,
- embeddable,
- non-Turing-complete,
- and already used in other policy-heavy systems such as Kubernetes.

The draft also acknowledges that Rego and CUE are alternatives.

## Implementation status in this workspace

I did not find `expectedAttributes` or CEL-based layout verification in the
current workspace repos. The tooling here follows a different direction:

- `witness` and `go-witness` already support richer policy evaluation using
  Rego-oriented workflows.
- `aflock` also focuses on policy evaluation, but not through ITE-11's
  CEL-in-layout design.

So this draft is best read as a future layout-evolution proposal rather than a
feature already implemented by the current workspace tools.

## Why it is still relevant

ITE-11 is useful for comparing policy styles:

- CEL inside a layout for bounded attribute checks,
- versus Rego or other policy engines operating outside the classic layout schema.

That tradeoff shows up throughout modern SSCS tooling.

## Related ITEs

- [ITE-10](../ite-10/) for the multi-predicate layout model it builds on
- [witness verify](/witness/witness-verify/) for the current Rego-based path in this workspace
- [aflock Rego policy evaluation](/aflock/rego-policy-evaluation/)

## Repository anchors

- `ITE/ITE/11/README.adoc`
- `attestation/docs/motivating_use_case.md`
