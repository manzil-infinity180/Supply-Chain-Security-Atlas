---
title: sign and policy
description: Use witness sign for DSSE signing and witness policy check for policy validation.
---

This page covers the two commands that usually sit between `witness run` and
`witness verify`:

- `witness sign`
- `witness policy check`

## `witness sign`

`witness sign` wraps an arbitrary file in a DSSE envelope and signs it with the
selected signer backend.

```sh
witness sign \
  --infile policy.json \
  --outfile policy-signed.json \
  --signer-file-key-path testkey.pem
```

By default, the payload type is:

```text
https://witness.testifysec.com/policy/v0.1
```

That default matters because Witness policies are expected to be DSSE-wrapped
policy documents.

### When to change `--datatype`

Only change `--datatype` when you are signing something other than a Witness
policy document.

```sh
witness sign \
  --datatype text/plain \
  --infile build-metadata.txt \
  --outfile build-metadata.dsse.json \
  --signer-file-key-path testkey.pem
```

## Policy structure

The policy model described in `witness/docs/concepts/policy.md` centers on five
top-level areas:

- `expires`
- `steps`
- `publickeys`
- `roots`
- `timestampauthorities`

A practical mental model:

```text
policy
  |
  +-- who is trusted?         -> publickeys / roots
  +-- what steps must exist?  -> steps.<name>
  +-- what must each step say?-> attestations[].type + regopolicies[]
  +-- when does trust end?    -> expires
  +-- which timestamps count? -> timestampauthorities
```

Minimal single-step public-key policy:

```json
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
        { "type": "publickey", "publickeyid": "KEYID" }
      ]
    }
  },
  "publickeys": {
    "KEYID": {
      "keyid": "KEYID",
      "key": "BASE64_PEM"
    }
  }
}
```

## Embedding Rego

Rego lives inside `attestations[].regopolicies[]` and is base64-encoded in the
policy document.

```txt
package commandrun.cmd

deny[msg] {
  input.cmd != ["go", "build", "-o=dist/app", "."]
  msg := "unexpected cmd"
}
```

Use Rego for content-level claims such as:

- command line used
- exit code
- expected environment values
- CI metadata inside GitHub or GitLab attestors

## `witness policy check`

The `policy check` subcommand is newer than the original tutorial material in
the repo and is worth using routinely:

```sh
witness policy check --verbose policy.json
witness policy check --verbose policy-signed.json
```

Useful flags:

- `--verbose`: show validation progress
- `--quiet`: only emit failures
- `--json`: machine-readable output

Because `ReadPolicy()` in `cmd/policy_check.go` accepts either raw JSON or a
DSSE envelope, you can validate before and after signing.

## Timestamping policies

`witness sign` can attach RFC3161 timestamps:

```sh
witness sign \
  --infile policy.json \
  --outfile policy-signed.json \
  --signer-file-key-path testkey.pem \
  --timestamp-servers https://freetsa.org/tsr
```

If you do this, verification needs matching timestamp authority roots through
`--policy-timestamp-servers`.

## Related sections

- [witness verify](../witness-verify/) for evaluation semantics
- [Signing methods](../signing-methods/) for alternate signer backends
- [Quick start](../quick-start/) for the first signed policy flow

## Repository anchors

- `witness/cmd/sign.go`
- `witness/options/sign.go`
- `witness/cmd/policy.go`
- `witness/cmd/policy_check.go`
- `witness/docs/concepts/policy.md`
