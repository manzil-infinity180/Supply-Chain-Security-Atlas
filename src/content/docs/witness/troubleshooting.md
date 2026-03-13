---
title: Troubleshooting
description: Common Witness failures and the fastest way to isolate signer, policy, and evidence problems.
---

Most Witness failures fall into one of four buckets:

- signer setup
- policy trust configuration
- subject selection
- environment-specific attestors

## Start with these checks

```sh
witness version
witness attestors list
witness policy check --verbose policy-signed.json
```

If the policy is malformed or expired, fix that first. Do not debug CI
metadata, KMS access, or Rego before the policy document itself validates.

## Common errors

### `failed to load any signers` or `no signers found`

You did not select a signer backend.

Use one of:

- `--signer-file-key-path`
- `--signer-fulcio-*`
- `--signer-spiffe-socket-path`
- `--signer-kms-ref`
- `--signer-vault-*`

### `only one signer is supported`

`cmd/run.go` and `cmd/sign.go` reject multiple active signer providers. Pick one
identity source per invocation.

### `config file ... does not exist`

This happens only when you explicitly pass `--config` to a missing file.

If you do not pass `--config`, missing `.witness.yaml` is not fatal.

### `must supply either a public key, CA certificates or a verifier`

`witness verify` cannot validate the policy signature yet.

Fix by adding one of:

- `--publickey`
- `--policy-ca-roots` and optional `--policy-ca-intermediates`
- `--verifier-kms-ref`

### `must either specify attestation file paths or enable archivista`

Verification has no evidence source. Either pass local DSSE envelopes with
`--attestations` or enable Archivista lookup.

### `at least one subject is required`

Witness verifies subjects, not just collections. Add:

- `--artifactfile`
- `--directory-path`
- or `--subjects`

### `failed to verify policy`

This is the broad failure wrapper from `cmd/verify.go`. Usually the detailed log
below it tells you which step was rejected and why.

Check:

- did the step name in the policy match the collection name?
- did the right functionary sign the collection?
- did the subject digest actually match the artifact you passed?
- did a Rego module reject the attestation body?

## Environment-specific attestor failures

Some attestors only make sense in the right environment:

- `git` expects a Git repository
- `github` expects GitHub Actions OIDC and environment variables
- `gitlab` expects GitLab CI variables and JWT material
- `aws` and `gcp-iit` expect cloud metadata services

If you are debugging locally, strip the command back to a known-good core:

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-file-key-path testkey.pem \
  --attestations environment \
  -- bash -lc 'printf "hello\n" > hello.txt'
```

Then add one attestor back at a time.

## Rego failures

`witness policy check --verbose` is the fastest way to catch syntax errors in
embedded Rego before a full verification run.

Good habits:

- keep one module focused on one attestation type
- use descriptive `deny[msg]` messages
- validate the unsigned JSON policy before you sign it

## CA and timestamp problems

When using Fulcio, Vault, or other x509-backed flows, make sure you provide the
right trust material at verification time:

- root CA certificates
- intermediate CA certificates when required
- timestamp authority certificates if timestamps were used

The policy checker also validates root certificates referenced by functionaries.

## Related sections

- [Installation](../installation/) for setup issues
- [witness verify](../witness-verify/) for trust and subject semantics
- [Signing methods](../signing-methods/) for backend-specific troubleshooting

## Repository anchors

- `witness/cmd/run.go`
- `witness/cmd/sign.go`
- `witness/cmd/verify.go`
- `witness/cmd/config.go`
- `witness/cmd/policy_check.go`
