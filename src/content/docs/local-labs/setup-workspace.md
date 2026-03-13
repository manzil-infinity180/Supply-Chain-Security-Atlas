---
title: Set Up the Workspace Lab
description: Create a local SSCS workbench inside this workspace, seed it with example assets, and build the binaries needed for the lab exercises.
---

**Estimated time:** 20 minutes

**Audience:** readers who want one clean directory for repeated local
experiments instead of ad hoc shell history.

## Goal

By the end of this page you will have:

- a lab root with keys, artifacts, manifests, policies, and attestations
- a locally built `witness` binary from the `witness/` repo
- optional access to a locally built `aflock` binary for the SPIRE extension

## Prerequisites

Required for the base lab:

- `go`
- `git`
- `openssl`
- `jq`

Optional for extensions:

- Docker and Docker Compose for the `aflock` SPIRE sandbox
- `kubectl`
- either `kind` or `k3d`

## 1. Point the lab at your workspace

If you are using this exact workspace, the path is already:

```sh
export SSCS_WORKSPACE="/Users/rahulxf/personal-rahulxf/oss-personal-work"
```

If you cloned elsewhere, point `SSCS_WORKSPACE` at your own checkout root.

Now create the workbench:

```sh
cd "$SSCS_WORKSPACE"
export LAB_ROOT="$SSCS_WORKSPACE/sscs-docs-site/examples/local-lab/workbench"

mkdir -p \
  "$LAB_ROOT/bin" \
  "$LAB_ROOT/artifacts" \
  "$LAB_ROOT/attestations" \
  "$LAB_ROOT/keys" \
  "$LAB_ROOT/manifests" \
  "$LAB_ROOT/policies"
```

## 2. Seed the workbench with checked-in lab assets

These files live in the docs repo so the examples stay in sync with the site:

```sh
cp "$SSCS_WORKSPACE/sscs-docs-site/examples/local-lab/command.rego" \
  "$LAB_ROOT/policies/command.rego"

cp "$SSCS_WORKSPACE/sscs-docs-site/examples/local-lab/demo-deployment.yaml" \
  "$LAB_ROOT/manifests/release.yaml"
```

## 3. Initialize the workbench as a Git repository

The default Witness `git` attestor is enabled by `witness/options/run.go`, so
the workbench should be a repository before you start recording steps.

```sh
git -C "$LAB_ROOT" init
git -C "$LAB_ROOT" config user.name "SSCS Lab"
git -C "$LAB_ROOT" config user.email "lab@example.com"
git -C "$LAB_ROOT" add manifests/release.yaml policies/command.rego
git -C "$LAB_ROOT" commit -m "seed local sscs lab"
```

## 4. Build the Witness CLI from source

This uses the repo checked out in this workspace, not an external download:

```sh
cd "$SSCS_WORKSPACE/witness"
go build -o "$LAB_ROOT/bin/witness" ./main.go
```

Sanity-check the result:

```sh
"$LAB_ROOT/bin/witness" --help
```

## 5. Optional: build `aflock` for the identity extension

You do not need `aflock` for the required Witness exercises. Build it only if
you also want the SPIRE-backed extension later.

```sh
cd "$SSCS_WORKSPACE/aflock"
go build -o "$LAB_ROOT/bin/aflock" ./cmd/aflock
```

## Suggested layout

```text
$LAB_ROOT
├── artifacts/        # files produced by lab commands
├── attestations/     # DSSE envelopes emitted by witness
├── bin/              # locally built binaries
├── keys/             # temporary lab keys
├── manifests/        # local Kubernetes examples
└── policies/         # Witness policies and Rego modules
```

Keep this directory disposable. The point of the lab is that you can delete it
and recreate it in a few minutes.

## What is worth committing

Treat these as safe to commit inside the disposable workbench:

- policies
- manifests
- attestation examples you want to inspect

Do not commit these:

- generated private keys under `keys/`
- copied kubeconfig files
- temporary SPIRE or cluster credentials

## Next step

Go straight to [Build, attest, sign, and verify](../build-attest-sign-verify/)
and use the `witness` binary you just built.

## Repository anchors

- `witness/cmd/root.go`
- `witness/cmd/run.go`
- `witness/options/run.go`
- `aflock/cmd/aflock/main.go`
