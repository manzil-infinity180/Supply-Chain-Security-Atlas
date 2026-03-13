---
title: Kubernetes
description: Use go-witness inside controllers, operators, and manifest pipelines.
---

`go-witness` does not ship a full controller framework, but the library is
already structured in a way that fits Kubernetes-native software.

## Where Kubernetes shows up in the repo

- `policy` types use kubebuilder markers and `metav1.Time`
- `attestation/k8smanifest` records normalized Kubernetes manifest details
- the rest of the library is normal Go code that can run inside a controller,
  admission service, or operator

## k8smanifest attestor

`attestation/k8smanifest` is the main Kubernetes-specific attestor. It runs in
the `PostProductRunType` stage and is designed to inspect YAML or JSON manifests
that earlier steps produced.

It can:

- parse `.json`, `.yaml`, and `.yml` product files
- remove ephemeral fields before hashing
- discover referenced container images
- optionally perform server-side dry-run normalization
- optionally record cluster information

Notable options from the source:

- `WithServerSideDryRun(...)`
- `WithKubeconfigPath(...)`
- `WithKubeContext(...)`
- `WithRecordClusterInfo(...)`
- `WithExtraIgnoreFields(...)`
- `WithExtraIgnoreAnnotations(...)`

## Embedding in a controller or operator

The usual pattern is:

1. reconcile or observe a workload
2. render or fetch the manifests you care about
3. run `witness.RunWithExports(...)` in-process
4. store the resulting envelope or verify it against policy

```go
results, err := witness.RunWithExports(
	"deploy",
	witness.RunWithSigners(signer),
	witness.RunWithAttestors([]attestation.Attestor{
		product.New(),
		k8smanifest.New(),
	}),
	witness.RunWithAttestationOpts(
		attestation.WithWorkingDir(renderDir),
	),
)
```

That pattern is useful for GitOps controllers, release operators, and admission
systems that want attestations tied to rendered deployment state.

## Policy types are Kubernetes-friendly

The `policy.Policy`, `policy.Step`, `policy.Attestation`, and related types have
kubebuilder annotations in source. That makes them a reasonable fit if you want
to define verification policy in Kubernetes-style APIs and evaluate it with the
same library code.

## SPIFFE and cluster identity

If your workloads already have SPIFFE identities, the `spiffe` signer provider
is the natural companion for Kubernetes deployment:

- fetch x509-SVIDs from the Workload API socket
- sign envelopes with workload identity instead of long-lived keys
- reuse the DSSE and policy paths already described in this section

## Related sections

- [SPIFFE / SPIRE](/spiffe-spire/)
- [Witness CI/CD](/witness/ci-cd/)
- [Aflock agent identity](/aflock/agent-identity/)
