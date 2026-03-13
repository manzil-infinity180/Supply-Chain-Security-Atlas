---
title: witness verify
description: How Witness loads policy, resolves subjects, verifies signatures, and evaluates Rego.
---

`witness verify` turns stored evidence into a release decision. It checks that
attestation collections exist for the artifact you care about, that the right
functionaries signed them, and that any embedded Rego policies pass.

## Verification flow

```text
signed policy + verifier material
            |
            v
 load policy envelope or raw JSON
            |
            v
 verify policy signature
  - public key
  - x509 roots + intermediates
  - KMS verifier
            |
            v
 compute subject digests
  - artifact file
  - directory
  - additional subject hashes
            |
            v
 load attestation collections
  - local files
  - Archivista
            |
            v
 witness.Verify(...)
  - functionary match
  - timestamp authority checks
  - artifactsFrom consistency
  - Rego evaluation
```

This is exactly how `cmd/verify.go` is structured.

## Basic shape

```sh
witness verify \
  --artifactfile dist/app \
  --attestations build.att.json \
  --policy policy-signed.json \
  --publickey policy-pub.pem
```

Minimum inputs:

- a policy file via `--policy`
- at least one subject via `--artifactfile` or `--subjects`
- policy verification material: `--publickey`, CA roots, or a verifier backend
- attestation files, unless you enable Archivista

## Subject selection

Witness does not verify "a build" in the abstract. It verifies subjects by
digest.

Use one of these:

- `--artifactfile path/to/file`
- `--directory-path path/to/directory`
- `--subjects <sha256 digest>`

`cmd/verify.go` computes SHA-256 digests for files and directories, then uses
those digests to locate matching evidence.

## Policy verification choices

### Public key policy signer

```sh
witness verify \
  --artifactfile hello.txt \
  --attestations build.att.json \
  --policy policy-signed.json \
  --publickey testpub.pem
```

### X.509 or Fulcio-backed policy signer

```sh
witness verify \
  --artifactfile test.txt \
  --attestations test.json \
  --policy fulcio-policy-presigned.json \
  --policy-ca-roots fulcio.pem \
  --policy-timestamp-servers freetsa.pem \
  --policy-emails you@example.com \
  --policy-fulcio-oidc-issuer https://oauth2.sigstore.dev/auth
```

Why the extra flags exist:

- CA roots and intermediates establish trust for the policy signature
- timestamp authority roots validate signed timestamps
- Fulcio extension flags constrain keyless certificates to the expected issuer
  and build metadata

## Rego policy evaluation

Witness policies embed base64-encoded Rego modules inside the attestation
requirements for a step. During verification, all listed Rego modules must pass.

Minimal example module:

```txt
package commandrun.exitcode

deny[msg] {
  input.exitcode != 0
  msg := "exitcode not 0"
}
```

The important shape is:

- package name can be anything sensible
- the module must produce `deny`
- `deny` can be a string or a list of strings

## `artifactsFrom` and multi-step chains

Policies can connect steps together. In the policy model described in
`docs/concepts/policy.md`, `artifactsFrom` means:

- the materials of a later step must be consistent with the products of an
  earlier step
- you can describe build pipelines such as `clone -> build -> package`

That is how the repo test script validates multi-step chains with separate
`build` and `package` collections.

## Using Archivista as an evidence source

If `--enable-archivista` is set, `cmd/verify.go` builds a multi-source lookup:

- local in-memory source for explicitly supplied files
- Archivista source for remote discovery and retrieval

That means you can mix local and remote evidence in one verification call.

## `witness policy check`

Before you debug a failed verification, validate the policy document itself:

```sh
witness policy check --verbose policy-signed.json
```

The checker in `cmd/policy_check.go` validates:

- JSON parsing
- policy expiration
- embedded Rego syntax
- functionary root references
- root certificate parsing

## Common verification errors

| Error | Meaning | Typical fix |
| --- | --- | --- |
| `must supply either a public key, CA certificates or a verifier` | No policy verification material was provided | Add `--publickey`, CA roots, or verifier flags |
| `must either specify attestation file paths or enable archivista` | No evidence source exists | Pass `--attestations` or enable Archivista |
| `at least one subject is required` | No artifact or digest was supplied | Add `--artifactfile`, `--directory-path`, or `--subjects` |
| `failed to verify policy` | Policy signature or evidence checks failed | Re-check signer trust, subject digests, and Rego |

## Related sections

- [sign and policy](../sign-and-policy/) for policy structure and signing
- [Archivista](../archivista/) for remote storage
- [in-toto attestations](/in-toto-attestations/) for DSSE and Statement background
- [Sigstore](/sigstore/) for Fulcio and timestamp trust models

## Repository anchors

- `witness/cmd/verify.go`
- `witness/cmd/policy_check.go`
- `witness/internal/policy/policy.go`
- `witness/docs/concepts/policy.md`
- `witness/cmd/verify_test.go`
