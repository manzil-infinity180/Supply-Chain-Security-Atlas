---
title: witness
description: Overview of Witness as the workspace's attestation and verification CLI, grounded in the current repository implementation.
---

`witness` is the workspace's general-purpose attestation CLI. It wraps build or
deployment commands, records facts about the environment and the command that
ran, signs the resulting DSSE envelopes, and later verifies those envelopes
against a signed policy.

If [aflock](/aflock/) is the agent-policy layer and [rookery](/rookery/) is the
modular attestation engine, Witness is the concrete operator-facing CLI for
ordinary software supply-chain workflows.

## What exists today

The current repository implements:

- `witness run`, `sign`, `verify`, `policy check`, `attestors`, `completion`,
  and `version`
- DSSE signing with file keys, Fulcio keyless, SPIFFE, KMS, and Vault-backed
  providers
- policy verification with public keys, x509 roots, timestamps, and Fulcio
  certificate constraints
- optional storage and lookup through Archivista
- built-in attestors for Git, environment, cloud identity, CI systems, SBOMs,
  SARIF, VEX, Kubernetes manifests, secrets, and more

The command tree is declared in `cmd/root.go`, while most behavior lives in:

- `cmd/run.go`
- `cmd/sign.go`
- `cmd/verify.go`
- `cmd/policy_check.go`
- `options/*.go`

## Architecture at a glance

```text
command to execute
       |
       v
  witness run
       |
       +--> attestors collect evidence
       |     - material / product
       |     - environment / git
       |     - CI or cloud identity
       |     - SBOM / SARIF / VEX / etc.
       |
       +--> signer binds evidence to identity
       |     - file key
       |     - Fulcio
       |     - SPIFFE
       |     - KMS / Vault
       |
       v
 signed DSSE envelopes on disk or in Archivista
       |
       v
  witness verify
       |
       +--> verify policy signature
       +--> resolve subject digests
       +--> load attestation collections
       +--> evaluate functionaries, timestamps, artifactsFrom, and Rego
       |
       v
 allow / deny decision
```

## Why readers usually start here

For many teams, `witness` is the fastest way to move from the abstract idea of
attestations to a concrete CLI workflow:

- run a build command,
- capture materials and metadata,
- sign the result,
- and verify policy before release or deployment.

You do not need to write a custom library integration first.

## Read this section in order

- [Installation](./installation/) covers the install script, verified releases,
  Go source builds, and config-file behavior.
- [Quick start](./quick-start/) gets you to a successful local `run -> sign ->
  verify` loop fast.
- [witness run](./witness-run/) explains automatic attestors, exports, and the
  execution lifecycle.
- [witness verify](./witness-verify/) covers policy trust, subject digests, and
  Rego evaluation.
- [sign and policy](./sign-and-policy/) documents `witness sign` and the newer
  `witness policy check` subcommand.
- [Attestors](./attestors/) maps all built-in attestors currently documented in
  the repo.
- [Signing methods](./signing-methods/) compares file keys, Fulcio, SPIFFE,
  KMS, and Vault.
- [CI/CD integration](./ci-cd/) shows the patterns grounded in the repo's
  GitHub and GitLab workflows plus the Jenkins attestor.
- [Archivista](./archivista/) explains remote storage and retrieval.
- [Troubleshooting](./troubleshooting/) covers the common error paths from the
  current code.

## Related sections

- [go-witness](/go-witness/) for the library view of the same concepts
- [rookery](/rookery/) for the modular forked attestation ecosystem in this workspace
- [Sigstore](/sigstore/) for keyless signing background
- [SPIFFE / SPIRE](/spiffe-spire/) for workload identity background
- [in-toto attestations](/in-toto-attestations/) for the underlying model
- [in-toto ITEs](/in-toto-ites/) for the proposals Witness already implements

## Repository anchors

- `witness/README.md`
- `witness/INSTALL.md`
- `witness/cmd/root.go`
- `witness/cmd/run.go`
- `witness/cmd/sign.go`
- `witness/cmd/verify.go`
- `witness/cmd/policy_check.go`
- `witness/docs/attestors/`
