---
title: CI/CD integration
description: Grounded patterns for GitHub Actions, GitLab CI, and Jenkins using Witness attestors and signer flows.
---

Witness is most useful when it is embedded directly in CI jobs, not run later
by hand. The repository itself shows three useful integration signals:

- GitHub Actions workflows in `.github/workflows/*.yml`
- GitLab CI in `.gitlab-ci.yml`
- dedicated `github`, `gitlab`, and `jenkins` attestors

If you want full build, verify, sign, and release examples instead of these
high-level patterns, start with [CI/CD reference pipelines](/reference-pipelines/).

## Integration pattern

```text
CI job starts
    |
    v
runner already knows:
  - repo state
  - workflow or pipeline metadata
  - cloud identity
    |
    v
witness run wraps the build command
    |
    +--> CI attestor captures platform metadata
    +--> optional cloud attestor captures runner identity
    +--> signer binds evidence to a key, workload ID, or keyless cert
    |
    v
attestation files or Archivista storage
```

## GitHub Actions

The Witness repo uses a reusable workflow in `.github/workflows/witness.yml`
that conditionally wraps commands with `testifysec/witness-run-action` when the
event is not a pull request.

Key details the repo demonstrates:

- `permissions.id-token: write` for OIDC
- `attestations: "git github environment"` as a sensible default
- wrapping ordinary shell commands rather than redesigning the whole pipeline

Minimal shape:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v6
        with:
          go-version-file: go.mod
      - uses: testifysec/witness-run-action@<pin>
        with:
          witness-install-dir: /usr/local/bin
          version: 0.9.1
          step: build
          attestations: "git github environment"
          command: /bin/sh -c "go test ./..."
```

When you want keyless signing, pair the `github` attestor with Fulcio signing.

## GitLab CI

The repo's `.gitlab-ci.yml` is intentionally small, but it confirms the basic
shape: build, test, and vet stages are just shell commands. Witness fits by
wrapping those commands.

Example:

```yaml
build:
  stage: build
  script:
    - witness run --step build --outfile build.att.json --signer-file-key-path testkey.pem --attestations gitlab,git,environment -- make clean build
```

Use the `gitlab` attestor when the runner exposes the GitLab job JWT and related
environment variables.

## Jenkins

Jenkins has an attestor too, but unlike GitHub Actions there is no bundled
workflow helper in this repo. The pattern is still simple: install Witness on
the agent and wrap your build stage.

```groovy
stage('Build') {
  steps {
    sh '''
      witness run \
        --step build \
        --outfile build.att.json \
        --signer-file-key-path /var/lib/jenkins/witness/testkey.pem \
        --attestations jenkins,git,environment \
        -- make build
    '''
  }
}
```

## Pick attestors by environment

| Environment | Usually add |
| --- | --- |
| GitHub-hosted or self-hosted Actions | `github`, `git`, `environment` |
| GitLab runners | `gitlab`, `git`, `environment` |
| Jenkins agents | `jenkins`, `git`, `environment` |
| EC2-hosted runners | add `aws` |
| GCE or GKE-hosted runners | add `gcp-iit` |

## Remote storage pattern

CI is where Archivista often becomes worthwhile:

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-file-key-path testkey.pem \
  --enable-archivista \
  --archivista-server https://archivista.example.com \
  --attestations github,git,environment \
  -- go test ./...
```

That lets a later promotion or deployment stage verify without carrying
attestation files around as ordinary build artifacts.

## Policy tips for CI

- Bind steps to the right functionary type: file key, root, or SPIFFE-backed cert
- Use Rego to assert CI metadata like branch, repository, or workflow identity
- Keep step names stable so policy remains readable across pipelines
- Sign policy separately from build evidence

## Related sections

- [Attestors](../attestors/) for CI-specific predicate details
- [Signing methods](../signing-methods/) for keyless and workload identities
- [Archivista](../archivista/) for remote evidence storage

## Repository anchors

- `witness/.github/workflows/witness.yml`
- `witness/.github/workflows/release.yml`
- `witness/.gitlab-ci.yml`
- `witness/docs/attestors/github.md`
- `witness/docs/attestors/gitlab.md`
- `witness/docs/attestors/jenkins.md`
