---
title: Your First Attestation with Witness
description: Record a signed attestation, inspect the DSSE payload, sign a policy, and verify a local artifact end to end.
---

**Estimated time:** 20 minutes

**Audience:** readers who want one local loop before thinking about CI/CD,
Sigstore, or custom policy logic.

This is the shortest end-to-end exercise in the workspace:

```text
shell command
   |
   v
witness run
   |
   +--> signed attestation collection
   |
   +--> witness sign policy.json
   |
   v
witness verify artifact against policy
```

It follows the same flow documented in [Witness quick start](/witness/quick-start/)
and in `witness/docs/tutorials/getting-started.md`.

## Prerequisites

- Witness installed
- `git`
- `openssl`
- `jq`

Create a fresh demo repository:

```sh
mkdir witness-first-attestation
cd witness-first-attestation
git init
git config user.name "Witness Demo"
git config user.email "demo@example.com"
```

## 1. Generate a signing key pair

```sh
openssl genrsa -out testkey.pem 2048
openssl rsa -in testkey.pem -pubout -out testpub.pem
```

This key signs the attestation collection. In a production workflow, policy
signing is often controlled by a different authority.

## 2. Run a build step under Witness

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-file-key-path testkey.pem \
  -- bash -lc 'printf "hello from witness\n" > hello.txt'
```

What this records:

- `material` runs before the command and snapshots existing inputs
- `command-run` captures the executed command and exit status
- `product` records the created file
- `git` and `environment` also run by default in the CLI path

Those defaults come from `witness/cmd/run.go` and the option wiring it uses.

## 3. Inspect the DSSE envelope

```sh
jq -r '.payload' build.att.json | base64 -d | jq
```

Look for:

- `predicateType` set to the Witness collection predicate
- `predicate.name` set to `build`
- attestation entries for `material`, `command-run`, and `product`

## 4. Create a minimal policy

```sh
KEYID="$(openssl dgst -sha256 testpub.pem | awk '{print $2}')"
PUB_B64="$(openssl base64 -A -in testpub.pem)"

cat > policy.json <<EOF
{
  "expires": "2035-12-17T23:57:40Z",
  "steps": {
    "build": {
      "name": "build",
      "attestations": [
        { "type": "https://witness.dev/attestations/material/v0.1" },
        { "type": "https://witness.dev/attestations/command-run/v0.1" },
        { "type": "https://witness.dev/attestations/product/v0.1" }
      ],
      "functionaries": [
        { "type": "publickey", "publickeyid": "${KEYID}" }
      ]
    }
  },
  "publickeys": {
    "${KEYID}": {
      "keyid": "${KEYID}",
      "key": "${PUB_B64}"
    }
  }
}
EOF
```

This says:

- the `build` step must exist
- it must contain the listed predicate types
- it must be signed by the public key you just generated

## 5. Sign the policy

```sh
witness sign \
  --infile policy.json \
  --outfile policy-signed.json \
  --signer-file-key-path testkey.pem
```

Sanity-check the document before you verify:

```sh
witness policy check --verbose policy.json
witness policy check --verbose policy-signed.json
```

## 6. Verify the artifact

```sh
witness verify \
  --artifactfile hello.txt \
  --attestations build.att.json \
  --policy policy-signed.json \
  --publickey testpub.pem
```

Expected outcome:

- exit status `0`
- log output ending in `Verification succeeded`

## What this taught you

- Witness does not "trust the build" in the abstract. It verifies a subject
  digest.
- DSSE is used for both attestation collections and policy signing.
- The policy is the contract between evidence producers and evidence consumers.

## Next steps

- Move on to [Policy verification with OPA / Rego](../policy-verification-with-opa-rego/)
- Read [witness verify](/witness/witness-verify/) for the deeper verification
  flow
- Read [Signing methods](/witness/signing-methods/) for keyless and SPIFFE
  signers

## Repository anchors

- `witness/docs/tutorials/getting-started.md`
- `witness/cmd/run.go`
- `witness/cmd/sign.go`
- `witness/cmd/verify.go`
- `witness/cmd/policy_check.go`
- `witness/test/test.sh`
