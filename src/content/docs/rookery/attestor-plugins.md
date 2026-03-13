---
title: Attestor plugins
description: Reference for the attestor modules currently loaded by rookery's cilock CLI.
---

This page tracks the attestor inventory that `cilock` imports today in
`rookery/cilock/cmd/cilock/main.go`.

## How to read this list

- `cilock` currently blank-imports `29` attestor modules
- the CLI name is the registered attestor name, not always the directory name
- `material` and `product` are always injected by `cilock run`
- `environment` and `git` are the default `--attestations` list

For per-attestor options, use the registry-backed schema view:

```bash
./bin/cilock attestors list
./bin/cilock attestors schema sbom
./bin/cilock attestors schema k8smanifest
```

## Execution core

| Attestor | Stage | What it records |
| --- | --- | --- |
| `environment` | Pre-material | Host and environment variables, with sensitive-key filtering and obfuscation support. |
| `git` | Pre-material | Repository identity, commit metadata, refs, tags, and worktree state. |
| `material` | Material | Input file digests before command execution. Always runs in `cilock run`. |
| `command-run` | Execute | Command argv, execution details, and optional tracing. Added automatically when a command is provided. |
| `product` | Product | Output file digests after command execution. Always runs in `cilock run`. |
| `configuration` | Pre-material | CLI flags plus `.witness.yaml` content and digest. |
| `link` | Post-product | in-toto link predicate assembled from command, material, environment, and product data. |
| `slsa` | Post-product | SLSA provenance derived from earlier attestors such as `git`, `environment`, `material`, and `product`. |
| `policyverify` | Verify | Verification summary predicate produced during policy verification, not during `run`. |

Useful flags in this group:

- `--attestor-slsa-export`
- `--env-filter-sensitive-vars`
- `--env-add-sensitive-key`
- `--dirhash-glob`

## CI and identity context

| Attestor | Stage | What it records |
| --- | --- | --- |
| `aws-codebuild` | Pre-material | AWS CodeBuild build identifiers, project metadata, webhook context, and related subjects. |
| `aws` | Pre-material | AWS EC2 instance identity document and signature validation against regional certificates. |
| `gcp-iit` | Pre-material | GCP instance identity token plus project, instance, and cluster metadata. |
| `github` | Pre-material | GitHub Actions workflow metadata and verified OIDC JWT claims. |
| `github-action` | Execute | Action-specific execution metadata for GitHub Actions. |
| `githubwebhook` | Post-product | GitHub webhook payload after HMAC verification, plus subjects/backrefs extracted from the event. |
| `gitlab` | Pre-material | GitLab CI job and pipeline metadata, optionally with verified JWT claims. |
| `jenkins` | Pre-material | Jenkins build, executor, node, and workspace metadata from environment variables. |
| `jwt` | Pre-material | Generic JWT claims validated against a JWKS endpoint. |
| `omnitrail` | Pre-material | Filesystem activity trail collected through `omnitrail-go`. |

Notes:

- `github`, `gitlab`, `gcp-iit`, and `aws-codebuild` all encode identity claims
  into attestation subjects or backrefs.
- `githubwebhook` is present in `cilock`, but it is not imported by the
  `presets/all` package.

## Artifact, package, and deployment formats

| Attestor | Stage | What it records |
| --- | --- | --- |
| `lockfiles` | Pre-material | Known package-manager lockfiles such as `go.sum`, `package-lock.json`, `Cargo.lock`, and `pnpm-lock.yaml`. |
| `maven` | Pre-material | Maven `pom.xml` project coordinates and dependencies. |
| `system-packages` | Pre-material | Installed Debian or RPM package inventories using absolute package-manager paths. |
| `docker` | Post-product | Docker build output metadata derived from build output artifacts such as JSON metadata and sha256 text files. |
| `oci` | Post-product | OCI image tar contents, manifest digests, config digest, layers, and image tags. |
| `k8smanifest` | Post-product | Kubernetes manifest normalization, digest calculation, referenced images, and optional cluster info. |

Useful flags in this group:

- `--attestor-maven-pom-path`
- `--attestor-k8smanifest-kubeconfig`
- `--attestor-k8smanifest-kube-context`
- `--attestor-k8smanifest-server-side-dry-run`
- `--attestor-k8smanifest-record-cluster-info`

## Security and report formats

| Attestor | Stage | What it records |
| --- | --- | --- |
| `sarif` | Post-product | SARIF vulnerability or static-analysis reports found among produced artifacts. |
| `sbom` | Post-product | SPDX and CycloneDX SBOM predicates, with optional export as separate attestations. |
| `secretscan` | Post-product | Secret scanning results over produced files, including encoded-secret detection paths. |
| `vex` | Post-product | OpenVEX vulnerability-exploitability documents. |

Useful flags in this group:

- `--attestor-sbom-export`
- `--attestor-link-export`

## Example runs

Collect the default core evidence plus a separate SLSA export:

```bash
./bin/cilock run \
  --step build \
  --outfile build.json \
  --signer-debug-enabled \
  -a slsa \
  --attestor-slsa-export \
  -- go build ./...
```

Collect Kubernetes deployment evidence after a `kubectl apply`:

```bash
./bin/cilock run \
  --step deploy \
  --outfile deploy.json \
  --signer-debug-enabled \
  -a k8smanifest \
  --attestor-k8smanifest-kubeconfig ~/.kube/config \
  --attestor-k8smanifest-server-side-dry-run \
  -- kubectl apply -f k8s/
```

Inspect the config surface of a specific plugin before wiring it into CI:

```bash
./bin/cilock attestors schema k8smanifest
```

## What is not in the preset packages

If you only blank-import `presets/all`, you do not get the exact same attestor
set as `cilock`. The largest gaps today are:

- `githubwebhook` exists in `cilock` but not in `presets/all`
- `policyverify` exists in `cilock` but not in `presets/all`

The preset reference covers the full matrix.

## Repository anchors

- `rookery/cilock/cmd/cilock/main.go`
- `rookery/cilock/internal/cmd/attestors.go`
- `rookery/cilock/internal/cmd/run.go`
- `rookery/cilock/internal/options/run.go`
- `rookery/plugins/attestors/`
