---
title: Admission and policy enforcement
description: Compare Kubernetes admission enforcement points and see how image signatures, attestations, and Witness policies fit into a cluster delivery gate.
---

Kubernetes admission is where SSCS evidence becomes a runtime allow-or-deny
decision.

It is not where trust should begin.

Use admission to confirm that a release bundle already passed CI verification,
not to replace release verification entirely.

## What admission is good at

Admission is the right place to answer questions like:

- was this image signed by the expected identity?
- does the image carry the attestations this cluster requires?
- does the manifest point at approved registries, namespaces, and service
  accounts?
- did this deployment bypass the normal release gate?

Admission is a weak place to do heavy debugging because every failure is now on
the Kubernetes API path.

## Cluster trust flow

```text
developer / CI
  |
  | build image, run tests, render manifests
  | witness run / sign / cosign attach
  v
registry + attestation storage
  |
  | witness verify in CD
  | promotion gate
  v
admission layer
  |
  +--> image signature and attestation checks
  +--> manifest policy checks
  +--> optional external lookups
  v
Kubernetes API server
  |
  v
running workload
  |
  +--> SPIFFE / SPIRE workload identity
  +--> optional in-cluster signing or verification
```

The important trust boundary is between CD and admission:

- CD should reject bad artifacts before deploy requests exist.
- Admission should reject anything that still reaches the cluster without the
  required evidence.

## Enforcement point comparison

| Enforcement point | Best fit | Native strengths | Where it gets harder | Workspace grounding |
| --- | --- | --- | --- | --- |
| Sigstore Policy Controller | Registry-native image admission | Verifies image signatures and attached attestations through `ClusterImagePolicy`; good for Cosign and keyless identity rules. | It is image-centric. Manifest-specific release intent usually needs another policy layer. | Upstream only. Compare with [Sigstore Policy Controller](/sigstore/policy-controller/). |
| Kyverno | Teams already using Kyverno for admission and policy | `ImageValidatingPolicy` can verify signatures, verify attestations, inspect attestation payloads, and also enforce broader Kubernetes policies. | You still need to model release evidence carefully so CEL expressions stay readable and maintainable. | Broader ecosystem guidance; pair with workspace attestation producers such as [witness](/witness/) and [go-witness](/go-witness/). |
| Gatekeeper / OPA | Organizations standardizing on Rego for admission and audit | Excellent for manifest-shape checks, namespace rules, label rules, and reusable Rego constraints. | OCI signature or attestation verification usually needs an external data provider or a companion verifier. | Broader ecosystem guidance; pair with Witness policy semantics or external evidence providers. |
| Custom `go-witness` verifier | Manifest-aware release bundles and mixed evidence stores | Direct access to Witness policy verification, `k8smanifest` predicates, custom sources, and your own webhook or controller flow. | You own API-server latency, caching, rollout safety, and operations. | Implemented by workspace primitives in `go-witness/verify.go` and `go-witness/attestation/k8smanifest/`. |

## Which tool should enforce what

Use this split if you want a system that stays understandable:

| Check type | Best first gate | Good admission gate |
| --- | --- | --- |
| Image signature identity | `cosign verify` or `witness verify` in CI | Sigstore Policy Controller or Kyverno |
| Provenance attestation presence and signer | CI promotion gate | Sigstore Policy Controller, Kyverno, or custom `go-witness` |
| SBOM presence and format | CI promotion gate | Kyverno or custom `go-witness` |
| Manifest content such as namespace, service account, registry prefix, or mutable tags | CI render verification | Gatekeeper, Kyverno, or custom `go-witness` |
| Step-level test evidence tied to a Witness policy | `witness verify` in CI | Custom `go-witness` verifier or Gatekeeper with external evidence lookup |

## Signed images and attestations before deployment

### Sigstore Policy Controller for image admission

Sigstore Policy Controller is strongest when your evidence lives next to the
image in the registry and your admission question is primarily:

"Should this image be allowed into the cluster?"

This example keeps the admission rule image-centric while also requiring a
provenance attestation:

```yaml
apiVersion: policy.sigstore.dev/v1beta1
kind: ClusterImagePolicy
metadata:
  name: ghcr-acme-release
spec:
  images:
    - glob: "ghcr.io/acme/*"
  authorities:
    - name: github-release
      keyless:
        url: https://fulcio.sigstore.dev
        identities:
          - issuer: https://token.actions.githubusercontent.com
            subjectRegExp: "https://github.com/acme/.+/.github/workflows/release.yml@refs/tags/.+"
      ctlog:
        url: https://rekor.sigstore.dev
      attestations:
        - name: provenance
          predicateType: https://slsa.dev/provenance/v1
          policy:
            type: cue
            data: |
              predicateType: "https://slsa.dev/provenance/v1"
```

Why this fits:

- the cluster verifies who signed the image
- the cluster also requires an attached provenance attestation to exist
- you can evolve the CUE or Rego policy to inspect attestation payload fields

Where it stops being enough:

- manifest policy is not the same as image policy
- non-registry evidence sources are awkward
- release-bundle logic across multiple steps is easier in Witness policy

The full example file is at
[`examples/admission/sigstore-clusterimagepolicy.yaml`](/examples/admission/sigstore-clusterimagepolicy.yaml).

### Kyverno for SBOM and attestation payload checks

Kyverno is useful when you want image verification and ordinary Kubernetes
policy in one controller.

The current `ImageValidatingPolicy` model can verify attestation signatures and
then inspect the payload in CEL:

```yaml
apiVersion: policies.kyverno.io/v1
kind: ImageValidatingPolicy
metadata:
  name: require-sbom
spec:
  validationActions: [Audit]
  webhookConfiguration:
    timeoutSeconds: 15
  failurePolicy: Fail
  matchConstraints:
    resourceRules:
      - apiGroups: [""]
        apiVersions: ["v1"]
        operations: ["CREATE", "UPDATE"]
        resources: ["pods"]
  matchImageReferences:
    - glob: "ghcr.io/acme/*"
  attestors:
    - name: cosign
      cosign:
        keyless:
          identities:
            - subject: "https://github.com/acme/.github/workflows/release.yml@refs/tags/*"
              issuer: "https://token.actions.githubusercontent.com"
        ctlog:
          url: "https://rekor.sigstore.dev"
  attestations:
    - name: sbom
      referrer:
        type: sbom/cyclone-dx
  validations:
    - expression: >-
        images.containers.map(image, verifyImageSignatures(image, [attestors.cosign])).all(e, e > 0)
      message: "image signature verification failed"
    - expression: >-
        images.containers.map(image, verifyAttestationSignatures(image, attestations.sbom, [attestors.cosign])).all(e, e > 0)
      message: "SBOM attestation verification failed"
    - expression: >-
        images.containers.map(image, extractPayload(image, attestations.sbom).bomFormat == 'CycloneDX').all(e, e)
      message: "SBOM must be CycloneDX"
```

This is a good fit when you want one admission stack to check:

- image signatures
- SBOM existence
- SBOM payload structure

The full example file is at
[`examples/admission/kyverno-imagevalidatingpolicy.yaml`](/examples/admission/kyverno-imagevalidatingpolicy.yaml).

### Gatekeeper for manifest policy, with external data when needed

Gatekeeper is strongest for Rego constraints over the Kubernetes object itself.

This is a good place to require digests instead of tags and to restrict allowed
registries:

```yaml
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sAllowedRegistryDigest
metadata:
  name: require-approved-registry-digests
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
  parameters:
    allowedPrefixes:
      - "ghcr.io/acme/"
```

That works well for manifest intent.

If you also want Gatekeeper to verify OCI signatures, provenance, or vulnerability
attestations, you normally add an external data provider that can query the
registry or another evidence source. That is powerful, but it adds another
networked component on the admission path.

The full template and constraint example is at
[`examples/admission/gatekeeper-allowed-registry-digest.yaml`](/examples/admission/gatekeeper-allowed-registry-digest.yaml).

## Provenance, SBOM, and test-result patterns

These three checks are worth separating because they answer different trust
questions.

### Provenance

Question:

"Did this image come from the build system and workflow I trust?"

Good fits:

- Sigstore Policy Controller when provenance is attached to the image in the
  registry
- Kyverno when you want admission-time attestation checks and CEL-based payload
  inspection
- `witness verify` in CD when provenance is part of a multi-step release policy

### SBOM

Question:

"Is there an inventory document for this image, and is it in the format my
platform expects?"

Good fits:

- Kyverno if you want to validate both attestation signature and payload shape
- custom `go-witness` verification if your SBOM evidence is bundled outside the
  registry or you want the same policy model as CI

### Test result

Question:

"Did the build or test step that produced this release actually pass?"

This is where Witness policy is especially useful because the repo already
models step names, functionaries, required attestation types, and Rego modules.

The compile-tested example under
[`examples/go-witness-snippets/policy_rego_test.go`](/examples/go-witness-snippets/policy_rego_test.go)
shows a Rego rule that fails verification if a test step captured as a
`command-run` attestation has a non-zero exit code or the wrong command shape:

```txt
package commandrun

deny[msg] {
  input.exitcode != 0
  msg := "exitcode not 0"
}
```

That same policy style can be embedded in:

- a CI promotion gate with `witness verify`
- a custom admission webhook using `go-witness`
- a Gatekeeper policy only if you also provide a way to fetch the underlying
  evidence into the admission decision

## How Witness and in-toto fit into admission

Witness is not a packaged Kubernetes admission controller in this workspace.

What the workspace does give you is the verification core:

- `witness verify` for the pre-admission gate
- `go-witness/verify.go` for embedding verification in a webhook or controller
- `go-witness/attestation/k8smanifest/` for manifest-aware predicates
- a compile-tested admission-style example in
  [`examples/go-witness-snippets/kubernetes_admission_test.go`](/examples/go-witness-snippets/kubernetes_admission_test.go)

That means the practical pattern is:

1. produce DSSE-wrapped in-toto attestations in CI
2. verify them in CD before promotion
3. optionally re-run the same policy logic at admission

This keeps the cluster from becoming the first place a broken release is
discovered.

## Trade-offs and anti-patterns

### Good rollout pattern

1. enforce verification in CI or CD first
2. enable admission in `Audit` or warn-only mode
3. add deny mode once images, attestations, and manifest rendering are stable
4. keep manifest policy and evidence policy separate even if one controller can
   evaluate both

### Anti-patterns

- verifying only at admission and nowhere earlier
- checking only image signatures while ignoring manifest content
- allowing mutable tags at admission
- performing slow remote lookups on every admission request with no caching or
  timeout strategy
- mutating manifests after attestation with no second verification step
- forcing one controller to express every policy when two simpler layers would
  be clearer

## Related sections

- [Kubernetes-native SSCS overview](../)
- [Architecture and trust flow](../architecture/)
- [Verification and admission](../verification-and-admission/)
- [Sigstore Policy Controller](/sigstore/policy-controller/)
- [witness verify](/witness/witness-verify/)
- [go-witness Kubernetes usage](/go-witness/kubernetes/)
- [in-toto attestations](/in-toto-attestations/)
