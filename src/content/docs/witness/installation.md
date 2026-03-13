---
title: Installation
description: Install Witness from release artifacts or Go source, and understand what the current repository does and does not publish.
---

This page is for engineers who want an install path they can justify in a
security review. The current `witness` repository documents three concrete
paths:

- the convenience install script in `install-witness.sh`
- manual release download with Sigstore verification in `INSTALL.md`
- building or installing from Go source

## Choose the right install path

| Path | Best for | What the repo confirms |
| --- | --- | --- |
| Install script | Fast local setup | `README.md` points to `install-witness.sh` |
| Verified binary download | Production or audit-heavy environments | `INSTALL.md` shows `cosign verify-blob` against the GitHub release workflow identity |
| `go install` or `go build` | Go-centric teams and contributors | `main.go`, `go.mod`, and `Makefile` support building from source |

## Option 1: use the install script

```sh
bash <(curl -s https://raw.githubusercontent.com/in-toto/witness/main/install-witness.sh)
witness version
```

Use this when you need a working CLI quickly and are comfortable trusting the
script's download flow.

## Option 2: download and verify a release artifact

`INSTALL.md` documents the strongest built-in path: download the binary,
signature, and certificate from the GitHub release, then verify the blob with
`cosign`.

```sh
ARCH=amd64
OS=linux
VERSION=0.7.0

curl -LO "https://github.com/in-toto/witness/releases/download/v${VERSION}/witness_${VERSION}_${OS}_${ARCH}"
curl -LO "https://github.com/in-toto/witness/releases/download/v${VERSION}/witness_${VERSION}_${OS}_${ARCH}.sig"
curl -LO "https://github.com/in-toto/witness/releases/download/v${VERSION}/witness_${VERSION}_${OS}_${ARCH}.pem"

cosign verify-blob \
  --certificate "witness_${VERSION}_${OS}_${ARCH}.pem" \
  --signature "witness_${VERSION}_${OS}_${ARCH}.sig" \
  --certificate-identity "https://github.com/in-toto/witness/.github/workflows/release.yml@refs/tags/v${VERSION}" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  "witness_${VERSION}_${OS}_${ARCH}"
```

Why this matters:

- the release workflow in `.github/workflows/release.yml` signs artifacts
- `.goreleaser.yaml` configures `cosign sign-blob` for release artifacts
- `INSTALL.md` gives the exact identity you should expect in the certificate

## Option 3: install from Go source

If you already have a Go toolchain, you can build Witness directly.

```sh
git clone https://github.com/in-toto/witness.git
cd witness
go build -o ./bin/witness .
./bin/witness version
```

You can also install it into your Go bin directory:

```sh
go install github.com/in-toto/witness@latest
witness version
```

This path is useful when:

- you are following `main`
- you need to patch or debug the CLI
- you want the same build inputs used by `make build`

## Minimal prerequisites

Most docs and examples in this section assume:

- `git`
- `openssl`
- `jq`
- a POSIX shell

Some flows also require:

- `cosign` for verified release downloads
- access to Sigstore, SPIFFE, Vault, or KMS backends depending on signer choice

## Config file behavior

By default, Witness looks for `.witness.yaml` in the current directory. Command
line flags override config file values.

```yaml
run:
  signer-file-key-path: testkey.pem
  step: build
  attestations:
    - environment
    - git
sign:
  signer-file-key-path: testkey.pem
verify:
  policy: policy-signed.json
  publickey: testpub.pem
```

The config loader in `cmd/config.go` applies values only for the active
subcommand, so `run.*`, `sign.*`, and `verify.*` stay separate.

## What the repo does not currently document

The current repository does not document a Homebrew formula or tap. This docs
site does not invent one. If your team distributes Witness through Homebrew
internally, treat that as a packaging wrapper around one of the supported
installation sources above.

## Related sections

- [Quick start](../quick-start/) for the first successful attestation flow
- [Signing methods](../signing-methods/) for file, Fulcio, SPIFFE, KMS, and Vault signers
- [witness run](../witness-run/) for command execution and attestor selection

## Repository anchors

- `witness/README.md`
- `witness/INSTALL.md`
- `witness/install-witness.sh`
- `witness/.goreleaser.yaml`
- `witness/.github/workflows/release.yml`
- `witness/cmd/config.go`
