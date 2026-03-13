---
title: Full CI/CD Pipeline with Witness and Cosign
description: Build a practical release pipeline that records in-toto evidence with Witness, distributes signatures with cosign, and verifies before promotion.
---

**Estimated time:** 45 minutes

**Audience:** engineers who already understand the local Witness loop and want a
pipeline shape they can move into GitHub Actions or another CI system.

This tutorial combines two complementary ideas:

- Witness captures *how* the artifact was produced.
- cosign signs the artifact or image so downstream systems can verify what they
  are pulling.

## The pipeline shape

```text
commit pushed
   |
   v
CI build job
   |
   +--> witness run wraps build command
   |      - git metadata
   |      - CI metadata
   |      - environment metadata
   |      - product digest
   |
   +--> artifact published
   +--> cosign signs artifact or image
   |
   v
promotion / release job
   |
   +--> witness verify policy
   +--> cosign verify signature
   |
   v
deploy
```

## What you are building

By the end of this page you should be able to explain why a production pipeline
often needs both:

- attestation verification for build evidence
- signature verification for distribution integrity

## Step 1: record the build with Witness

The Witness repo already uses a reusable workflow wrapper in
`witness/.github/workflows/witness.yml`. The core shape is:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd
      - uses: actions/setup-go@4b73464bb391d4059bd26b0524d20df3927bd417
        with:
          go-version-file: go.mod
      - uses: testifysec/witness-run-action@7aa15e327829f1f2a523365c564c948d5dde69dd
        with:
          witness-install-dir: /usr/local/bin
          version: 0.9.1
          step: build
          attestations: "git github environment"
          command: /bin/sh -c "go build -o dist/app ./..."
```

What that buys you:

- the `github` attestor captures workflow metadata
- the `git` attestor captures repository state
- the `environment` attestor captures runtime context
- the collection is signed as one DSSE envelope

## Step 2: sign the released artifact with cosign

Once the build output exists, sign the artifact that another system will
consume. A blob example is the smallest portable drill:

```sh
cosign sign-blob \
  --key cosign.key \
  --output-signature dist/app.sig \
  --output-certificate dist/app.pem \
  dist/app
```

If you are shipping a container image instead of a raw binary, switch to the
image-oriented flows covered in [Cosign workflows](/sigstore/cosign-workflows/).

## Step 3: verify before promotion

The promotion job should verify both evidence layers:

```sh
witness verify \
  --artifactfile dist/app \
  --attestations build.att.json \
  --policy policy-signed.json \
  --publickey witness-policy-pub.pem

cosign verify-blob \
  --key cosign.pub \
  --signature dist/app.sig \
  --certificate dist/app.pem \
  dist/app
```

Read those checks differently:

- `witness verify` asks whether the artifact came from an acceptable build
  process
- `cosign verify-blob` asks whether the distributed bytes match the signature
  you trust

## A local smoke-test sequence

This is the same logic as CI, but run locally so you can see the moving parts:

```sh
openssl genrsa -out witness-build-key.pem 2048
openssl rsa -in witness-build-key.pem -pubout -out witness-build-pub.pem
cosign generate-key-pair

mkdir -p dist

witness run \
  --step build \
  --outfile build.att.json \
  --signer-file-key-path witness-build-key.pem \
  -- bash -lc 'go build -o dist/app .'

cosign sign-blob \
  --key cosign.key \
  --output-signature dist/app.sig \
  --output-certificate dist/app.pem \
  dist/app
```

Before you run promotion verification, create and sign `policy-signed.json`
using the same pattern from
[Your first attestation with Witness](../your-first-attestation-with-witness/).
In a production rollout, that policy is usually signed by a separate authority.

## Policy advice for pipeline rollouts

- Keep Witness step names stable. Policies are easier to read when step names
  map cleanly to CI jobs.
- Use the CI-specific attestor that matches your runtime: `github`, `gitlab`,
  or `jenkins`.
- Separate the policy-signing authority from the build-signing identity when
  you can.
- Do not stop at signature validation. A good release gate verifies both the
  signature and the build evidence.

## Where rookery fits

If you want a smaller, opinionated binary for a specific environment, rookery
lets you compile only the attestors and signers you need. That matters when a
CI runner should expose only a narrow plugin set.

See [Custom attestors and signer plugins](../custom-attestors-and-signer-plugins/)
and [Rookery custom binary builder](/rookery/custom-binary-builder/).

## Next steps

- Continue to [Policy verification with OPA / Rego](../policy-verification-with-opa-rego/)
- Read [Witness CI/CD integration](/witness/ci-cd/)
- Read [Sigstore in CI/CD](/sigstore/ci-cd/)

## Repository anchors

- `witness/.github/workflows/witness.yml`
- `witness/.github/workflows/release.yml`
- `witness/cmd/run.go`
- `witness/cmd/verify.go`
- `witness/docs/tutorials/sigstore-keyless.md`
