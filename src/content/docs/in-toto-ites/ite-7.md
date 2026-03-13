---
title: "ITE-7: signing and verification with x509"
description: The draft proposal for x509-backed in-toto signing and verification, including trust bundles, certificate constraints, and embedded certificates.
---

## Summary

ITE-7 is a draft proposal that brings certificate-backed identity directly into
in-toto verification. Instead of authorizing only raw public keys, layouts
would be able to trust certificate chains and constrain certificate attributes.

## What the draft adds

The proposal introduces three main pieces:

- `trustBundles` in the layout for roots and intermediates,
- `cert_constraints` in steps so layouts can constrain certificate identity,
- and a `certificate` field embedded in signatures on metadata.

## Example: trust bundle structure

```json
{
  "trustBundles": {
    "spire-demo": {
      "bundleid": "spire-demo",
      "roots": [
        "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n"
      ],
      "intermediates": [
        "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n"
      ]
    }
  }
}
```

## Example: certificate constraints

```json
{
  "cert_constraints": [
    {
      "common_name": "*",
      "dns_names": [
        "*"
      ],
      "emails": [
        "*"
      ],
      "organizations": [
        "*"
      ],
      "trustBundleIds": [
        "spire-demo"
      ],
      "uris": [
        "spiffe://example.com/build"
      ]
    }
  ]
}
```

The SPIFFE URI example is one of the most useful mental bridges for this site:
it connects classic in-toto layout trust to workload identity systems.

## Why it matters

ITE-7 is the proposal that makes certificate-backed identity feel native to
in-toto:

- existing PKI can be reused,
- short-lived certificates become practical,
- functionary identity can be expressed as certificate attributes,
- and key rotation can happen without rewriting layouts for every leaf key.

## Implementation status in this workspace

The exact in-toto layout changes described by the draft are not exposed as a
standalone classic-layout verifier in this workspace. But the underlying ideas
are already present in the tools:

- `go-witness/policy/policy.go` stores policy roots, certificates, and intermediates.
- `go-witness/policy/constraints.go` validates certificate constraints.
- `go-witness/dsse/sign.go` embeds trust material for signers that implement
  `TrustBundler`.
- `go-witness/dsse/verify.go` supports verification with roots and intermediates.
- `go-witness/signer/spiffe/` provides SPIFFE-based signing.
- `go-witness/signer/fulcio/` provides Fulcio-based certificate issuance.
- `witness` exposes Fulcio certificate extension flags for verification.

So the concepts are implemented, but the exact draft schema is realized through
`witness` policy and DSSE verification rather than through the classic in-toto
layout extension described in ITE-7.

## Why this page matters for aflock and Witness readers

If you want to understand why [SPIFFE / SPIRE](/spiffe-spire/) and
[Sigstore](/sigstore/) fit naturally into attestation verification, ITE-7 is
the bridge document.

## Related ITEs

- [ITE-5](../ite-5/) for the envelope layer
- [ITE-6](../ite-6/) for the statement layer
- [ITE-10](../ite-10/) for future layout evolution
- [SPIFFE / SPIRE](/spiffe-spire/)
- [witness signing methods](/witness/signing-methods/)

## Repository anchors

- `ITE/ITE/7/README.adoc`
- `go-witness/policy/policy.go`
- `go-witness/policy/constraints.go`
- `go-witness/dsse/sign.go`
- `go-witness/dsse/verify.go`
- `go-witness/signer/spiffe/spiffe.go`
- `go-witness/signer/fulcio/fulcio.go`
- `witness/options/verify.go`
