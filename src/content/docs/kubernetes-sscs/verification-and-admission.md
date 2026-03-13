---
title: Verification and admission
description: Verify deployment artifacts before they reach the cluster, then map that same policy logic into admission decisions.
---

Kubernetes admission should be the second verifier, not the first one.

The first verifier should be your delivery pipeline.

## Release gate before `kubectl apply`

The simplest cluster-safe pattern is:

1. build and attest the image
2. render and attest the manifests
3. verify both against a signed policy
4. only then submit the deployment

A manifest-focused verification step looks like this:

```sh
witness verify \
  --artifactfile dist/release.yaml \
  --attestations dist/render-manifests.att.json \
  --policy policy-signed.json \
  --publickey policy-pub.pem
```

That is directly aligned with `witness/docs/concepts/policy.md`, which calls
out Kubernetes admission controllers as a verification use case.

## A realistic manifest policy shape

This example shows the part that matters most for Kubernetes delivery:

- the deployment step must be signed by the expected functionary
- the collection must include a `k8smanifest` predicate
- the recorded images must come from an approved registry prefix

```txt
package k8smanifest

deny[msg] {
  some i
  some j
  image := input.recordeddocs[i].recordedimages[j].reference
  not startswith(image, "ghcr.io/acme/")
  msg := sprintf("unapproved image reference: %s", [image])
}
```

That is the policy bridge between attestation data and admission semantics:
the cluster is not just asking "was this signed?" but also "does this manifest
point at the right class of artifact?"

## Embedding verification in a custom admission service

The workspace does not ship a turnkey admission controller, but `go-witness`
already exposes the pieces you would embed:

```go
verifyResult, err := witness.Verify(
	ctx,
	policyEnvelope,
	[]cryptoutil.Verifier{policyVerifier},
	witness.VerifyWithCollectionSource(memorySource),
	witness.VerifyWithSubjectDigests([]cryptoutil.DigestSet{subjectDigest}),
)
```

That exact verification pattern is compile-tested in:

- `sscs-docs-site/examples/go-witness-snippets/run_sign_verify_test.go`
- `sscs-docs-site/examples/go-witness-snippets/kubernetes_admission_test.go`

In a webhook, `subjectDigest` would usually be the digest of:

- the rendered manifest under review
- an attached image artifact
- or both, depending on how you structure the release bundle

## Where Sigstore Policy Controller fits

For image-centric admission, [Sigstore Policy Controller](/sigstore/policy-controller/)
is the clearest upstream comparator.

Use that when:

- your policy is mostly about container image signatures and attached
  attestations in the registry
- you want an established admission controller instead of writing one

Use a custom `go-witness` verifier when:

- your policy needs the Witness policy model directly
- you want to evaluate manifest-specific predicates from `k8smanifest`
- your attestation storage or bundle layout is not registry-native

## Practical enforcement order

If you are rolling this out gradually:

1. enforce verification in CD
2. run admission checks in audit or report-only mode
3. turn on deny-by-default once the release bundle format is stable

For a deeper comparison of Sigstore Policy Controller, Kyverno, Gatekeeper, and
custom `go-witness` admission logic, continue to
[Admission and policy enforcement](../admission-policy-enforcement/).

## Anti-patterns

- Verifying only at admission. That makes the cluster your debugging surface.
- Verifying only image signatures. That misses deployment intent.
- Letting manifest mutation happen after attestation with no second verification
  step.

## Related sections

- [Architecture and trust flow](../architecture/)
- [Admission and policy enforcement](../admission-policy-enforcement/)
- [Attesting images and manifests](../attesting-images-and-manifests/)
- [Witness verify](/witness/witness-verify/)
- [Sigstore Policy Controller](/sigstore/policy-controller/)
- [in-toto attestations](/in-toto-attestations/)
