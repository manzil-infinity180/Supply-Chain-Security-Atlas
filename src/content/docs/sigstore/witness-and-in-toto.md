---
title: Witness and in-toto
description: Connect Sigstore back to Witness, go-witness, aflock, DSSE, and in-toto so the ecosystem fits together cleanly.
---

The important connection is this: Sigstore is usually the signing and transport
layer around evidence, while in-toto and Witness focus on the evidence model and
policy logic.

## Division of responsibility

| Layer | Main job | Examples in this workspace |
| --- | --- | --- |
| Statement model | describe what happened | [in-toto attestations](/in-toto-attestations/) |
| Envelope format | sign arbitrary typed payloads | DSSE in `go-witness/dsse/` |
| Evidence generation | collect build and environment facts | [witness](/witness/) and [go-witness](/go-witness/) |
| Identity-backed signing | bind signatures to OIDC or workload identity | Sigstore Fulcio, SPIFFE |
| Policy evaluation | decide whether evidence is acceptable | `witness verify`, aflock policies, Rego |

## How Witness uses Sigstore concepts

Witness already ships the flags and verification hooks you need for Sigstore
style workflows.

### Signing with Fulcio

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-fulcio-url https://fulcio.sigstore.dev \
  --signer-fulcio-oidc-client-id sigstore \
  --signer-fulcio-oidc-issuer https://oauth2.sigstore.dev/auth \
  --timestamp-servers https://freetsa.org/tsr \
  -- go test ./...
```

That command shape is grounded in the workspace tutorial
`witness/docs/tutorials/sigstore-keyless.md`.

### Verifying Fulcio-backed policy constraints

```sh
witness verify \
  --policy policy.dsse.json \
  --attestations build.att.json \
  --policy-ca-roots ./fulcio-root.pem \
  --policy-ca-intermediates ./fulcio-intermediate.pem \
  --policy-fulcio-oidc-issuer https://oauth2.sigstore.dev/auth \
  --artifactfile ./dist/app
```

The relevant verification flags exist because Witness exposes Fulcio certificate
extensions as first-class policy constraints.

## How go-witness exposes the same ideas

The library view is almost identical:

- `go-witness/imports.go` registers the `fulcio` signer provider
- `go-witness/signer/fulcio/fulcio.go` acquires a certificate from Fulcio
- `go-witness/verify.go` exposes `VerifyWithPolicyFulcioCertExtensions`
- `go-witness/policy/constraints.go` checks the parsed Fulcio certificate data

That means an application embedding `go-witness` can apply the same policy model
that the CLI uses.

## Where cosign fits

Cosign is strongest when the artifact you care about already lives in an OCI
registry and you want signatures or attestations attached there.

Witness is strongest when you want:

- richer build-step evidence collection
- policy verification across multiple attestations
- attestors for Git, SBOMs, CI metadata, SARIF, VEX, Kubernetes manifests, and
  more

In many real systems, you do both:

- Witness generates evidence during build and test
- cosign signs or attaches release-facing evidence to container images
- admission or release policy verifies both identity and predicate content

## Where aflock fits

`aflock` is not a Sigstore signer today, but its policy model already includes a
`keyless` functionary type with issuer and subject fields. That matters because
it shows the same pattern spreading beyond ordinary build pipelines into AI
agent-policy verification.

If you understand Sigstore keyless verification, the matching logic in aflock
policies will feel familiar.

## Related sections

- [Keyless signing](../keyless-signing/)
- [Cosign workflows](../cosign-workflows/)
- [witness verify](/witness/witness-verify/)
- [go-witness signer registry](/go-witness/signers/)
- [aflock policy reference](/aflock/policy-reference/)

## Repository anchors

- `witness/docs/tutorials/sigstore-keyless.md`
- `witness/options/verify.go`
- `go-witness/imports.go`
- `go-witness/signer/fulcio/fulcio.go`
- `go-witness/verify.go`
- `go-witness/policy/constraints.go`
- `aflock/pkg/aflock/types.go`
