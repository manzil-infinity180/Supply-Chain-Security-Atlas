---
title: cilock CLI
description: Command reference for the full rookery CLI that ships with all currently imported plugins.
---

`cilock` is rookery's full attestation CLI. Its entry point in
`rookery/cilock/cmd/cilock/main.go` blank-imports the complete shipped plugin
set and enables legacy predicate aliases at startup.

## Build it

```bash
cd rookery
go build -trimpath -o ./bin/cilock ./cilock/cmd/cilock
./bin/cilock --help
```

The source file starts with:

```go
//go:debug fips140=on
```

So the CLI is intended to run with Go's FIPS 140 mode enabled.

## Command tree

The root command in `cilock/internal/cmd/root.go` registers:

- `run`
- `sign`
- `verify`
- `attestors`
- `policy`
- `version`
- `completion`

## `cilock run`

Purpose: execute a command, collect attestations, sign the resulting envelope,
and optionally store it in Archivista.

Current behavior from source:

- exactly one signer must be loaded
- `material` and `product` always run
- `command-run` is added automatically when a command is provided
- default `--attestations` are `environment` and `git`
- multi-exporter attestors require `--outfile`

Example:

```bash
./bin/cilock run \
  --step build \
  --outfile build.json \
  --signer-debug-enabled \
  -a slsa \
  --attestor-slsa-export \
  -- go build ./...
```

Useful flags from `options/run.go`:

- `--workingdir`
- `--attestations`
- `--dirhash-glob`
- `--hashes`
- `--outfile`
- `--step`
- `--timestamp-servers`
- `--enable-archivista`

## `cilock sign`

Purpose: sign an existing file as a DSSE envelope.

Example:

```bash
./bin/cilock sign \
  --infile policy.json \
  --outfile policy.dsse.json \
  --signer-file-key-path signing-key.pem
```

Current behavior from source:

- exactly one signer must be loaded
- input and output paths are explicit flags
- timestamp authorities can be added with `--timestamp-servers`
- default datatype is the Witness policy type URI

## `cilock verify`

Purpose: verify a policy against attestation evidence.

Source-backed expectations:

- you must provide a public key, CA material, or a verifier provider
- you must provide attestation files unless Archivista is enabled
- you must provide at least one artifact or subject digest
- subject digests are validated as hex

Example:

```bash
./bin/cilock verify \
  --policy policy.dsse.json \
  --publickey policy.pub \
  --attestations build.json \
  --artifactfile ./bin/app
```

Key verification flag groups:

- `--publickey`
- `--policy`
- `--attestations`
- `--artifactfile`
- `--subjects`
- `--policy-ca-roots`
- `--policy-ca-intermediates`
- `--policy-fulcio-*`
- `--verifier-kms-ref`

## `cilock attestors`

Purpose: inspect registered attestors.

Commands:

- `cilock attestors list`
- `cilock attestors schema <name>`

Examples:

```bash
./bin/cilock attestors list
./bin/cilock attestors schema k8smanifest
```

`list` prints name, type URI, and run stage. `schema` prints the JSON schema
generated from the registered attestor type.

## `cilock policy validate`

Purpose: validate raw or DSSE-wrapped Witness policy files and optionally check
the signature with a public key.

Example:

```bash
./bin/cilock policy validate \
  --policy policy.dsse.json \
  --publickey policy.pub \
  --output json
```

Important nuance from source:

- raw policy files can be schema-validated
- signature verification only works when the policy is wrapped in DSSE

## `version` and `completion`

`version` exposes the current build version. `completion` generates shell
completion scripts through Cobra.

## Related sections

- [Signer plugins](../signer-plugins/) for the full signer matrix
- [Attestor plugins](../attestor-plugins/) for the attestor inventory
- [Custom binary builder](../custom-binary-builder/) for plugin-selected builds
- [Migration from go-witness](../migration-from-go-witness/) for Witness users

## Repository anchors

- `rookery/cilock/cmd/cilock/main.go`
- `rookery/cilock/internal/cmd/root.go`
- `rookery/cilock/internal/cmd/run.go`
- `rookery/cilock/internal/cmd/sign.go`
- `rookery/cilock/internal/cmd/verify.go`
- `rookery/cilock/internal/cmd/attestors.go`
- `rookery/cilock/internal/cmd/policy_validate.go`
