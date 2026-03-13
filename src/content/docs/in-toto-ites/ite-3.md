---
title: "ITE-3: Datadog's TUF + in-toto example"
description: The Datadog deployment example that turns the general TUF-plus-in-toto model from ITE-2 into a concrete supply chain design.
---

## Summary

ITE-3 is an accepted informational proposal showing a real supply chain:
Datadog Agent integrations. It takes the general guidance from [ITE-2](../ite-2/)
and applies it to a release pipeline with offline root layout signing, online
builder steps, and TUF delegations for distribution.

## Why it is useful

ITE-2 is abstract. ITE-3 shows what the abstract model looks like when a real
team has to make threshold, expiration, delegation, and artifact-isolation
choices.

## Supply chain described in the proposal

```text
tag source
   |
   v
build wheels
   |
   v
sign wheels
   |
   v
TUF roles publish artifacts + in-toto metadata
```

The root layout then verifies that the wheel contents still correspond to the
original tagged source, which is how the model resists a compromised build
pipeline.

## Key lessons

- Thresholds differ for human and machine steps.
- Offline keys protect the high-value trust roots.
- TUF delegations can split a large repository into manageable sub-roles.

## Implementation status in this workspace

This is a case study, not a reusable runtime feature. I did not find Datadog's
TUF distribution layout or an equivalent packaged workflow in the current
workspace repos.

## Why readers should still care

If you are trying to adopt `witness` or `go-witness` in a serious release
environment, ITE-3 gives you a realistic picture of the operational decisions
that sit above attestation generation.

## Related ITEs

- [ITE-2](../ite-2/) for the generic model
- [ITE-5](../ite-5/) and [ITE-6](../ite-6/) for the later metadata-format changes

## Repository anchors

- `ITE/ITE/3/README.adoc`
