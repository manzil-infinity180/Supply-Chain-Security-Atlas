---
title: "ITE-2: TUF + in-toto for compromise resilience"
description: A plain-language guide to the accepted proposal for combining TUF and in-toto to distribute software and metadata safely.
---

## Summary

ITE-2 explains how to combine The Update Framework (TUF) with in-toto so that
users can verify both software artifacts and the metadata that describes how
those artifacts were produced.

The core claim is simple: in-toto can describe the supply chain, but you still
need a secure way to distribute layouts, link metadata, and trusted keys. ITE-2
proposes using TUF for that distribution layer.

## What problem it solves

Without a distribution layer, an attacker who compromises the repository or
artifact server may be able to swap out the public keys or metadata that users
rely on for verification. TLS alone does not solve that rollback and key
replacement problem.

ITE-2 uses TUF to provide:

- offline root trust,
- key rotation and revocation,
- freshness guarantees,
- and resilience against compromised package repositories.

## Model at a glance

```text
offline root keys
      |
      v
  TUF metadata
      |
      +--> package artifact
      +--> in-toto root layout
      +--> per-artifact link metadata
      +--> public keys needed to verify the layout
```

## What changes

The document recommends that TUF targets metadata carry not just package hashes
but also custom metadata pointing to the full set of in-toto metadata for each
package. That lets an update client download the package and the evidence needed
to verify the build pipeline that produced it.

## Implementation status in this workspace

I did not find a first-class TUF-backed distribution workflow in the current
`witness`, `go-witness`, `rookery`, or `aflock` repos. There are indirect
`go-tuf` dependencies in `go.mod` files, but this workspace does not currently
document or expose an operator-facing TUF integration comparable to ITE-2.

## Why it still matters

ITE-2 is still useful background for teams that want end-to-end trust:

- `witness` and `go-witness` answer "what evidence was produced?"
- TUF answers "how did the client obtain that evidence and the trust roots safely?"

## Related ITEs

- [ITE-3](../ite-3/) shows a concrete deployment of this model.
- [ITE-4](../ite-4/) and [ITE-6](../ite-6/) expand what kinds of artifacts and metadata can be referenced.

## Repository anchors

- `ITE/ITE/2/README.adoc`
- `witness/go.mod`
- `go-witness/go.mod`
