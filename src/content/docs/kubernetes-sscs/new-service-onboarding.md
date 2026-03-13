---
title: New service onboarding
description: Move a new service from repository setup to a policy-gated Kubernetes deployment with evidence at each step.
---

This is the minimum viable rollout path for a team adding SSCS controls to a
new Kubernetes service.

## Required vs optional dependencies

| Type | Tools |
| --- | --- |
| Required for the baseline flow | `witness`, a signing method, `kubectl` or `kustomize`, and a place to store attestations or release bundles |
| Optional for cluster-native identity | SPIRE or another SPIFFE-compatible workload identity deployment |
| Optional for local practice | `kind` or `k3d`, `cosign`, `opa`, and the `aflock` local SPIRE compose stack |

## Step 1: define the release artifacts

For Kubernetes, decide up front which artifacts are release-critical:

- container image
- rendered deployment manifest
- SBOM
- signed policy document

If one of these is missing, your later admission story will be inconsistent.

## Step 2: add attested build and package steps

Use the checked-in Witness GitHub workflow pattern as the reference if you are
on GitHub:

- `witness/.github/workflows/witness.yml`

That reusable workflow already models the right parameters:

- a named `step`
- an `attestations` list
- a concrete command
- OIDC-capable permissions for signer back ends such as Fulcio

If you are on GitLab, start from `witness/.gitlab-ci.yml`, but expect to add
the Witness invocation yourself because the checked-in file is only a baseline
pipeline.

## Step 3: attest the manifests separately

Do not reuse the image attestation as a substitute for deployment evidence.

Add a manifest-render step that produces a final YAML file and runs
`k8smanifest` against it. That becomes the artifact your deploy gate and
admission layer reason about.

## Step 4: write one signed policy first

Keep the first policy narrow:

- trust one signing identity or key
- require one image/package collection
- require one manifest collection

Add Rego checks only after the team can reliably produce the expected evidence.

## Step 5: verify before deploy

Make the CD system fail closed before it contacts the cluster:

```sh
witness verify \
  --artifactfile dist/release.yaml \
  --attestations dist/render-manifests.att.json \
  --policy policy-signed.json \
  --publickey policy-pub.pem
```

That keeps policy debugging out of the cluster event stream.

## Step 6: add admission once the bundle format is stable

At this stage, choose the enforcement model:

- [Sigstore Policy Controller](/sigstore/policy-controller/) if image
  signatures and attached attestations are the main control point
- a custom `go-witness` verifier if manifest predicates and Witness policies are
  the main control point

## Step 7: move signing identity off static keys

Once the basic flow works, upgrade identity:

- use [Sigstore keyless](/sigstore/keyless-signing/) for CI-backed identities
- or use [SPIFFE / SPIRE](/spiffe-spire/) when the platform already manages
  workload identity

## Suggested ownership split

| Team | Owns |
| --- | --- |
| Service team | build steps, manifest generation, and release policy intent |
| Platform team | admission, trust roots, workload identity, and attestation storage conventions |
| Security team | policy review, rollout thresholds, and exception process |

## What success looks like

A service is onboarded when:

- every deployable release has a reproducible image artifact and manifest
- both have signed evidence
- CD verifies that evidence
- cluster admission enforces the same trust model

## Related sections

- [Architecture and trust flow](../architecture/)
- [Attesting images and manifests](../attesting-images-and-manifests/)
- [Verification and admission](../verification-and-admission/)
- [Tutorials](/tutorials/)
