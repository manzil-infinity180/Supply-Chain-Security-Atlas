---
title: Signer Registry
description: Discover built-in signer providers and register custom signers for go-witness.
---

The `signer` package uses the generic `registry` package to discover signer and
verifier providers at runtime.

## Registry APIs

For signers:

- `signer.Register(name, factory, opts...)`
- `signer.RegistryEntries()`
- `signer.NewSignerProvider(name, opts...)`

For verifiers:

- `signer.RegisterVerifier(name, factory, opts...)`
- `signer.VerifierRegistryEntries()`
- `signer.NewVerifierProvider(name, opts...)`

## Built-in providers

The repo registers these signer providers:

- `file`
- `fulcio`
- `spiffe`
- `vault`
- `kms`

The KMS package also exposes a verifier provider and delegates to provider
implementations under:

- `signer/kms/aws`
- `signer/kms/azure`
- `signer/kms/gcp`

## Creating a provider

Implement this interface:

```go
type SignerProvider interface {
	Signer(context.Context) (cryptoutil.Signer, error)
}
```

Then register it:

```go
func init() {
	signer.Register("example", func() signer.SignerProvider { return New() })
}
```

If your provider has user-configurable fields, attach `registry.ConfigOption`
values exactly like the built-ins do.

## Why the registry exists

The registry stores:

- provider factory functions
- option names
- option descriptions
- default values

That metadata is what lets the Witness CLI create provider flags dynamically at
runtime instead of hardcoding every option.

## Fulcio, SPIFFE, and file-backed signing

Built-in providers map to common SSCS use cases:

- `file`: PEM or encrypted key files, optionally with certificates
- `fulcio`: OIDC-backed keyless signing with retry logic for GitHub Actions and
  Fulcio availability issues
- `spiffe`: fetch an x509-SVID from the SPIFFE Workload API socket and sign with
  the SVID private key
- `vault`: retrieve signing material from HashiCorp Vault

## KMS notes

The KMS provider matches references by URI prefix. The provider packages call
`kms.AddProvider(...)` during initialization, and `KMSSignerProvider.Signer()`
selects the implementation whose reference scheme matches the configured key
reference.

That means both layers matter:

- import `signer/kms` for the registry entry
- import at least one provider package such as `signer/kms/aws`

## Related sections

- [Cryptoutil](/go-witness/cryptoutil/)
- [Witness signing methods](/witness/signing-methods/)
- [SPIFFE / SPIRE](/spiffe-spire/)
