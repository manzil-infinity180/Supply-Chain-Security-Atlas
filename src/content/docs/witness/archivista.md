---
title: Archivista
description: Store and retrieve Witness attestations through Archivista instead of keeping every envelope on disk.
---

Archivista is the storage and graph service Witness integrates with for
attestations. In practical terms, it solves two problems:

- durable storage for signed DSSE envelopes
- later discovery of evidence during verification

## Where Archivista appears in Witness

`options/run.go` and `options/verify.go` add the same core flags:

- `--enable-archivista`
- `--archivista-server`
- `--archivista-headers`

In `cmd/run.go`, Witness stores each signed result after writing it locally.

In `cmd/verify.go`, Witness creates a multi-source evidence lookup that can read
from:

- local attestation files
- Archivista

## Store evidence during `witness run`

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-file-key-path testkey.pem \
  --enable-archivista \
  --archivista-server https://archivista.example.com \
  --archivista-headers "Authorization: Bearer ${ARCHIVISTA_TOKEN}" \
  -- go build -o dist/app .
```

What `cmd/run.go` does next:

1. write the signed envelope to the output file
2. create an Archivista client
3. store the envelope remotely
4. log the resulting Gitoid reference

## Retrieve evidence during `witness verify`

```sh
witness verify \
  --artifactfile dist/app \
  --policy policy-signed.json \
  --publickey policy-pub.pem \
  --enable-archivista \
  --archivista-server https://archivista.example.com \
  --archivista-headers "Authorization: Bearer ${ARCHIVISTA_TOKEN}"
```

You can combine remote and local evidence:

```sh
witness verify \
  --artifactfile dist/app \
  --attestations local-build.att.json \
  --policy policy-signed.json \
  --publickey policy-pub.pem \
  --enable-archivista
```

## Header formatting

`ArchivistaOptions.Client()` expects repeated header strings in this form:

```text
Name: value
```

For example:

```sh
--archivista-headers "Authorization: Bearer token"
--archivista-headers "X-Tenant: team-a"
```

If the header cannot be parsed into `name:value`, the client setup fails.

## When to use Archivista

Use Archivista when:

- you want later pipeline stages to verify without carrying JSON files forward
- you need centralized evidence lookup across many repositories
- you are building promotion or admission flows that resolve attestations by subject

Stay with local files when:

- you are learning Witness
- you need simple offline demos
- an air-gapped environment does not expose Archivista

## Related sections

- [witness run](../witness-run/) for storage-time behavior
- [witness verify](../witness-verify/) for retrieval-time behavior
- [CI/CD integration](../ci-cd/) for pipeline usage

## Repository anchors

- `witness/options/run.go`
- `witness/cmd/run.go`
- `witness/cmd/verify.go`
- `witness/README.md`
