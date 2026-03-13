---
title: "ITE-9: introducing new in-toto attestation types"
description: The accepted process proposal for introducing new in-toto attestation predicate types.
---

## Summary

ITE-9 is the process companion to [ITE-6](../ite-6/). Once in-toto moved to
statements plus predicate types, the project needed a disciplined way to define
new predicates. ITE-9 provides that process.

## What problem it solves

Without a process, different projects could invent incompatible predicate types
for the same use case. That would fragment the ecosystem and make verification
harder.

ITE-9 requires new predicate proposals to include:

- purpose,
- use cases,
- prerequisites,
- model,
- schema and parsing rules,
- examples,
- and migration notes when versions change.

## Why this matters for SSCS readers

This proposal is why the attestation framework can grow without turning into a
bag of ad hoc JSON blobs. It pushes the community toward reviewed, documented,
versioned predicate types.

## Implementation status in this workspace

ITE-9 is reflected in two practical ways:

- `attestation/docs/new_predicate_guidelines.md` documents how new predicates
  should be proposed and contributed.
- `go-witness/attestation/factory.go` and related attestors treat predicate
  types as registry-managed extensibility points.

That does not mean every custom predicate in the workspace went through the ITE
process, but it does mean the tooling is built around the same predicate-type
model that ITE-9 standardizes.

## Related ITEs

- [ITE-6](../ite-6/) introduces predicate types in the first place.
- [ITE-10](../ite-10/) and [ITE-11](../ite-11/) assume richer predicate-specific verification in layouts.

## Repository anchors

- `ITE/ITE/9/README.adoc`
- `attestation/docs/new_predicate_guidelines.md`
- `go-witness/attestation/factory.go`
