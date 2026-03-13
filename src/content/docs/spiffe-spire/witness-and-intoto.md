---
title: Witness signing and in-toto verification
description: Use SPIFFE-backed certificates with Witness, then verify those signatures through x509 policy constraints and ITE-7 style trust rules.
---

This page is for readers who want the practical CLI and policy flow.

## What Witness implements

The SPIFFE integration in this workspace lives in `go-witness`, and the
`witness` CLI exposes it through flags generated from the signer registry.

The core implementation is small and direct:

1. `go-witness/signer/spiffe/spiffe.go` registers a signer provider named
   `spiffe`
2. the provider requires a socket path
3. it calls `workloadapi.FetchX509Context`
4. it takes the default SVID from that context
5. it builds a `cryptoutil.Signer` from the SVID private key and certificate
   chain

That means Witness signs with the workload's short-lived x509 identity, not a
long-lived PEM file.

## CLI surface

The generated CLI docs in `witness/docs/commands.md` expose the SPIFFE signer
through:

```text
--signer-spiffe-socket-path
```

You can use that with both `witness run` and `witness sign`.

### Example: sign an execution attestation

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-spiffe-socket-path /tmp/spire-agent/public/api.sock \
  -- go build -o dist/app .
```

### Example: sign a file directly

```sh
witness sign \
  --infile policy.json \
  --outfile policy.dsse.json \
  --signer-spiffe-socket-path /tmp/spire-agent/public/api.sock
```

## Config file surface

The config schema in `witness/docs/concepts/config.md` mirrors the same option
as `spiffe-socket` under `run` and `sign`.

```yaml
run:
  outfile: build.att.json
  spiffe-socket: /tmp/spire-agent/public/api.sock
  step: build

sign:
  outfile: policy.dsse.json
  spiffe-socket: /tmp/spire-agent/public/api.sock
```

## What verification looks like

Witness policy verification is certificate-centric.

`witness/docs/concepts/policy.md` explains that a certificate constraint can
check:

- common name
- DNS names
- emails
- organizations
- URIs
- trusted roots

SPIFFE IDs are carried as certificate URIs, so the policy surface looks like:

```json
{
  "commonname": "*",
  "dnsnames": ["*"],
  "emails": ["*"],
  "organizations": ["*"],
  "uris": ["spiffe://example.com/step1"],
  "roots": ["*"]
}
```

That is the same verification idea described in [ITE-7](/in-toto-ites/ite-7/):

- trust bundles establish which roots are acceptable
- certificate constraints limit which functionaries may satisfy a step
- the certificate travels with the signature material so verification can happen
  later

## Why this matters for in-toto attestations

Witness emits DSSE-wrapped in-toto attestations. SPIFFE changes who the signer
is, not the attestation format.

So the flow is:

```text
SPIRE issues X.509 SVID
  -> Witness signs DSSE envelope
  -> envelope carries certificate material
  -> verifier checks signature, chain, URI constraints, and attestation policy
```

That is why SPIFFE and in-toto are complementary rather than competing ideas.

## When SPIFFE is a good fit for Witness

Use the SPIFFE signer when:

- your build jobs already run in a SPIRE-managed platform
- you want short-lived workload credentials instead of shipping a private key
- you want verification to talk about workload identity URIs rather than human
  usernames or raw key hashes

Use file keys, KMS, Vault, or Fulcio instead when your platform already centers
those trust systems. Witness supports all of them.

## One subtle but important detail

The SPIFFE signer provider itself does not decide policy. It only loads the
signing identity from the Workload API socket.

You still need verifier-side policy to say which certificate URIs and roots are
acceptable for a step.

## Related sections

- [witness signing methods](/witness/signing-methods/)
- [witness verify](/witness/witness-verify/)
- [in-toto ITE-7](/in-toto-ites/ite-7/)
- [Sigstore security model](/sigstore/security-model/)

## Primary source anchors

- `go-witness/signer/spiffe/spiffe.go`
- `go-witness/imports.go`
- `witness/docs/commands.md`
- `witness/docs/concepts/config.md`
- `witness/docs/concepts/policy.md`
- `witness/cmd/keyloader.go`
- `ITE/ITE/7/README.adoc`
