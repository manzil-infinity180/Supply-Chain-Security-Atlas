---
title: What Is SSCS and Why Should I Care?
description: A beginner-friendly explanation of software supply chain security, why teams adopt it, and the smallest practical loop you need to understand.
---

**Estimated time:** 30 minutes

**Audience:** developers, platform engineers, and security engineers who already
ship software but are new to attestations and verification.

## The short version

Software supply chain security is about answering three operational questions:

1. what did we build?
2. how was it produced?
3. should we trust it enough to release or run it?

Classic application security tools mostly inspect code and dependencies.
Software supply chain security adds evidence about the build and release path
itself.

## The release loop you actually need

```text
source code
   |
   v
build step
   |
   +--> artifact
   +--> attestation (what happened)
   +--> signature (who signed it)
   |
   v
verification policy
   |
   v
release decision
```

If you remember only one thing, remember this:

- a **hash** says "these bytes are the same"
- a **signature** says "this key approved those bytes"
- an **attestation** says "here is a signed statement about how those bytes were produced"
- a **policy** says "this is the evidence I require before release"

## Why teams adopt SSCS

The repos in this workspace show different slices of the same problem:

- `witness` records and verifies in-toto attestations for build steps
- `go-witness` exposes the same model as a Go API
- `rookery` turns that model into a plugin-oriented binary assembly workflow
- `aflock` applies the same ideas to AI agents: identity, constraints,
  attestations, and delegated work

The goal is not "more security paperwork". The goal is making build and release
claims testable.

## The smallest practical drill

These are the five commands worth memorizing. They match the tools used in the
later tutorials on this site.

```sh
go build -o dist/app .
witness run --step build --outfile build.att.json --signer-file-key-path testkey.pem -- go build -o dist/app .
witness sign --infile policy.json --outfile policy-signed.json --signer-file-key-path policy-key.pem
witness verify --artifactfile dist/app --attestations build.att.json --policy policy-signed.json --publickey policy-pub.pem
cosign sign-blob --key cosign.key dist/app
```

Read that sequence as:

- produce an artifact
- record how it was produced
- sign the policy that defines trust
- verify the artifact against that policy
- optionally add Sigstore-style distribution signatures for downstream consumers

## Where the trust comes from

There are three common trust anchors in this workspace:

| Trust anchor | Where it appears | What it proves |
| --- | --- | --- |
| Public keys | [Witness](/witness/quick-start/), [go-witness](/go-witness/core-api/) | A known key signed an attestation or policy. |
| Keyless certificates | [Sigstore](/sigstore/keyless-signing/) | An OIDC identity obtained a short-lived cert and signed evidence. |
| Workload identity | [SPIFFE / SPIRE](/spiffe-spire/) and [aflock](/aflock/agent-identity/) | A runtime workload identity, not a human-managed file key, signed evidence. |

## What changes in practice

Without SSCS, a release decision is often:

- "CI passed"
- "the artifact looks right"
- "we trust the pipeline"

With SSCS, the decision becomes:

- the artifact digest matches the signed subject
- the required build steps exist
- the right functionaries signed those steps
- the attestation content satisfies policy

That difference matters when you investigate a compromise, prove compliance, or
let another team consume your artifacts.

## Common beginner mistakes

- Treating a checksum as if it were a build provenance record.
- Signing artifacts but never verifying signatures in deployment paths.
- Emitting attestations without writing a policy that consumes them.
- Writing policy before deciding which build identities are actually trusted.

## Where to go next

- Continue to [Your first attestation with Witness](../your-first-attestation-with-witness/)
- Read [in-toto attestations](/in-toto-attestations/) if you want more theory
- Jump to [aflock](/aflock/) if your main interest is agent policy and
  delegated execution

## Repository anchors

- `witness/README.md`
- `go-witness/intoto/statement.go`
- `attestation/README.md`
- `aflock/README.md`
