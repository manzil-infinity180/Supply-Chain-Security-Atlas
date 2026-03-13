---
title: Attesting images and manifests
description: Generate evidence for both container images and Kubernetes deployment artifacts using the primitives that exist in this workspace.
---

If you only attest the image, you miss deployment intent.

If you only attest the manifest, you miss the thing that actually runs.

Kubernetes-bound delivery usually needs both.

## The primitives available in this workspace

| Repo surface | What it records | Important nuance |
| --- | --- | --- |
| `witness` `k8smanifest` attestor | Normalized manifest objects, referenced images, optional cluster info | It inspects `.yaml`, `.yml`, or `.json` product files. Make the rendered manifest part of the step output. |
| `witness` `oci` attestor | Image tarball digest, tags, manifest, layer diff IDs, image ID | It operates on an OCI tarball on disk, not a remote registry reference. |
| `witness` `sbom` and `slsa` attestors | SBOM and provenance predicates for release evidence | Useful when admission or promotion policy wants more than one predicate type. |
| `go-witness` `attestation/k8smanifest` | The embeddable form of the same manifest attestor | Fit for operators, controllers, or admission webhooks. |
| `rookery` `cilock` and plugins | Similar attestors plus a custom-binary path for slimmer runners | Helpful when you want a reduced CLI footprint in CI or a container image. |

## Attesting rendered manifests with `witness`

This is the safest pattern for GitOps or deploy jobs:

1. render the final YAML
2. record the rendered file as a product
3. let `k8smanifest` normalize and hash it
4. sign the resulting DSSE envelope

```sh
mkdir -p dist

witness run \
  --step render-manifests \
  -a k8smanifest \
  --attestor-k8smanifest-server-side-dry-run \
  --attestor-k8smanifest-kubeconfig "$HOME/.kube/config" \
  --attestor-k8smanifest-context dev-cluster \
  --outfile dist/render-manifests.att.json \
  --signer-file-key-path ./keys/deploy.pem \
  -- sh -lc 'kustomize build ./k8s > dist/release.yaml'
```

Why this matches the source:

- `go-witness/attestation/k8smanifest/k8s.go` accepts `server-side-dry-run`,
  `kubeconfig`, `context`, `record-cluster-information`, and ignore-list
  options.
- the attestor runs in the post-product phase, so it expects rendered manifest
  files to exist by the time it executes.

## Attesting a container image artifact

The checked-in OCI attestor expects an OCI tarball among the step products. A
mechanically plausible flow is:

```sh
mkdir -p dist

witness run \
  --step package-image \
  -a oci \
  -a sbom \
  -a slsa \
  --attestor-sbom-export \
  --attestor-slsa-export \
  --outfile dist/package-image.att.json \
  --signer-file-key-path ./keys/release.pem \
  -- sh -lc '\
    docker build -t demo:${GIT_SHA} . && \
    docker save demo:${GIT_SHA} -o dist/demo-image.tar && \
    syft oci-archive:dist/demo-image.tar -o spdx-json > dist/demo-image.spdx.json'
```

That gives you three distinct evidence threads:

- `oci` for the tarball and image metadata
- `sbom` for package inventory
- `slsa` for step-level provenance

## Embedding manifest attestation with `go-witness`

The site already includes a compile-tested example using the Kubernetes manifest
attestor. The core pattern is:

```go
result, err := witness.Run(
	"deploy",
	witness.RunWithSigners(signer),
	witness.RunWithAttestors([]attestation.Attestor{
		product.New(),
		k8smanifest.New(),
	}),
	witness.RunWithAttestationOpts(attestation.WithWorkingDir(workingDir)),
)
```

That exact flow is exercised in:

- `sscs-docs-site/examples/go-witness-snippets/kubernetes_test.go`
- `sscs-docs-site/examples/go-witness-snippets/kubernetes_admission_test.go`

Use this path when the attestor should run inside a controller, operator, or
custom admission service instead of an external shell script.

## Using rookery for slimmer runners

If you want the same style of attestors in a purpose-built CLI, `rookery`
provides:

- `plugins/attestors/k8smanifest`
- `plugins/attestors/oci`
- the `builder` for custom binaries
- `deploy/cilock/apko.yaml` and `deploy/cilock/melange.yaml` for a minimal
  Wolfi-based image packaging path

That is useful when a Kubernetes delivery platform wants a smaller attestation
tool image than a general CI runner.

## Recommended release bundle

For a service shipping into Kubernetes, a strong baseline is:

- one attestation collection for the build or package step
- one attestation collection for rendered manifests
- an SBOM export
- a signed policy document used by CD and admission

## Related sections

- [Verification and admission](../verification-and-admission/)
- [Witness attestors](/witness/attestors/)
- [go-witness in Kubernetes](/go-witness/kubernetes/)
- [rookery custom binary builder](/rookery/custom-binary-builder/)
