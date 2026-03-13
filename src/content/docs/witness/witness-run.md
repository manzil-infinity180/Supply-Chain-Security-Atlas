---
title: witness run
description: How Witness wraps a command, which attestors run, and how output files are produced.
---

`witness run` is the command most teams start with. It executes a command,
collects attestation predicates around that execution, signs the result, and
optionally pushes the signed envelopes to Archivista.

## Mental model

```text
before command           during command            after command
--------------           --------------            -------------
material attestor   ->   command-run attestor  ->  product attestor
environment/git          optional trace             post-product attestors
cloud/CI identity                                   SBOM, SARIF, VEX, etc.
          \________________ all wrapped into one attestation collection ________________/
                                            |
                                            v
                                  DSSE-signed JSON envelope
```

The implementation in `cmd/run.go` makes three behaviors important:

- `material` and `product` always run
- `command-run` is automatically added when you pass a command after `--`
- `environment` and `git` are the default extra attestors in `options/run.go`

## Basic shape

```sh
witness run [flags] -- <command> [args...]
```

Example:

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-file-key-path testkey.pem \
  --attestations environment,git,slsa \
  --attestor-slsa-export \
  -- go build -o dist/app .
```

## Flags that matter first

| Flag | Why it matters |
| --- | --- |
| `--step` | Names the supply-chain step. Policies match on this name. |
| `--outfile` | Writes the main DSSE envelope to disk. |
| `--attestations` | Adds extra attestors beyond the built-ins. |
| `--workingdir` | Changes the directory Witness hashes and executes from. |
| `--hashes` | Chooses digest algorithms for recorded materials and products. |
| `--dirhash-glob` | Collapses matching directories into directory hashes. |
| `--trace` | Enables command tracing. Experimental and Linux-oriented. |
| signer flags | Pick exactly one signer source. |
| `--enable-archivista` | Store the resulting envelopes remotely. |

## Output naming

If an attestor exports a dedicated predicate, `cmd/run.go` appends the attestor
name to the base output path:

- `build.att.json`
- `build.att.json-slsa.json`
- `build.att.json-sbom.json`

This matters for policies because exported predicates become separate DSSE
envelopes you may want to verify later.

## Choosing attestors

`witness run` merges three sources of attestors:

1. always-on core attestors: `material`, `product`
2. implicit runtime attestor: `command-run` when a command is supplied
3. user-requested attestors from `--attestations`

Duplicate requests are ignored with a warning, so `--attestations product` does
not create a second product predicate.

## Common patterns

### Record environment and Git state for a normal build

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-file-key-path testkey.pem \
  --attestations environment,git \
  -- make build
```

### Export SLSA provenance

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-file-key-path testkey.pem \
  --attestations slsa \
  --attestor-slsa-export \
  -- go build -o dist/app .
```

### Scan produced files for secrets

```sh
witness run \
  --step package \
  --outfile package.att.json \
  --signer-file-key-path testkey.pem \
  --attestations secretscan \
  --attestor-secretscan-fail-on-detection \
  -- tar czf dist/app.tar.gz dist/app
```

### Normalize Kubernetes manifests before hashing

```sh
witness run \
  --step deploy-manifests \
  --outfile manifests.att.json \
  --signer-file-key-path testkey.pem \
  --attestations k8smanifest \
  --attestor-k8smanifest-server-side-dry-run \
  -- kubectl apply -f k8s/
```

## Environment variable handling

The `environment` attestor captures environment variables, but it also has
safety controls:

- `--env-add-sensitive-key`
- `--env-allow-sensitive-key`
- `--env-disable-default-sensitive-vars`
- `--env-filter-sensitive-vars`

Use filtering when you want removal instead of redaction.

## When `run` fails

The most common failure modes come directly from `cmd/run.go`:

- `no signers found`: no signer provider flags were set
- `only one signer is supported`: more than one signer backend was selected
- `failed to compile glob`: a `--dirhash-glob` pattern is invalid
- attestor-specific failures: for example, cloud or CI attestors outside their expected environment

If you are only trying to prove local file creation, start with:

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-file-key-path testkey.pem \
  --attestations environment \
  -- bash -lc 'printf "hello\n" > hello.txt'
```

That removes the default `git` dependency from the command line by explicitly
setting a smaller attestor list.

## Related sections

- [Attestors](../attestors/) for every built-in attestor and example
- [Signing methods](../signing-methods/) for signer backend selection
- [Archivista](../archivista/) for remote storage and lookup
- [witness verify](../witness-verify/) for the next stage

## Repository anchors

- `witness/cmd/run.go`
- `witness/options/run.go`
- `witness/cmd/attestors.go`
- `witness/docs/concepts/attestor.md`
