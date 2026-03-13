---
title: Signer plugins
description: Reference for rookery signer modules, including direct signers and KMS-backed signers.
---

`cilock` loads signer providers from the same registry pattern as attestors.
Current `run` and `sign` code paths accept exactly one signer at a time, so the
main question is which provider you want behind that single signing step.

## Selector patterns

There are two signer styles in the repo:

- direct providers such as `file`, `fulcio`, `spiffe`, and `vault`
- the generic `kms` provider, which dispatches to provider modules by URI
  scheme such as `awskms://` or `hashivault://`

The CLI flag shapes come directly from registry registration:

- signer flags: `--signer-<provider>-<option>`
- verifier flags: `--verifier-<provider>-<option>`

## Direct providers

| Provider | Typical selector | What it does |
| --- | --- | --- |
| `debug` | `--signer-debug-enabled` | Generates an ephemeral ECDSA P-256 key for tests and local smoke runs. Not for production. |
| `file` | `--signer-file-key-path <path>` | Loads a local private key, with optional cert and intermediate chain files. |
| `fulcio` | `--signer-fulcio-url <url>` | Performs Sigstore-style keyless signing through Fulcio using OIDC. |
| `spiffe` | `--signer-spiffe-socket-path <path>` | Fetches an X.509 SVID from the SPIFFE Workload API and signs with that workload identity. |
| `vault` | `--signer-vault-url <url>` | Requests a short-lived certificate from Vault PKI, then signs locally with the issued keypair. |

Common file-signer flags from source:

- `--signer-file-key-path`
- `--signer-file-key-passphrase`
- `--signer-file-key-passphrase-path`
- `--signer-file-cert-path`
- `--signer-file-intermediate-paths`

Common Fulcio flags from source:

- `--signer-fulcio-url`
- `--signer-fulcio-oidc-issuer`
- `--signer-fulcio-oidc-client-id`
- `--signer-fulcio-token`
- `--signer-fulcio-token-path`

Common Vault PKI flags from source:

- `--signer-vault-url`
- `--signer-vault-pki-secrets-engine-path`
- `--signer-vault-token`
- `--signer-vault-namespace`
- `--signer-vault-role`
- `--signer-vault-commonname`

## KMS-backed providers

All KMS-backed signers route through the `kms` provider in
`attestation/signer/kms/signerprovider.go`. The critical flag is the reference
URI:

```bash
--signer-kms-ref <scheme-specific-uri>
```

The scheme determines which provider module actually handles the request.

| Backing module | Example `--signer-kms-ref` | Provider-specific notes |
| --- | --- | --- |
| `plugins/signers/kms/aws` | `awskms:///alias/my-key` | Supports remote verification, optional credentials/config/profile settings, and local or remote verify flows. |
| `plugins/signers/kms/azure` | `azurekms://my-vault.vault.azure.net/my-key` | Supports Azure Key Vault references and a remote-verify toggle. |
| `plugins/signers/kms/gcp` | `gcpkms://projects/p/locations/l/keyRings/r/cryptoKeys/k/cryptoKeyVersions/1` | Supports a credentials-file option and key version selection. |
| `plugins/signers/vault-transit` | `hashivault://my-key` | Uses Vault Transit through the KMS multiplexer and provider-specific auth options. |

Examples of provider-specific flag prefixes:

- AWS KMS: `--signer-kms-aws-...`
- Azure KMS: `--signer-kms-azure-...`
- GCP KMS: `--signer-kms-gcp-...`
- Vault Transit: `--signer-kms-hashivault-...`

Verification uses the same shape with `--verifier-...` prefixes.

## Example commands

Fast local smoke test with the debug signer:

```bash
./bin/cilock run \
  --step build \
  --outfile build.json \
  --signer-debug-enabled \
  -- go test ./...
```

File-based signing of an existing policy envelope:

```bash
./bin/cilock sign \
  --infile policy.json \
  --outfile policy.dsse.json \
  --signer-file-key-path signing-key.pem \
  --signer-file-cert-path signing-cert.pem
```

SPIFFE-backed run signing:

```bash
./bin/cilock run \
  --step build \
  --outfile build.json \
  --signer-spiffe-socket-path unix:///tmp/spire-agent/public/api.sock \
  -- go build ./...
```

AWS KMS signing through the generic KMS provider:

```bash
./bin/cilock run \
  --step build \
  --outfile build.json \
  --signer-kms-ref awskms:///alias/ci-signing-key \
  --signer-kms-aws-remote-verify \
  -- go build ./...
```

## Production guidance

- Use `debug` only for tests and documentation smoke runs.
- Use `file` when you already manage PEM material and trust bundles.
- Use `fulcio` for Sigstore-style keyless workflows.
- Use `spiffe` when workload identity is already present through
  [SPIFFE / SPIRE](/spiffe-spire/).
- Use a KMS or Vault-backed provider when private keys must remain off-host.

## Repository anchors

- `rookery/attestation/signer/registry.go`
- `rookery/attestation/signer/kms/signerprovider.go`
- `rookery/plugins/signers/file/`
- `rookery/plugins/signers/fulcio/`
- `rookery/plugins/signers/spiffe/`
- `rookery/plugins/signers/vault/`
- `rookery/plugins/signers/vault-transit/`
- `rookery/plugins/signers/kms/`
