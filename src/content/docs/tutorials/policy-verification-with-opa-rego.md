---
title: Policy Verification with OPA / Rego
description: Write a small Rego module, embed it into a Witness policy, and turn an attestation into a release gate.
---

**Estimated time:** 35 minutes

**Audience:** readers who already have a signed attestation and want to enforce
content rules instead of checking only that a step exists.

This page is grounded in:

- `witness/docs/tutorials/artifact-policy.md`
- `go-witness/policy/rego.go`
- `go-witness/policy/rego_test.go`

## What Rego is doing here

Witness uses Rego to evaluate the JSON content of an attestation. That means
you can ask questions such as:

- did the command exit successfully?
- did the build run on the expected branch?
- did the CI workflow name match what we trust?

## Step 1: create a tiny build and attestation

This first command produces `hello.txt` and records a signed collection:

```sh
openssl genrsa -out buildkey.pem 2048
openssl rsa -in buildkey.pem -pubout -out buildpub.pem

witness run \
  --step build \
  --outfile build-attestation.json \
  --signer-file-key-path buildkey.pem \
  -- bash -lc "echo 'hello' > hello.txt"
```

## Step 2: write the Rego module

Create `command-run.rego`:

```txt
package commandrun

deny[msg] {
  input.exitcode != 0
  msg := "exitcode not 0"
}

deny[msg] {
  input.cmd[2] != "echo 'hello' > hello.txt"
  msg := "cmd not correct"
}
```

This policy does two checks:

- the command must exit with `0`
- the third element in the captured command array must match the shell fragment
  you expected

That second check is intentionally specific so you can see how attestation data
maps into Rego input.

## Step 3: embed the module into a Witness policy

Witness policies store Rego modules as base64-encoded strings. Build the policy
from the module and your public key:

```sh
KEYID="$(openssl dgst -sha256 buildpub.pem | awk '{print $2}')"
PUB_B64="$(openssl base64 -A -in buildpub.pem)"
REGO_B64="$(openssl base64 -A -in command-run.rego)"

cat > policy.json <<EOF
{
  "expires": "2035-12-17T23:57:40Z",
  "steps": {
    "build": {
      "name": "build",
      "attestations": [
        { "type": "https://witness.dev/attestations/material/v0.1" },
        { "type": "https://witness.dev/attestations/product/v0.1" },
        {
          "type": "https://witness.dev/attestations/command-run/v0.1",
          "regoPolicies": [
            { "name": "expected-command", "module": "${REGO_B64}" }
          ]
        }
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

## Step 4: sign and lint the policy

```sh
witness sign \
  --infile policy.json \
  --outfile policy-signed.json \
  --signer-file-key-path buildkey.pem

witness policy check --verbose policy.json
witness policy check --verbose policy-signed.json
```

`policy check` is worth using every time you edit embedded Rego. It catches:

- malformed JSON
- expired policy timestamps
- invalid Rego modules
- broken functionary references

## Step 5: verify the artifact

```sh
witness verify \
  --artifactfile hello.txt \
  --attestations build-attestation.json \
  --policy policy-signed.json \
  --publickey buildpub.pem
```

If the command text or exit code does not match, verification fails.

## What to inspect when debugging

Decode the attestation before you rewrite policy:

```sh
jq -r '.payload' build-attestation.json | base64 -d | jq
```

Look at the `command-run` predicate and compare its field names to what your
Rego module reads. Rego cannot save you from checking the wrong field.

## A good first production pattern

Start with narrow rules that only prove one or two high-value facts:

- command exit status
- branch or repository identity
- CI workflow identity

Do not begin with a giant policy bundle. You will spend more time debugging the
policy than learning the verification model.

## Next steps

- Read [witness verify](/witness/witness-verify/) for the deeper flow
- Read [go-witness sources and policy](/go-witness/sources-and-policy/)
- Continue to [Custom attestors and signer plugins](../custom-attestors-and-signer-plugins/)

## Repository anchors

- `witness/docs/tutorials/artifact-policy.md`
- `go-witness/policy/rego.go`
- `go-witness/policy/rego_test.go`
- `witness/cmd/policy_check.go`
