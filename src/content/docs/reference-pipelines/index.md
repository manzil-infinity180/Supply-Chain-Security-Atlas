---
title: CI/CD Reference Pipelines
description: Practical GitHub Actions and GitLab CI reference patterns for building, attesting, verifying, signing, and releasing binaries and container images.
---

**Audience:** engineers who already understand CI systems and now need a
repeatable SSCS pipeline shape they can adapt for production.

**Prerequisites:** a signed Witness policy, a private key or workload identity
for build attestations, and a release target such as GitHub Releases, the
GitLab Package Registry, or a container registry.

This section sits between the tutorial material and the deeper command
reference. It is for teams that want copy-pasteable pipeline structure without
pretending that one vendor workflow fits every environment.

## What is grounded in this workspace

The examples in this section are anchored to real implementation details from
the repositories in this workspace:

- `witness/.github/workflows/witness.yml` shows the reusable GitHub Actions
  pattern the project uses for attested jobs.
- `witness/.github/workflows/release.yml` shows the tagged release flow with
  GitHub OIDC, Cosign, Syft, and GoReleaser.
- `witness/.goreleaser.yaml` shows that the project signs release archives with
  `cosign sign-blob`, produces Sigstore bundles, builds OCI images with `ko`,
  and signs image manifests.
- `witness/.gitlab-ci.yml` shows the project's current GitLab baseline:
  straightforward `build`, `test`, and `vet` shell stages.
- `witness/cmd/{run,sign,verify}.go` and `witness/options/{run,sign,verify}.go`
  define the exact CLI flags used below.

Where a page extends beyond those repo snapshots, it says so explicitly.

## The pipeline model

```mermaid
flowchart LR
  A[Source change] --> B[CI build job]
  B --> C[Witness attestation]
  C --> D[Stored build evidence]
  D --> E[Policy verification gate]
  E --> F[Release or push]
  F --> G[Sigstore signature]
  G --> H[Promotion or deploy verification]

  C -. repo, env, CI metadata .-> D
  E -. checks step names, signers, predicates .-> F
  G -. blob or image signature .-> H
```

Read the layers differently:

- Witness answers "was this artifact produced by an acceptable process?"
- Sigstore answers "is this the exact blob or image digest I trust to
  distribute?"
- Policy verification turns those facts into a gate between stages.

## Choose a reference

| Page | Best fit | What you get |
| --- | --- | --- |
| [GitHub Actions](./github-actions/) | GitHub-hosted or self-hosted Actions with OIDC | a binary release flow grounded in the Witness repo plus a container-image variant |
| [GitLab CI](./gitlab-ci/) | GitLab runners and staged shell pipelines | a container release flow, a binary release variant, and guidance on runner assumptions |
| [Promotion and retention](./promotion-and-retention/) | teams deciding where evidence should live after build | artifact retention rules, stage-to-stage promotion guidance, and anti-patterns |

## Common inputs across all pipelines

- A committed policy file such as `.witness/release-policy-signed.json`
- A build attestation signer
  Use a file key, KMS, SPIFFE, or Fulcio-backed identity depending on your
  environment
- A policy verification key or trust root
- Stable step names such as `build` or `image-build`
- Immutable release targets
  Prefer digests over mutable tags whenever the platform allows it

## When to use keyless vs key-based signing

Use Sigstore keyless when the CI platform can issue a workload identity that
you are willing to trust at release time. In this workspace that is already the
GitHub Actions model described by `witness/INSTALL.md`,
`witness/.github/workflows/release.yml`, and `witness/.goreleaser.yaml`.

Use key-based signing when:

- the platform does not expose a stable OIDC integration
- you want an explicit migration step before adopting Fulcio
- your release system already centralizes keys in KMS or another secret store

The examples below intentionally keep Witness policy verification independent of
the distribution-signature choice. That makes rollout easier: you can change
how you sign releases without rewriting the attestation policy model.

## Related sections

- [Witness CI/CD integration](/witness/ci-cd/)
- [Witness sign and policy](/witness/sign-and-policy/)
- [Witness verify](/witness/witness-verify/)
- [Sigstore CI/CD patterns](/sigstore/ci-cd/)
- [Tutorial: Full CI/CD pipeline with Witness and cosign](/tutorials/full-ci-cd-pipeline-with-witness-and-cosign/)
- [Adoption guide: GitHub](/adoption-guides/github/)

## Repository anchors

- `witness/.github/workflows/witness.yml`
- `witness/.github/workflows/release.yml`
- `witness/.gitlab-ci.yml`
- `witness/.goreleaser.yaml`
- `witness/cmd/run.go`
- `witness/cmd/sign.go`
- `witness/cmd/verify.go`
