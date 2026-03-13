---
title: Sigstore
description: Learn the Sigstore ecosystem from first principles, then connect it back to Witness, in-toto, Kubernetes admission, and production CI/CD.
---

Sigstore is the identity-backed signing stack that shows up most often in modern
software supply chain security work. It combines three ideas:

- `cosign` signs and verifies blobs, container images, and attestations.
- `Fulcio` issues short-lived signing certificates tied to an OIDC identity.
- `Rekor` records signing events in an append-only transparency log.

If you can explain how those three fit together, you are already most of the
way to understanding the keyless workflows used by Witness, GitHub artifact
attestations, and Kubernetes admission policies.

## What makes Sigstore different

Traditional code-signing usually starts with a long-lived private key. Sigstore
can still work that way, but its distinctive feature is keyless signing:

| Model | Identity source | Key lifetime | Main operational burden |
| --- | --- | --- | --- |
| Traditional signing | whoever controls the private key file, HSM, or KMS key | months to years | protecting and rotating long-lived signing keys |
| Sigstore keyless | an OIDC identity bound into a Fulcio certificate | minutes | verifying issuer, subject, and transparency-log evidence |

That trade moves effort away from secret distribution and toward policy:

- Which issuer is allowed to sign?
- Which workflow, email, or workload identity is allowed to sign?
- Was the signing event logged and verifiable?

## Architecture at a glance

```text
artifact or image
       |
       v
   cosign / witness
       |
       +--> obtains OIDC identity
       |     - browser login
       |     - GitHub Actions token
       |     - another trusted issuer
       |
       +--> generates ephemeral signing key
       |
       +--> asks Fulcio for a short-lived x509 certificate
       |     bound to that identity
       |
       +--> signs the artifact or DSSE envelope
       |
       +--> records proof in Rekor
       |     or stores a Sigstore bundle for later verification
       |
       v
verifier checks:
  1. signature
  2. certificate chain and identity constraints
  3. Rekor or bundle evidence
  4. optional attestation or policy rules
```

## Why this matters in this workspace

Sigstore is not a side topic here. The repositories in this workspace already
depend on the same trust model:

- [witness](/witness/) exposes Fulcio signer flags and verification flags for
  Fulcio certificate extensions.
- [go-witness](/go-witness/) registers a `fulcio` signer provider and parses
  Fulcio certificate metadata during verification.
- [aflock](/aflock/) policy examples already allow keyless functionaries with
  issuer and subject constraints, even though the current signing path is
  primarily SPIFFE-based.
- [in-toto ITE-7](/in-toto-ites/ite-7/) covers x509-backed signing patterns
  that fit naturally with Fulcio-issued certificates.

## Read this section in order

- [Keyless signing](./keyless-signing/) explains the Fulcio + OIDC flow and how
  identity becomes part of verification.
- [Cosign workflows](./cosign-workflows/) covers the day-to-day commands people
  actually expect you to know.
- [Rekor and transparency](./rekor-and-transparency/) explains what the log
  proves and what it does not prove.
- [Witness and in-toto](./witness-and-in-toto/) maps Sigstore concepts onto the
  repos in this workspace.
- [Policy Controller](./policy-controller/) shows how Kubernetes admission uses
  signatures and attestations.
- [CI/CD patterns](./ci-cd/) turns the concepts into repeatable pipeline
  designs.
- [Security model](./security-model/) covers threat-model thinking and compares
  Sigstore to long-lived key workflows.

## Job-ready checklist

If you are interviewing or designing a production rollout, make sure you can
answer these without hand-waving:

- the difference between `cosign sign`, `attest`, `verify`, and
  `verify-attestation`
- why keyless verification must constrain both certificate identity and OIDC
  issuer
- what Rekor adds beyond plain signature verification
- how DSSE and in-toto attestations relate to cosign and Witness
- where Kubernetes admission fits in the verification chain
- when you still want KMS or file keys instead of keyless signing

## Related sections

- [witness signing methods](/witness/signing-methods/)
- [witness verify](/witness/witness-verify/)
- [go-witness signer registry](/go-witness/signers/)
- [in-toto attestations](/in-toto-attestations/)
- [SPIFFE / SPIRE](/spiffe-spire/)

## Primary source anchors

Official Sigstore references used for this section:

- [Sigstore quickstart and cosign docs](https://docs.sigstore.dev/quickstart/quickstart-cosign/)
- [Cosign verify and attest docs](https://docs.sigstore.dev/cosign/verifying/verify/)
- [Fulcio overview](https://docs.sigstore.dev/about/faq/#what-is-sigstore)
- [Rekor overview](https://docs.sigstore.dev/logging/overview/)
- [Policy Controller overview](https://docs.sigstore.dev/policy-controller/overview/)

Workspace anchors used to connect those concepts back to real code:

- `witness/INSTALL.md`
- `witness/docs/tutorials/sigstore-keyless.md`
- `witness/options/verify.go`
- `go-witness/signer/fulcio/fulcio.go`
- `go-witness/policy/constraints.go`
- `aflock/pkg/aflock/types.go`
