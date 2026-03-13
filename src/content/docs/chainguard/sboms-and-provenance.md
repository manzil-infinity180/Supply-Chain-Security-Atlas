---
title: SBOMs and provenance
description: How SBOMs, attestations, and signatures answer different questions about a software artifact.
---

People often blur together three different things:

- inventory
- origin
- trust

That confusion causes bad architecture decisions.

## Start with the split

| Mechanism | Main job | Typical question |
| --- | --- | --- |
| SBOM | list components | "What is inside this artifact?" |
| Attestation | make a signed claim | "How or under what conditions was it produced?" |
| Signature | bind identity to bytes | "Who signed this exact artifact or envelope?" |

An SBOM is not automatically a provenance statement, and a signature alone does
not tell you the dependency graph.

## SBOM vs. attestation

Chainguard's SBOM guidance uses a simple mental model:

- an SBOM is the packing slip
- an attestation is the signed statement about the artifact and its production

That maps cleanly onto the tools in this workspace:

- `witness` and `go-witness` create and verify in-toto attestations
- `sigstore` signs artifacts and attestations
- `aflock` policies can require specific attestation producers and types

## What makes a good SBOM

The Academy's SBOM quality guide highlights fields that matter in practice:

- component name
- version
- package ecosystem or purl
- transitive dependencies
- licenses
- checksums for integrity use cases
- supplier information when relevant

Without enough of that structure, an SBOM may exist but still be weak for
vulnerability analysis, license review, or integrity workflows.

## Where provenance starts

Provenance is the answer to questions like:

- which source revision produced this image?
- which workflow or builder identity ran the build?
- what inputs were used?
- which subject digest does this metadata belong to?

That is why in-toto, DSSE, and Sigstore matter. They let you carry claims that
can be verified independently of the producer.

## Concrete connections in this workspace

`apko` and Chainguard's image tooling matter here because they generate useful
build metadata close to the moment the artifact is produced.

`rookery`'s release notes and learning guides also describe a pipeline where
artifacts get:

- checksums
- Cosign signatures
- SPDX SBOMs

This is the right pattern: collect inventory early, sign it, and keep it
attached to the artifact identity.

## Verification flow

```text
artifact digest
    |
    +--> SBOM says what should be inside
    +--> attestation says how it was produced
    +--> signature says who signed the bytes
    |
    v
policy engine checks whether all three align
```

## Practical guidance

- Generate SBOMs at build time when possible.
- Prefer signed attestations over unsigned attached metadata.
- Verify metadata against the artifact digest, not only by filename or tag.
- Keep identity constraints explicit: issuer, subject, workload, or key ID.

## Related sections

- [Supply chain security 101](../supply-chain-security-101/)
- [Sigstore and in-toto](/sigstore/witness-and-in-toto/)
- [witness verify](/witness/witness-verify/)
- [go-witness DSSE and in-toto](/go-witness/dsse-and-intoto/)

## Primary source anchors

- [SBOMs and attestations](https://edu.chainguard.dev/open-source/sbom/sboms-and-attestations/)
- [What makes a good SBOM?](https://edu.chainguard.dev/open-source/sbom/what-makes-a-good-sbom/)
- [SBOMs](https://edu.chainguard.dev/open-source/sbom/)

## Repository anchors

- `attestation/README.md`
- `witness/README.md`
- `go-witness/intoto/statement.go`
- `learning-aflock-witness-rookery/09-rookery-deep-dive-and-ecosystem.md`
