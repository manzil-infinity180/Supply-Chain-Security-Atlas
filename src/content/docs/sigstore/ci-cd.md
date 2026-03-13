---
title: CI/CD patterns
description: Turn Sigstore concepts into practical CI/CD workflows for GitHub Actions, release verification, and artifact promotion.
---

The most important production pattern is not "sign an artifact once." It is
"carry identity, evidence, and policy checks through the whole pipeline."

For concrete GitHub Actions and GitLab CI examples that pair those Sigstore
checks with Witness policy gates, use [CI/CD reference pipelines](/reference-pipelines/).

## A practical pipeline

```text
source change
   |
   v
CI job runs tests and build
   |
   +--> Witness gathers evidence
   +--> Sigstore keyless signing binds the job identity
   |
   v
artifact or image published with signatures and attestations
   |
   v
promotion or deployment stage verifies:
  - signer identity
  - OIDC issuer
  - attestation type and content
  - optional Rekor or bundle evidence
   |
   v
release or admission decision
```

## GitHub Actions

GitHub Actions is the most common Sigstore keyless example because it can issue
OIDC tokens to jobs. The operational pattern is:

- enable `id-token: write`
- build the artifact or image
- sign with `cosign` or Witness using the workflow identity
- verify later against the workflow subject and
  `https://token.actions.githubusercontent.com`

For the repos in this workspace, the important implementation detail is that the
`go-witness` Fulcio signer already knows how to fetch the GitHub Actions OIDC
token from the standard Actions environment variables.

## Verified release downloads

Not every consumer wants a registry-based workflow. Release downloads still
matter.

The Witness repository demonstrates the standard blob-verification pattern in
`INSTALL.md`:

```sh
cosign verify-blob \
  --certificate witness_${VERSION}_${OS}_${ARCH}.pem \
  --signature witness_${VERSION}_${OS}_${ARCH}.sig \
  --certificate-identity https://github.com/in-toto/witness/.github/workflows/release.yml@refs/tags/v${VERSION} \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  witness_${VERSION}_${OS}_${ARCH}
```

This is exactly the kind of release-verification flow you should recognize in
real projects.

## Promotion gates

The cleanest promotion design is digest-based:

- build once
- sign the immutable digest
- verify the same digest before promotion
- reject rebuilds that try to reuse a trusted tag

This is where Sigstore, [Witness](/witness/), and Kubernetes admission line up:
all of them work best when you reason about immutable subjects.

## Common CI mistakes

- verifying only that "some signature exists"
- trusting a tag instead of a digest
- forgetting to constrain certificate identity and OIDC issuer
- publishing an attestation but never evaluating its predicate content
- mixing dev and prod trust roots without making that split explicit

## Good defaults

- use keyless signing for hosted CI when OIDC is available
- use KMS or SPIFFE when your platform team already operates those systems
- keep verification rules close to deployment and promotion boundaries
- treat signatures and attestations as inputs to policy, not as policy by
  themselves

## Related sections

- [Keyless signing](../keyless-signing/)
- [Policy Controller](../policy-controller/)
- [witness CI/CD](/witness/ci-cd/)
- [witness installation](/witness/installation/)

## Repository anchors

- `witness/INSTALL.md`
- `witness/.github/workflows/`
- `witness/.gitlab-ci.yml`
- `go-witness/signer/fulcio/github.go`
