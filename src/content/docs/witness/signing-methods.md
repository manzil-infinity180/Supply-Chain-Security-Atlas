---
title: Signing methods
description: Choose between file keys, Fulcio keyless, SPIFFE, KMS, and Vault when signing with Witness.
---

Witness discovers signer and verifier backends from the flags you set. The
provider loading logic in `cmd/keyloader.go` means:

- signer flags starting with `--signer-...` select a signer backend
- verifier flags starting with `--verifier-...` select a verifier backend
- only one signer is supported for a `run` or `sign` invocation

## File keys

This is the simplest and most common local setup.

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-file-key-path testkey.pem \
  -- go build -o dist/app .
```

Optional extras:

- `--signer-file-cert-path`
- `--signer-file-intermediate-paths`
- `--signer-file-key-passphrase`
- `--signer-file-key-passphrase-path`

Use file keys when:

- you are learning Witness
- you need air-gapped workflows
- you have an existing x509 or PEM-based key distribution process

## Sigstore Fulcio keyless

Witness ships a Fulcio signer provider and tutorial material for browser-based
OIDC login.

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-fulcio-url https://fulcio.sigstore.dev \
  --signer-fulcio-oidc-client-id sigstore \
  --signer-fulcio-oidc-issuer https://oauth2.sigstore.dev/auth \
  --timestamp-servers https://freetsa.org/tsr \
  -- go build -o dist/app .
```

Use this when:

- you want short-lived signing identities
- you do not want to manage a long-lived private key on disk
- your CI platform can supply an OIDC identity

For verification, constrain the policy with Fulcio issuer and certificate
attributes in [witness verify](../witness-verify/).

## SPIFFE / SPIRE

Witness also supports workload-identity signing through the SPIFFE Workload API.

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-spiffe-socket-path /tmp/spire-agent/public/api.sock \
  -- go build -o dist/app .
```

Use this when:

- build jobs run in an environment already managed by SPIRE
- you want workload identity instead of static keys
- your policy should bind a step to a SPIFFE ID through certificate URI checks

See [SPIFFE / SPIRE](/spiffe-spire/) for the identity background.

## KMS backends

Witness registers a generic `kms` provider plus cloud-specific options. The repo
explicitly wires in AWS and GCP KMS providers from `cmd/root.go`.

### AWS KMS

```sh
witness sign \
  --infile policy.json \
  --outfile policy-signed.json \
  --signer-kms-ref awskms:///1234abcd-12ab-34cd-56ef-1234567890ab \
  --signer-kms-aws-profile prod \
  --signer-kms-hashType sha256
```

### GCP KMS

```sh
witness sign \
  --infile policy.json \
  --outfile policy-signed.json \
  --signer-kms-ref gcpkms:///projects/demo/locations/global/keyRings/ring/cryptoKeys/key \
  --signer-kms-gcp-credentials-file ./gcp-creds.json \
  --signer-kms-hashType sha256
```

Verification can mirror these via `--verifier-kms-*` flags.

## Vault PKI

The Vault signer generates a certificate through a Vault PKI role and signs
with the resulting key material.

```sh
witness sign \
  --infile policy.json \
  --outfile policy-signed.json \
  --signer-vault-url https://vault.example.com \
  --signer-vault-token "$VAULT_TOKEN" \
  --signer-vault-role witness-policy \
  --signer-vault-commonname witness-policy-admin
```

Use this when your organization already treats Vault as the policy or release
signing control plane.

## Timestamp authorities

`run` and `sign` both support:

```text
--timestamp-servers
```

That adds RFC3161 timestamps to the DSSE signature flow. During verification,
the corresponding policy trust roots are supplied with:

```text
--policy-timestamp-servers
```

## Which signer should you choose?

| Method | Good default for | Main tradeoff |
| --- | --- | --- |
| File key | local dev and air-gapped workflows | you manage private keys yourself |
| Fulcio keyless | modern CI with OIDC | depends on external identity and trust services |
| SPIFFE | platform teams with SPIRE | requires workload API plumbing |
| KMS | cloud-native orgs with managed keys | backend-specific setup and permissions |
| Vault | enterprises with central PKI workflows | more moving parts than file keys |

## Related sections

- [witness run](../witness-run/) for signer usage during step execution
- [sign and policy](../sign-and-policy/) for standalone signing
- [witness verify](../witness-verify/) for verifier-side trust configuration
- [Sigstore](/sigstore/) and [SPIFFE / SPIRE](/spiffe-spire/) for background

## Repository anchors

- `witness/cmd/keyloader.go`
- `witness/options/signers.go`
- `witness/options/verifiers.go`
- `go-witness/signer/file/`
- `go-witness/signer/fulcio/`
- `go-witness/signer/spiffe/`
- `go-witness/signer/kms/`
- `go-witness/signer/vault/`
