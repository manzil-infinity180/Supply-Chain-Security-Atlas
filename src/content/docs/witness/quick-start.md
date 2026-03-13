---
title: Quick start
description: Record your first attestation, sign a policy, and verify a local artifact in a few minutes.
---

This walkthrough is the smallest end-to-end Witness loop that still teaches the
important pieces:

1. generate a signing key
2. record an attestation collection for a build step
3. sign a policy
4. verify the produced artifact against that policy

It follows the same command model exercised by `witness/test/test.sh`, but uses
a smaller local example.

## What you will build

```text
local shell command
      |
      v
witness run
  - material attestor
  - command-run attestor
  - product attestor
  - default environment + git attestors
      |
      v
build.att.json (signed DSSE envelope)
      |
      +--> witness sign policy.json -> policy-signed.json
      |
      v
witness verify hello.txt against the signed policy
```

## Prerequisites

- Witness installed
- `git`
- `openssl`
- `jq`

Create a fresh workspace and initialize Git. The default `git` attestor expects
to run inside a repository.

```sh
mkdir witness-quickstart
cd witness-quickstart
git init
git config user.name "Witness Demo"
git config user.email "demo@example.com"
```

## 1. Generate a key pair

This key signs both the attestation and the demo policy. In production, policy
signing is often owned by a different authority.

```sh
openssl genrsa -out testkey.pem 2048
openssl rsa -in testkey.pem -pubout -out testpub.pem
```

## 2. Run a build step under Witness

This command creates `hello.txt` and writes a signed attestation collection to
`build.att.json`.

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-file-key-path testkey.pem \
  -- bash -lc 'printf "hello from witness\n" > hello.txt'
```

What happened:

- `material` ran before the shell command and captured the starting directory state
- `command-run` captured the executed command and exit status
- `product` recorded the new or changed files
- `environment` and `git` ran because they are the default extra attestors in `options/run.go`

## 3. Inspect the envelope payload

Witness writes JSON for a DSSE envelope. The payload is base64-encoded.

```sh
jq -r '.payload' build.att.json | base64 -d | jq
```

Look for:

- `predicateType: "https://witness.testifysec.com/attestation-collection/v0.1"`
- `predicate.name: "build"`
- attestation entries for `material`, `command-run`, and `product`

## 4. Create a minimal policy

Compute the public key ID and embed the public key into a policy JSON document.

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

## 5. Sign the policy

```sh
witness sign \
  --infile policy.json \
  --outfile policy-signed.json \
  --signer-file-key-path testkey.pem
```

You can sanity-check the policy structure before or after signing:

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

Expected result:

- exit status `0`
- log output ending with `Verification succeeded`

## What to learn from this example

- Policies do not need to list every attestation that exists in a collection.
  This demo records `environment` and `git`, but only requires the core build
  predicates.
- Verification is subject-based. Here the subject is `hello.txt`, and Witness
  computes its digest before matching it against attestation collections.
- DSSE signing is used both for attestation collections and for the policy
  document itself.

## Next steps

- Add Rego constraints with [witness verify](../witness-verify/)
- Switch to keyless or SPIFFE-backed identities with [signing methods](../signing-methods/)
- Store attestations remotely with [Archivista](../archivista/)

## Repository anchors

- `witness/cmd/run.go`
- `witness/cmd/sign.go`
- `witness/cmd/verify.go`
- `witness/cmd/policy_check.go`
- `witness/test/test.sh`
