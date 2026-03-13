---
title: "ITE-6: enabling contextual in-toto attestations"
description: The accepted proposal that introduces the in-toto Attestation Framework with statements and predicate types.
---

## Summary

ITE-6 is the major format shift in modern in-toto. It introduces the
attestation framework: a signed statement with a stable outer shape and a
context-specific predicate inside.

That lets the ecosystem represent more than classic "command transformed
materials into products" links.

## What changes

ITE-6 defines a common outer statement:

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [
    {
      "name": "out.bin",
      "digest": {
        "sha256": "fedc9876..."
      }
    }
  ],
  "predicateType": "https://in-toto.io/Link/v0.2",
  "predicate": {
    "name": "build",
    "command": "make",
    "materials": {
      "in.txt": {
        "sha256": "abcd1234..."
      }
    },
    "byproducts": {},
    "environment": {}
  }
}
```

The key design choice is the split:

- the statement says what object is being described,
- the `predicateType` says how to interpret the predicate body,
- and the predicate schema can vary by use case.

## Why it matters

Classic links fit build steps well, but they are awkward for:

- provenance emitted by CI systems,
- code review evidence,
- vulnerability scan results,
- policy decisions,
- and SBOM-style metadata.

ITE-6 makes those use cases first-class instead of forcing them into the old
link shape.

## Model at a glance

```text
DSSE envelope
    |
    v
statement
    |
    +--> subject[]        what artifact or resource is being described
    +--> predicateType    how to parse the claim
    +--> predicate        the actual claim body
```

## Implementation status in this workspace

ITE-6 is heavily reflected in the current repos:

- `attestation/` is the standalone framework repository created around this model.
- `attestation/examples/go/main.go` constructs statements with `predicateType`.
- `go-witness/attestation/factory.go` registers attestors by predicate type.
- `go-witness/attestation/sbom/sbom.go` selects different predicate types for
  SPDX and CycloneDX material.
- `witness` emits in-toto attestations inside DSSE envelopes.
- `aflock` verifies DSSE envelopes and parses collection predicate types during
  attestation verification.

## Example: why predicates are useful

A build provenance claim and a vulnerability result can both use the same outer
statement shape while carrying very different predicate bodies. That is what
makes it possible for multiple tools to share one attestation ecosystem.

## Related ITEs

- [ITE-5](../ite-5/) provides the preferred envelope story.
- [ITE-9](../ite-9/) defines how new predicate types should be proposed.
- [ITE-10](../ite-10/) tries to bring these richer predicates back into layout verification.
- [in-toto attestations](/in-toto-attestations/) covers the framework itself.

## Repository anchors

- `ITE/ITE/6/README.adoc`
- `attestation/README.md`
- `attestation/examples/go/main.go`
- `go-witness/attestation/factory.go`
- `go-witness/attestation/sbom/sbom.go`
- `aflock/internal/verify/verifier.go`
