---
title: Kubernetes-native SSCS
description: Put build evidence, manifest attestations, verification, admission, and workload identity into one cluster-bound delivery model.
---

Kubernetes does not replace software supply chain security. It makes the control
points more obvious:

- build jobs create images and deployment artifacts
- registries and attestation stores hold release evidence
- admission layers decide what the cluster will trust
- workload identity decides which running component is allowed to sign or verify

This section ties those control points back to the repositories in this
workspace.

## What is implemented here today

| Workspace anchor | What it gives you | What to treat as broader ecosystem guidance |
| --- | --- | --- |
| `witness/.github/workflows/witness.yml` | A reusable GitHub Actions workflow that wraps commands with `witness run` and OIDC-enabled permissions. | A full multi-stage cluster deployment pipeline still needs to be assembled in your own repo. |
| `witness/.gitlab-ci.yml` | A simple GitLab build/test/vet baseline. | It does not yet mirror the GitHub Witness attestation flow. |
| `go-witness/attestation/k8smanifest/` | A real Kubernetes manifest attestor with server-side dry-run, context selection, and optional cluster info recording. | A packaged admission controller is not shipped in this workspace. |
| `go-witness/signer/spiffe/` | A signer that loads an X.509-SVID from the SPIFFE Workload API socket. | Running SPIRE inside a cluster is still an operator/platform task. |
| `rookery/plugins/attestors/{k8smanifest,oci}` | Hardened plugin variants for manifest and image metadata capture, plus builder presets and custom binary assembly. | You still choose how to deploy the resulting binary in your own platform. |
| `aflock/docker-compose.yml` | A local SPIRE dev stack that shows the socket plumbing and trust-domain assumptions. | It is a local lab anchor, not a production Kubernetes install. |

## The SDLC view

```text
commit -> CI build -> image/package artifacts -> attest + sign
       -> render manifests -> verify release policy -> deploy request
       -> admission check -> running workload with SPIFFE identity
```

The key idea is that Kubernetes should consume evidence that already exists,
not invent trust at deploy time.

## Pages in this track

- [Architecture and trust flow](./architecture/) shows where developers, CI,
  registries, admission, and runtime identity sit in the chain.
- [Attesting images and manifests](./attesting-images-and-manifests/) shows the
  concrete `witness`, `go-witness`, and `rookery` primitives available in this
  workspace.
- [Verification and admission](./verification-and-admission/) explains where to
  run `witness verify`, where custom `go-witness` logic fits, and where
  Sigstore Policy Controller fits as an upstream option.
- [Admission and policy enforcement](./admission-policy-enforcement/) compares
  Sigstore Policy Controller, Kyverno, Gatekeeper, and custom `go-witness`
  verification for provenance, SBOM, test-result, and manifest checks.
- [Workload identity](./workload-identity/) connects SPIFFE and SPIRE to
  cluster-bound signing and verification.
- [New service onboarding](./new-service-onboarding/) gives a practical rollout
  path for a team shipping a new service into a cluster.

## Recommended reading order

1. Read [in-toto attestations](/in-toto-attestations/) for the trust model.
2. Read [Witness](/witness/) or [go-witness](/go-witness/) for the actual
   attestation and verification primitives.
3. Use this section to map those primitives onto a Kubernetes SDLC.
4. Finish with [Sigstore](/sigstore/) and [SPIFFE / SPIRE](/spiffe-spire/) for
   the identity and admission ecosystem around the workspace repos.
