---
title: Attestors
description: The built-in Witness attestors, grouped by use case with example invocations.
---

Attestors are the predicates Witness knows how to collect. They are the reason
`witness run` can answer questions like:

- what command actually ran?
- on which machine or CI system?
- which files changed?
- did this build emit an SBOM, SARIF report, or VEX document?

The current repo ships attestor documentation for `26` built-in attestors under
`witness/docs/attestors/`.

## How to read this page

- The example column shows how to enable the attestor with `witness run`
- `material`, `command-run`, and `product` are special lifecycle attestors
- some attestors depend on the surrounding environment, such as GitHub Actions
  or AWS metadata

## Core lifecycle attestors

| Attestor | Purpose | Example |
| --- | --- | --- |
| `material` | Hashes files before the command runs. Always included. | `witness run --step build -o build.att.json --signer-file-key-path testkey.pem -- make build` |
| `command-run` | Records command, args, exit code, stdout, and stderr. Added automatically when a command is passed. | `witness run --step build -o build.att.json --signer-file-key-path testkey.pem -- go build ./...` |
| `product` | Records changed or created files after execution. Always included. | `witness run --step build -o build.att.json --signer-file-key-path testkey.pem -- make build` |
| `link` | Exports an in-toto Link predicate for the step. | `witness run --step build -a link --attestor-link-export -o build.att.json --signer-file-key-path testkey.pem -- make build` |
| `slsa` | Exports SLSA provenance for the step. | `witness run --step build -a slsa --attestor-slsa-export -o build.att.json --signer-file-key-path testkey.pem -- go build -o dist/app .` |
| `policyverify` | Emits a verification summary predicate. Used during verification flows, not `witness run`. | `witness verify --artifactfile dist/app --attestations build.att.json --policy policy-signed.json --publickey policy-pub.pem` |

## Source, filesystem, and dependency attestors

| Attestor | Purpose | Example |
| --- | --- | --- |
| `environment` | Captures OS, hostname, username, and environment variables. Default extra attestor. | `witness run --step build -a environment -o build.att.json --signer-file-key-path testkey.pem -- make build` |
| `git` | Captures repository state, including staged, unstaged, and untracked objects. Default extra attestor. | `witness run --step build -a git -o build.att.json --signer-file-key-path testkey.pem -- make build` |
| `lockfiles` | Records supported dependency lockfiles found in the workspace. | `witness run --step deps -a lockfiles -o deps.att.json --signer-file-key-path testkey.pem -- npm ci` |
| `maven` | Reads Maven project and dependency information from a POM file. | `witness run --step build -a maven --attestor-maven-pom-path pom.xml -o build.att.json --signer-file-key-path testkey.pem -- mvn -B package` |
| `omnitrail` | Captures file and directory metadata with ownership, permissions, and multiple digests. | `witness run --step build -a omnitrail -o build.att.json --signer-file-key-path testkey.pem -- go build -o dist/app .` |
| `system-packages` | Records installed OS packages for the execution environment. | `witness run --step build -a system-packages -o build.att.json --signer-file-key-path testkey.pem -- make build` |

## CI, cloud, and identity attestors

| Attestor | Purpose | Example |
| --- | --- | --- |
| `aws` | Verifies and records AWS EC2 instance identity metadata. | `witness run --step build -a aws -o build.att.json --signer-file-key-path testkey.pem -- make build` |
| `aws-codebuild` | Records AWS CodeBuild project and build details. | `witness run --step build -a aws-codebuild -o build.att.json --signer-file-key-path testkey.pem -- make build` |
| `gcp-iit` | Verifies and records GCP instance identity token claims. | `witness run --step build -a gcp-iit -o build.att.json --signer-file-key-path testkey.pem -- make build` |
| `github` | Records GitHub Actions workflow identity and JWT claims. | `witness run --step build -a github -o build.att.json --signer-fulcio-url https://fulcio.sigstore.dev --signer-fulcio-oidc-client-id sigstore --signer-fulcio-oidc-issuer https://oauth2.sigstore.dev/auth -- go test ./...` |
| `gitlab` | Records GitLab CI job identity from `CI_JOB_JWT` and related metadata. | `witness run --step build -a gitlab -o build.att.json --signer-file-key-path testkey.pem -- make build` |
| `jenkins` | Records Jenkins pipeline and build metadata from the environment. | `witness run --step build -a jenkins -o build.att.json --signer-file-key-path testkey.pem -- make build` |
| `jwt` | Verifies an arbitrary JWT against JWKS and records claims plus verification info. | `witness run --step auth -a jwt -o auth.att.json --signer-file-key-path testkey.pem -- ./scripts/issue-token.sh` |

## Container, deployment, and artifact-format attestors

| Attestor | Purpose | Example |
| --- | --- | --- |
| `docker` | Records Docker build metadata when `docker build --metadata-file` is used. | `witness run --step image -a docker -o image.att.json --signer-file-key-path testkey.pem -- docker build --metadata-file metadata.json -t demo/app .` |
| `oci` | Parses an OCI image tarball on disk and records layers, tags, and manifest info. | `witness run --step image-audit -a oci -o image.att.json --signer-file-key-path testkey.pem -- tar xf image.tar` |
| `k8smanifest` | Normalizes Kubernetes manifests and records reproducible digests. | `witness run --step deploy-manifests -a k8smanifest --attestor-k8smanifest-server-side-dry-run -o manifests.att.json --signer-file-key-path testkey.pem -- kubectl apply -f k8s/` |
| `sbom` | Parses CycloneDX or SPDX JSON files found among products. | `witness run --step package -a sbom --attestor-sbom-export -o package.att.json --signer-file-key-path testkey.pem -- sh -lc 'syft dir:. -o spdx-json > sbom.spdx.json'` |
| `sarif` | Parses SARIF report files found among products. | `witness run --step sast -a sarif -o sast.att.json --signer-file-key-path testkey.pem -- semgrep scan --sarif --output results.sarif` |
| `vex` | Captures OpenVEX vulnerability statements for produced artifacts. | `witness run --step vuln-review -a vex -o vex.att.json --signer-file-key-path testkey.pem -- ./scripts/generate-vex.sh` |
| `secretscan` | Scans products and prior attestation data for leaked secrets. | `witness run --step package -a secretscan --attestor-secretscan-fail-on-detection -o package.att.json --signer-file-key-path testkey.pem -- tar czf dist/app.tar.gz dist/app` |

## What to pick most often

For a typical source build:

- `environment`
- `git`
- `slsa`
- `sbom`

For CI identity hardening:

- `github` or `gitlab` or `jenkins`
- `aws` or `gcp-iit` if the runner identity matters

For release packaging:

- `sbom`
- `sarif`
- `vex`
- `secretscan`

## Inspect available attestors from the CLI

```sh
witness attestors list
witness attestors schema github
```

Use `schema` when you need the exact predicate shape a policy or downstream
system will consume.

## Related sections

- [witness run](../witness-run/) for command behavior
- [CI/CD integration](../ci-cd/) for GitHub, GitLab, and Jenkins patterns
- [in-toto ITEs](/in-toto-ites/) for DSSE and identity-related proposal context

## Repository anchors

- `witness/cmd/attestors.go`
- `witness/docs/attestors/`
- `witness/docs/concepts/attestor.md`
