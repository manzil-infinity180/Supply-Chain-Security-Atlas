---
title: Policy Controller
description: See how Sigstore Policy Controller turns signatures and attestations into Kubernetes admission decisions.
---

Sigstore Policy Controller is a Kubernetes admission controller. It evaluates
container images before they are admitted to the cluster and can require valid
signatures, valid attestations, or both.

This is where Sigstore stops being a developer-only tool and becomes a runtime
control.

## What it checks

At a high level, Policy Controller can enforce:

- trusted signature authorities
- keyless signer identity rules
- trusted roots and transparency-log settings
- required attestations for images
- per-namespace enablement

The policy object you will encounter most often is `ClusterImagePolicy`.

## Admission flow

```text
Pod admission request
       |
       v
Policy Controller sees image reference
       |
       +--> resolves image to a digest
       +--> fetches attached signatures and attestations
       +--> verifies Fulcio or key-based trust roots
       +--> checks Rekor or bundle evidence
       +--> evaluates signer identity constraints
       +--> evaluates required attestations
       |
       v
allow or deny
```

## Keyless policy example

This example shows the shape of a keyless image policy for GitHub Actions-backed
images:

```yaml
apiVersion: policy.sigstore.dev/v1beta1
kind: ClusterImagePolicy
metadata:
  name: only-release-workflow-images
spec:
  images:
  - glob: "ghcr.io/acme/*"
  authorities:
  - keyless:
      url: https://fulcio.sigstore.dev
      identities:
      - issuer: https://token.actions.githubusercontent.com
        subjectRegExp: "https://github.com/acme/.+/.github/workflows/release.yml@refs/tags/.+"
```

The policy idea is simple:

- only images from `ghcr.io/acme/*` are in scope
- the signer must have a Fulcio-issued certificate
- that certificate must come from the GitHub Actions OIDC issuer
- the subject must match the expected release workflow pattern

## Requiring an attestation, not just a signature

A stronger policy often requires both:

- a trusted signer identity
- a trusted attestation type, such as SLSA provenance

That is the Kubernetes counterpart to `cosign verify-attestation` or
`witness verify`: the cluster is not only checking "who signed this image?" but
also "does the attached evidence satisfy my release rules?"

## Trust roots

Two details matter operationally:

- a `ClusterImagePolicy` can rely on the Sigstore public-good roots by default
- private or GitHub-specific deployments may also need an explicit `TrustRoot`
  so the cluster knows which signing material distribution channel to trust

That is why Policy Controller discussions quickly become conversations about
identity, trust-root distribution, and registry publication practices, not just
about YAML.

## Where it fits in an SSCS stack

A common production chain looks like this:

1. build or test system generates evidence
2. cosign or Witness signs it with keyless or managed keys
3. signatures and attestations are published with the image
4. Policy Controller verifies them before Kubernetes admits the workload

This is the bridge between CI evidence and runtime enforcement.

## Related sections

- [CI/CD patterns](../ci-cd/)
- [Cosign workflows](../cosign-workflows/)
- [Security model](../security-model/)
- [witness CI/CD](/witness/ci-cd/)

## Source anchors

Official references:

- [Policy Controller overview](https://docs.sigstore.dev/policy-controller/overview/)
- [GitHub's admission-controller guide](https://docs.github.com/actions/concepts/security/kubernetes-admissions-controller)
- [Sigstore policy-controller repository](https://github.com/sigstore/policy-controller)

Workspace anchors:

- `go-witness/attestation/k8smanifest/k8s.go`
- `witness/docs/commands.md`
