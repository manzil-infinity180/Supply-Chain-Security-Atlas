---
title: Cryptoutil
description: Use go-witness cryptographic helpers for signers, verifiers, x509 chains, and digest sets.
---

The `cryptoutil` package is where `go-witness` keeps its signing, verification,
certificate, and digest helpers.

## Signers and verifiers

The main factory functions are:

- `cryptoutil.NewSigner(...)`
- `cryptoutil.NewSignerFromReader(...)`
- `cryptoutil.NewVerifier(...)`
- `cryptoutil.NewVerifierFromReader(...)`

Supported key families in the root factories:

- RSA
- ECDSA
- Ed25519
- x509 certificates for verification

## RSA, ECDSA, and Ed25519 behavior

- RSA signing uses RSA-PSS.
- RSA verification first tries PSS and then falls back to PKCS#1 v1.5. The
  fallback exists because some AWS KMS flows may produce PKCS#1 signatures.
- ECDSA uses ASN.1 signatures.
- Ed25519 signs and verifies the message bytes directly instead of hashing them
  first.

## DigestSet

`DigestSet` is the type used throughout the library for subjects, materials,
products, and policy matching.

Supported named digests in `digestset.go` include:

- `sha256`
- `sha1`
- `gitoid:sha256`
- `gitoid:sha1`
- `dirHash`

Useful helpers:

- `CalculateDigestSet(...)`
- `CalculateDigestSetFromBytes(...)`
- `CalculateDigestSetFromFile(...)`
- `CalculateDigestSetFromDir(...)`
- `NewDigestSet(map[string]string)`
- `DigestSet.Equal(...)`

## x509 wrapping

When you have a private key plus a certificate chain, use signer options:

```go
signer, err := cryptoutil.NewSigner(
	privateKey,
	cryptoutil.SignWithCertificate(leafCert),
	cryptoutil.SignWithIntermediates(intermediates),
	cryptoutil.SignWithRoots(roots),
)
```

That produces an `X509Signer`, which also satisfies `cryptoutil.TrustBundler`.
The DSSE signing code uses that interface to embed the leaf certificate and
intermediates in the envelope signature entry.

On verification, `cryptoutil.NewX509Verifier(...)` checks the certificate chain
at a trusted time and then verifies the signature bytes.

## Key IDs

Both `Signer` and `Verifier` embed `KeyIdentifier`, so the same `KeyID()` value
flows through:

- DSSE signature entries
- policy public key matching
- functionary validation

That is how the policy engine maps an accepted signature back to a configured
functionary.

## When to use cryptoutil directly

Use the package directly when you:

- already have keys in memory
- need signing without the provider registry
- want digest calculation without building a full attestation collection
- need certificate-based verification in application code

Use the [signer registry](/go-witness/signers/) when keys come from providers
such as files, Fulcio, SPIFFE, Vault, or KMS.
