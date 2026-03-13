---
title: Keyless signing
description: Understand how Sigstore keyless signing works, what Fulcio certs contain, and how to verify identity instead of trusting a long-lived key.
---

Keyless signing does not mean "no cryptography." It means "no long-lived
private key that the developer or CI system has to store forever."

In the Sigstore model, the signer still creates a key pair locally. The
difference is that the private key is ephemeral, and the public key is bound to
an OIDC identity by a short-lived Fulcio certificate.

## The flow

```text
signer starts a signing operation
       |
       +--> gets an OIDC token
       |     - browser login locally
       |     - CI-issued identity token in automation
       |
       +--> generates an ephemeral key pair
       |
       +--> sends:
       |     - OIDC token
       |     - public key
       |   to Fulcio
       |
       +--> Fulcio verifies the token and issues
       |    a short-lived certificate for that key
       |
       +--> signer signs the artifact or DSSE envelope
       |
       +--> signing evidence is uploaded to Rekor
       |    or saved in a Sigstore bundle
       |
       v
verifier checks certificate chain, identity, and log proof
```

## What Fulcio adds

Fulcio is the certificate authority in the public-good Sigstore deployment. The
important property is not just that it signs certificates, but that it binds a
certificate to an identity you can write policy against.

In practice, verifiers usually care about:

- the OIDC issuer
- the certificate subject or subject pattern
- provider-specific certificate extensions, such as CI workflow metadata

That is exactly why the Witness CLI exposes Fulcio-related verification flags
such as:

```text
--policy-fulcio-oidc-issuer
--policy-fulcio-build-trigger
--policy-fulcio-source-repository-digest
--policy-fulcio-run-invocation-uri
--policy-fulcio-source-repository-identifier
--policy-fulcio-source-repository-ref
```

Those flags come directly from `witness/options/verify.go`, and the underlying
checks are implemented in `go-witness/policy/constraints.go` using Fulcio's
certificate-extension parser.

## What to verify in a keyless workflow

Never stop at "the signature is valid." In keyless mode, a production verifier
should usually check all of the following:

1. The signature over the artifact or DSSE envelope is valid.
2. The certificate chains to the expected Fulcio root.
3. The certificate issuer matches the expected OIDC issuer.
4. The certificate subject or subject pattern matches the expected signer
   identity.
5. Rekor or the Sigstore bundle proves the event was logged.
6. If the payload is an attestation, the predicate type and content also match
   policy.

## Cosign verification example

The most common keyless verification pattern looks like this:

```sh
cosign verify \
  --certificate-identity-regexp 'https://github.com/acme/.+/.github/workflows/release.yml@refs/tags/.+' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/acme/api@sha256:0123456789abcdef
```

That is the right mental model for keyless verification:

- constrain the identity
- constrain the issuer
- verify the signature and attached trust evidence together

## Witness equivalent

The workspace uses the same model for step attestations. Witness can sign a DSSE
envelope with Fulcio instead of a file key:

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-fulcio-url https://fulcio.sigstore.dev \
  --signer-fulcio-oidc-client-id sigstore \
  --signer-fulcio-oidc-issuer https://oauth2.sigstore.dev/auth \
  -- go build ./...
```

Verification then constrains the identity-bearing certificate rather than a
long-lived public key:

```sh
witness verify \
  --policy policy.dsse.json \
  --attestations build.att.json \
  --policy-ca-roots ./fulcio-root.pem \
  --policy-ca-intermediates ./fulcio-intermediate.pem \
  --policy-fulcio-oidc-issuer https://oauth2.sigstore.dev/auth \
  --artifactfile ./dist/app
```

## How CI changes the flow

Local development usually uses an interactive browser login. CI is different:

- the runner requests an OIDC token from the CI platform
- the signer exchanges that token for a Fulcio certificate
- verification constrains the workflow identity, not a human email address

The `go-witness` Fulcio signer already contains GitHub Actions-specific logic
for fetching an OIDC token from `ACTIONS_ID_TOKEN_REQUEST_URL` when
`GITHUB_ACTIONS=true`, which is the repository-level implementation detail
behind that pattern.

## When keyless is a good fit

Use keyless signing when:

- you already trust an OIDC identity provider
- you want to avoid distributing private keys into CI
- you care more about signer identity and workflow provenance than about a
  single stable key fingerprint

Prefer KMS, HSM, or file-key workflows when:

- you need fully offline signing
- your compliance regime requires fixed signing keys
- your environment cannot reach Fulcio or Rekor and you do not manage a private
  Sigstore deployment

## Related sections

- [Cosign workflows](../cosign-workflows/)
- [Rekor and transparency](../rekor-and-transparency/)
- [Witness and in-toto](../witness-and-in-toto/)
- [witness signing methods](/witness/signing-methods/)

## Repository anchors

- `witness/options/verify.go`
- `go-witness/signer/fulcio/fulcio.go`
- `go-witness/signer/fulcio/github.go`
- `go-witness/policy/constraints.go`
- `witness/docs/tutorials/sigstore-keyless.md`
