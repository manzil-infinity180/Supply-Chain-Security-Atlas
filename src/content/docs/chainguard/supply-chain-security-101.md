---
title: Supply chain security 101
description: A beginner-first map of the core questions software supply chain security tries to answer.
---

This page is for readers who keep hearing terms like "SBOM", "provenance", and
"attestation" but do not yet have a stable mental model for how they fit
together.

## The three questions

Most SSCS work is trying to answer three operational questions:

| Question | Example answer | Typical evidence |
| --- | --- | --- |
| What is this artifact made of? | "This image contains `nginx`, `openssl`, and these transitive libraries." | SBOM |
| How was it produced? | "It was built by this workflow from this source revision with these inputs." | provenance attestation |
| Why should I trust it? | "The producer identity signed it, the metadata matches the artifact digest, and policy allows that signer." | signatures, transparency data, verification policy |

If you only answer one of the three, you still have a gap.

## Core terms in plain language

**Artifact**: the thing you ship or verify. A binary, container image, tarball,
policy file, or documentation bundle all count.

**Dependency**: something your artifact includes or relies on.

**SBOM**: a software bill of materials. Think "inventory list", not "proof of
authenticity".

**Attestation**: signed metadata that makes a claim about an artifact. Common
claims include provenance, scan results, SBOM identity, and policy outcomes.

**Provenance**: the verifiable story of where an artifact came from and how it
was built.

**Signature**: cryptographic proof that a specific identity signed specific
bytes.

## Why containers are a good teaching example

Container images concentrate the main software supply chain problems into one
artifact type:

- they pull in a large dependency set
- they often include unnecessary tools by default
- they move through CI, registries, and Kubernetes admission
- they are easy to scan, sign, and compare

That is why the Chainguard ecosystem talks so much about minimal images, Wolfi,
`apko`, SBOMs, and provenance.

## A practical build-to-verify loop

```text
source code + package definitions
        |
        v
package build
        |
        v
image composition
        |
        +--> SBOM
        +--> provenance or config attestation
        +--> signature
        |
        v
registry or artifact store
        |
        v
policy verification in CI, deployment, or runtime
```

In this workspace, that same loop shows up in different forms:

- `rookery` packages `cilock` with `melange` and composes an image with `apko`
- `witness` produces in-toto attestations and verifies them against policy
- `sigstore` provides the signing and verification plumbing
- `aflock` pushes those trust decisions into AI-agent execution policy

## Beginner mistakes to avoid

- Treating an SBOM as if it were automatically trustworthy.
- Comparing CVE counts between two images without checking freshness or package
  scope.
- Assuming a signed artifact is safe just because it is signed.
- Shipping debugging tools in production images because "they might be useful".
- Forgetting that identity and policy matter as much as metadata collection.

## What "secure by default" usually means

In practice, teams move toward secure-by-default delivery by doing four things:

1. Starting from smaller, more intentional base images.
2. Generating machine-readable metadata at build time.
3. Signing artifacts and metadata with constrained identities.
4. Enforcing verification before release or deployment.

That is the thread connecting Chainguard, Sigstore, Witness, and `aflock`.

## Related sections

- [Minimal container images](../minimal-container-images/)
- [SBOMs and provenance](../sboms-and-provenance/)
- [Sigstore](/sigstore/)
- [witness quick start](/witness/quick-start/)

## Primary source anchors

- [Secure software recommendations](https://edu.chainguard.dev/software-security/secure-software-development/)
- [Chainguard Containers overview](https://edu.chainguard.dev/chainguard/chainguard-images/overview/)
- [SBOMs and attestations](https://edu.chainguard.dev/open-source/sbom/sboms-and-attestations/)

## Repository anchors

- `attestation/README.md`
- `witness/README.md`
- `aflock/pkg/aflock/types.go`
