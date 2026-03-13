---
title: in-toto attestations
description: Overview of the in-toto Attestation Framework and how it anchors the rest of the site.
---

The `attestation/` repository describes the in-toto Attestation Framework as a
specification for generating verifiable claims about how software is produced.
Its goal is to let consumers validate origin and establish trust in the
software supply chain using attestations.

## What the framework provides

The current project README points readers to:

- the core specification for attestation format and metadata,
- vetted predicate types for common use cases,
- protobuf definitions for tooling integration,
- and language bindings for Go, Python, Rust, and Java.

## Why this comes before the tools

Projects such as `witness`, `go-witness`, and `rookery` are easier to
understand once you know the base model:

- what an attestation is,
- what is signed,
- what predicates describe,
- and how verification reasons about provenance and trust.

## Planned documentation in this section

- A beginner-first explanation of attestations, predicates, and DSSE
- How the framework intersects with SLSA and provenance
- Links from the specification to concrete examples in `witness` and `aflock`

## Related sections

- [in-toto ITEs](/in-toto-ites/) for the proposal history
- [witness](/witness/) for CLI workflows built on the framework
- [go-witness](/go-witness/) for library integration
