---
title: Architecture and trust flow
description: See where build systems, registries, admission checks, and workload identity fit in a Kubernetes-native SSCS design.
---

This page answers one question:

Where do the repos in this workspace sit inside a Kubernetes delivery system?

## Trust flow

```text
Developer workstation
  |
  | git push / merge
  v
CI runner
  - build binary or image
  - render Kubernetes manifests
  - witness run / cilock run
  - sign DSSE envelopes
  |
  +--> artifact registry
  +--> attestation storage / release bundle
  |
  v
Deployment gate
  - witness verify in CD
  - optional custom verifier built on go-witness
  - optional Sigstore/Cosign checks
  |
  v
Kubernetes API / admission
  - allow only signed and policy-compliant releases
  |
  v
Running workload
  - image already verified
  - workload identity from SPIFFE / SPIRE
  - optional signing or verification by in-cluster services
```

## Which repo covers which layer

| Layer | Workspace implementation |
| --- | --- |
| CI execution and attestation capture | `witness/.github/workflows/witness.yml` wraps a command with `witness run`, a step name, attestor list, and OIDC-capable permissions. |
| GitLab baseline | `witness/.gitlab-ci.yml` is a lightweight build/test/vet pipeline. It is a starting point, not a full attestation gate yet. |
| Manifest evidence | `go-witness/attestation/k8smanifest/k8s.go` and `rookery/plugins/attestors/k8smanifest/k8s.go` normalize Kubernetes YAML or JSON, remove ephemeral fields, and can perform server-side dry-run normalization. |
| Image metadata evidence | `go-witness/attestation/oci/oci.go` and the rookery OCI plugin record image tarball metadata such as tags, layers, manifest digest, and image ID. |
| Minimal attestation runner image | `rookery/deploy/cilock/{melange,apko}.yaml` packages `cilock` into a minimal Wolfi-based image. |
| Runtime workload identity | `go-witness/signer/spiffe/spiffe.go` and `aflock/internal/identity/spire.go` consume the SPIFFE Workload API socket. |
| Local identity lab | `aflock/docker-compose.yml` runs a SPIRE server, SPIRE agent, and a test workload with `SPIFFE_ENDPOINT_SOCKET` wired in. |

## Design rule: verify before and at admission

For Kubernetes, one verification point is usually not enough.

- Verify in CD before promotion so bad artifacts never become deployment
  candidates.
- Verify again at admission so the cluster refuses anything that bypassed the
  expected release path.

That is why the workspace matters in two places:

- `witness verify` gives you a release gate before `kubectl apply`
- `go-witness` gives you embeddable verification logic for a webhook or
  controller

## Design rule: treat manifests as first-class release artifacts

A common mistake is to attest only the container image and ignore the deployment
specification. The checked-in `k8smanifest` attestor exists specifically to
close that gap.

That matters because:

- image signatures do not tell you which namespace, service account, or command
  line the workload will run with
- Kubernetes defaulting and mutation can change the effective deployment shape
- admission decisions often depend on both image identity and manifest content

## Where broader ecosystem components fit

These are important, but they are not implemented as first-class code in this
workspace:

- [Sigstore Policy Controller](/sigstore/policy-controller/) for cluster
  admission on image signatures and attached attestations
- [cosign](/sigstore/cosign-workflows/) for registry-native signature and
  attestation attachment
- cluster-native policy engines such as Kyverno or Gatekeeper, which are more
  relevant to the admission-focused section that follows this track

## Related sections

- [Attesting images and manifests](../attesting-images-and-manifests/)
- [Verification and admission](../verification-and-admission/)
- [SPIFFE / SPIRE](/spiffe-spire/)
- [Sigstore](/sigstore/)
