---
title: GitHub Actions Reference Pipeline
description: Build, attest, verify, sign, and release binaries or container images in GitHub Actions using Witness and Sigstore.
---

**Audience:** teams already using GitHub Actions who want a promotion gate
between build and release, not just a final signature.

**Prerequisites:** GitHub Actions runners with Docker access for image builds,
`WITNESS_BUILD_KEY` and `WITNESS_POLICY_PUB` secrets, and a committed policy
file such as `.witness/release-policy-signed.json`.

## What the workspace already proves

The `witness` repository already demonstrates the key GitHub-specific pieces:

- a reusable attested workflow in `witness/.github/workflows/witness.yml`
- a release workflow with `permissions.id-token: write` in
  `witness/.github/workflows/release.yml`
- release signing and image-signing behavior in `witness/.goreleaser.yaml`
- downstream blob verification identity in `witness/INSTALL.md`

The reference workflow below expands that shape by making the Witness policy
gate explicit before the publish step.

## Binary release flow

This workflow keeps three boundaries clear:

1. `build`: create the artifact and its DSSE envelope
2. `verify-policy`: treat the signed policy as the promotion gate
3. `publish`: release the already-verified bytes and sign them for downstream
   distribution

```yaml
name: release-binary-with-witness

on:
  push:
    tags:
      - "v*"

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd
      - uses: actions/setup-go@4b73464bb391d4059bd26b0524d20df3927bd417
        with:
          go-version-file: go.mod
      - name: Install witness
        run: go install github.com/in-toto/witness@v0.9.1
      - name: Materialize build signer
        env:
          WITNESS_BUILD_KEY: ${{ secrets.WITNESS_BUILD_KEY }}
        run: |
          install -m 0700 -d "$RUNNER_TEMP/witness"
          printf '%s' "$WITNESS_BUILD_KEY" > "$RUNNER_TEMP/witness/build.pem"
          chmod 0600 "$RUNNER_TEMP/witness/build.pem"
      - name: Build with Witness
        run: |
          mkdir -p dist
          "$HOME/go/bin/witness" run \
            --step build \
            --outfile dist/build.att.json \
            --signer-file-key-path "$RUNNER_TEMP/witness/build.pem" \
            --attestations git,github,environment \
            -- go build -trimpath -o dist/app ./...
      - uses: actions/upload-artifact@bbbca2ddaa5d8feaa63e36b76fdaad77386f024f
        with:
          name: build-output
          path: |
            dist/app
            dist/build.att.json

  verify-policy:
    needs: [build]
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd
      - uses: actions/setup-go@4b73464bb391d4059bd26b0524d20df3927bd417
        with:
          go-version-file: go.mod
      - name: Install witness
        run: go install github.com/in-toto/witness@v0.9.1
      - uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c
        with:
          name: build-output
          path: dist
      - name: Materialize policy verifier
        env:
          WITNESS_POLICY_PUB: ${{ secrets.WITNESS_POLICY_PUB }}
        run: |
          printf '%s' "$WITNESS_POLICY_PUB" > "$RUNNER_TEMP/policy.pub"
          chmod 0600 "$RUNNER_TEMP/policy.pub"
      - name: Verify build evidence against policy
        run: |
          "$HOME/go/bin/witness" verify \
            --policy .witness/release-policy-signed.json \
            --publickey "$RUNNER_TEMP/policy.pub" \
            --artifactfile dist/app \
            --attestations dist/build.att.json

  publish:
    needs: [verify-policy]
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c
        with:
          name: build-output
          path: dist
      - uses: sigstore/cosign-installer@ba7bc0a3fef59531c69a25acd34668d6d3fe6f22
      - name: Sign release blob with GitHub OIDC
        working-directory: dist
        run: |
          cosign sign-blob \
            --yes \
            --output-signature app.sig \
            --output-certificate app.pem \
            app
      - uses: softprops/action-gh-release@v2
        with:
          files: |
            dist/app
            dist/app.sig
            dist/app.pem
            dist/build.att.json
```

Why this matches the workspace:

- the runner permissions match the OIDC pattern used in
  `witness/.github/workflows/release.yml`
- the blob-signing step matches the `cosign sign-blob` model configured in
  `witness/.goreleaser.yaml`
- downstream users can verify the released binary the same way `witness/INSTALL.md`
  does, by pinning the workflow identity and issuer

## Container image variant

The repo does not currently ship a standalone GitHub Actions container-build
workflow, but the pieces are all present: `release.yml` logs into GHCR,
`.goreleaser.yaml` builds OCI images, `docker_signs` signs manifests, and the
Docker and OCI attestors exist in the Witness source tree.

Use this variant when you want a policy gate on the build output before pushing
the image:

```yaml
name: release-image-with-witness

on:
  push:
    tags:
      - "v*"

permissions:
  contents: read

jobs:
  build-image:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd
      - uses: actions/setup-go@4b73464bb391d4059bd26b0524d20df3927bd417
        with:
          go-version-file: go.mod
      - name: Install witness
        run: go install github.com/in-toto/witness@v0.9.1
      - name: Materialize build signer
        env:
          WITNESS_BUILD_KEY: ${{ secrets.WITNESS_BUILD_KEY }}
        run: |
          install -m 0700 -d "$RUNNER_TEMP/witness"
          printf '%s' "$WITNESS_BUILD_KEY" > "$RUNNER_TEMP/witness/build.pem"
          chmod 0600 "$RUNNER_TEMP/witness/build.pem"
      - name: Build image and export tarball with Witness
        run: |
          mkdir -p dist
          export IMAGE="ghcr.io/${{ github.repository }}:${{ github.sha }}"
          "$HOME/go/bin/witness" run \
            --step image-build \
            --outfile dist/image-build.att.json \
            --signer-file-key-path "$RUNNER_TEMP/witness/build.pem" \
            --attestations git,github,environment,docker,oci \
            -- /bin/sh -ec 'docker build --metadata-file dist/docker-metadata.json -t "$IMAGE" . && docker save "$IMAGE" -o dist/image.tar'
      - uses: actions/upload-artifact@bbbca2ddaa5d8feaa63e36b76fdaad77386f024f
        with:
          name: image-output
          path: |
            dist/image.tar
            dist/image-build.att.json
            dist/docker-metadata.json

  verify-image-policy:
    needs: [build-image]
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd
      - uses: actions/setup-go@4b73464bb391d4059bd26b0524d20df3927bd417
        with:
          go-version-file: go.mod
      - name: Install witness
        run: go install github.com/in-toto/witness@v0.9.1
      - uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c
        with:
          name: image-output
          path: dist
      - name: Materialize policy verifier
        env:
          WITNESS_POLICY_PUB: ${{ secrets.WITNESS_POLICY_PUB }}
        run: |
          printf '%s' "$WITNESS_POLICY_PUB" > "$RUNNER_TEMP/policy.pub"
          chmod 0600 "$RUNNER_TEMP/policy.pub"
      - name: Verify image tarball against policy
        run: |
          "$HOME/go/bin/witness" verify \
            --policy .witness/image-policy-signed.json \
            --publickey "$RUNNER_TEMP/policy.pub" \
            --artifactfile dist/image.tar \
            --attestations dist/image-build.att.json

  publish-image:
    needs: [verify-image-policy]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write
    steps:
      - uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c
        with:
          name: image-output
          path: dist
      - uses: docker/login-action@b45d80f862d83dbcd57f89517bcf500b2ab88fb2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: sigstore/cosign-installer@ba7bc0a3fef59531c69a25acd34668d6d3fe6f22
      - name: Push and sign image digest
        run: |
          export IMAGE="ghcr.io/${{ github.repository }}:${{ github.sha }}"
          docker load -i dist/image.tar
          docker push "$IMAGE"
          IMAGE_DIGEST="$(docker inspect --format='{{index .RepoDigests 0}}' "$IMAGE")"
          cosign sign --yes "$IMAGE_DIGEST"
```

## Promotion notes

- Keep the policy gate in its own job so failed verification is easy to spot in
  review and audit trails.
- Release the exact artifact or image that passed verification.
  Do not rebuild in the publish job.
- For binary downloads, publish the Witness attestation alongside the artifact
  or store it in Archivista.
- For container images, push first, then sign the immutable digest rather than
  a mutable tag.

## Related sections

- [CI/CD Reference Pipelines](/reference-pipelines/)
- [Promotion and retention](../promotion-and-retention/)
- [Witness CI/CD integration](/witness/ci-cd/)
- [Sigstore CI/CD patterns](/sigstore/ci-cd/)
- [Adoption guide: GitHub](/adoption-guides/github/)

## Repository anchors

- `witness/.github/workflows/witness.yml`
- `witness/.github/workflows/release.yml`
- `witness/.goreleaser.yaml`
- `witness/INSTALL.md`
- `witness/docs/attestors/docker.md`
- `go-witness/attestation/{docker,oci}/*.go`
