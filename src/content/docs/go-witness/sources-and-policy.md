---
title: Sources And Policy
description: Search attestation collections, verify their signatures, and evaluate Witness policies in code.
---

The `source`, `archivista`, `policy`, and top-level `witness.Verify` APIs form
one pipeline.

## Source abstractions

The basic search contract is:

```go
type Sourcer interface {
	Search(ctx context.Context, collectionName string, subjectDigests, attestations []string) ([]CollectionEnvelope, error)
}
```

Built-in source implementations:

- `source.MemorySource`
- `source.MultiSource`
- `source.ArchivistaSource`
- `source.VerifiedSource`

## MemorySource

Use `MemorySource` for tests, local verification, or applications that already
have envelopes in memory.

It can load data from:

- files
- readers
- raw bytes
- parsed `dsse.Envelope` values

Search behavior is simple and explicit:

- collection name must match
- at least one supplied subject digest must appear
- all requested attestation types must appear

## MultiSource

`MultiSource.Search(...)` queries all child sources concurrently and merges the
results.

This is the easiest way to search local evidence plus a remote store in the same
verification pass.

## ArchivistaSource

`ArchivistaSource` wraps `archivista.Client` and searches by GraphQL before
downloading matching envelopes.

One repo detail worth knowing: the constructor is currently spelled
`source.NewArchvistSource(...)` in code.

## VerifiedSource

`VerifiedSource` upgrades a plain `Sourcer` into a `VerifiedSourcer` by running
DSSE verification over each returned envelope. Its search result includes:

- the verified collection envelope
- the verifiers that passed
- any signature errors
- warnings collected during later policy evaluation

## Policy evaluation in code

The `policy.Policy` type models:

- expiry time
- trusted roots
- timestamp authorities
- embedded public keys
- step definitions

Each `policy.Step` can require:

- one or more functionaries
- one or more attestation predicate types
- zero or more Rego modules attached to those attestation requirements

At runtime, `Policy.Verify(...)`:

1. checks expiration
2. loads trust bundles and embedded public keys
3. searches for matching collections
4. validates functionaries
5. validates attestation presence
6. evaluates Rego policies with the attestor JSON as input

The default search depth is `3`, configurable with `policy.WithSearchDepth(...)`.

## Rego input shape

`policy.EvaluateRegoPolicy(...)` marshals the attestor to JSON and uses that as
the OPA input document. In practice, that means your custom attestor's JSON
shape is also its policy input surface.

## Top-level verification flow

`witness.Verify(...)` is the easier API because it wires the pieces together for
you:

- verifies the policy envelope signature
- creates a `policyverify.Attestor`
- injects your collection source
- collects `policy.StepResult` values
- emits an SLSA verification summary

## Related sections

- [Core API](/go-witness/core-api/)
- [Witness verify](/witness/witness-verify/)
- [Archivista](/witness/archivista/)
