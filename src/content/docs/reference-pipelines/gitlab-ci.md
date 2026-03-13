---
title: GitLab CI Reference Pipeline
description: Extend GitLab's staged shell pipelines with Witness attestation, policy verification, and Sigstore release signing.
---

**Audience:** teams on GitLab CI who want a mechanically simple pipeline shape
that stays close to ordinary shell jobs.

**Prerequisites:** runners with `git`, `go`, `witness`, `cosign`, and Docker
access when building container images. If your runners do not preinstall
`witness`, add the installation step from [Witness installation](/witness/installation/).

## What the workspace already proves

`witness/.gitlab-ci.yml` is intentionally small:

```yaml
build:
  stage: build checks
  script:
    - make clean build
```

That is useful because it shows the real integration point. Witness does not
require a special runner type or a custom executor. It wraps the commands you
already trust and records GitLab job metadata through the `gitlab` attestor.

The reference flows below extend that baseline. They are not presented as
"already implemented in this repo"; they are production-shaped adaptations of
the repo's current GitLab model plus the documented Witness CLI behavior.

## Container image release flow

This is the strongest GitLab example because GitLab already gives you a native
container registry and stage-to-stage artifacts.

```yaml
stages:
  - build
  - verify
  - release

variables:
  IMAGE_TAG: "$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"

build-image:
  stage: build
  script:
    - install -m 0700 -d .secrets dist
    - printf '%s' "$WITNESS_BUILD_KEY" > .secrets/build.pem
    - chmod 0600 .secrets/build.pem
    - witness run \
        --step image-build \
        --outfile dist/image-build.att.json \
        --signer-file-key-path .secrets/build.pem \
        --attestations gitlab,git,environment,docker,oci \
        -- /bin/sh -ec 'docker build --metadata-file dist/docker-metadata.json -t "$IMAGE_TAG" . && docker save "$IMAGE_TAG" -o dist/image.tar'
  artifacts:
    expire_in: 7 days
    paths:
      - dist/image.tar
      - dist/image-build.att.json
      - dist/docker-metadata.json

verify-image-policy:
  stage: verify
  needs:
    - build-image
  script:
    - install -m 0700 -d .secrets
    - printf '%s' "$WITNESS_POLICY_PUB" > .secrets/policy.pub
    - chmod 0600 .secrets/policy.pub
    - witness verify \
        --policy .witness/image-policy-signed.json \
        --publickey .secrets/policy.pub \
        --artifactfile dist/image.tar \
        --attestations dist/image-build.att.json

release-image:
  stage: release
  needs:
    - verify-image-policy
  rules:
    - if: $CI_COMMIT_TAG
  script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login "$CI_REGISTRY" -u "$CI_REGISTRY_USER" --password-stdin
    - docker load -i dist/image.tar
    - docker push "$IMAGE_TAG"
    - IMAGE_DIGEST="$(docker inspect --format='{{index .RepoDigests 0}}' "$IMAGE_TAG")"
    - cosign sign --key env://COSIGN_PRIVATE_KEY --yes "$IMAGE_DIGEST"
```

Why this is a good GitLab fit:

- the build, verify, and release stages map directly to GitLab's native mental
  model
- the policy gate happens before any registry push
- the pushed image is the same tarball that passed the Witness policy check

## Binary release variant

If you ship archives or raw binaries instead of images, keep the same stage
shape and switch only the build subject and release target:

```yaml
build-binary:
  stage: build
  script:
    - install -m 0700 -d .secrets dist
    - printf '%s' "$WITNESS_BUILD_KEY" > .secrets/build.pem
    - chmod 0600 .secrets/build.pem
    - witness run \
        --step build \
        --outfile dist/build.att.json \
        --signer-file-key-path .secrets/build.pem \
        --attestations gitlab,git,environment \
        -- go build -trimpath -o dist/app ./...
  artifacts:
    paths:
      - dist/app
      - dist/build.att.json

verify-binary-policy:
  stage: verify
  needs:
    - build-binary
  script:
    - install -m 0700 -d .secrets
    - printf '%s' "$WITNESS_POLICY_PUB" > .secrets/policy.pub
    - chmod 0600 .secrets/policy.pub
    - witness verify \
        --policy .witness/release-policy-signed.json \
        --publickey .secrets/policy.pub \
        --artifactfile dist/app \
        --attestations dist/build.att.json

release-binary:
  stage: release
  needs:
    - verify-binary-policy
  rules:
    - if: $CI_COMMIT_TAG
  script:
    - cosign sign-blob \
        --key env://COSIGN_PRIVATE_KEY \
        --output-signature dist/app.sig \
        dist/app
    - |
      curl --header "JOB-TOKEN: $CI_JOB_TOKEN" \
        --upload-file dist/app \
        "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/packages/generic/app/${CI_COMMIT_TAG}/app"
    - |
      curl --header "JOB-TOKEN: $CI_JOB_TOKEN" \
        --upload-file dist/app.sig \
        "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/packages/generic/app/${CI_COMMIT_TAG}/app.sig"
    - |
      curl --header "JOB-TOKEN: $CI_JOB_TOKEN" \
        --upload-file dist/build.att.json \
        "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/packages/generic/app/${CI_COMMIT_TAG}/build.att.json"
```

This keeps the provenance and the signature next to the downloaded binary
instead of treating the attestation as a throwaway internal artifact.

## Keyless guidance for GitLab

This workspace does not include a GitLab-specific Fulcio example, so this page
does not pretend the integration is already in use here. If your GitLab setup
can issue an OIDC identity that you trust for release signing, the migration
path is:

1. keep the Witness policy gate unchanged
2. replace `--key env://COSIGN_PRIVATE_KEY` with a keyless `cosign sign`
   invocation
3. pin the expected issuer and identity during downstream verification

Treat that as a signing-backend swap, not a policy-model rewrite.

## Related sections

- [CI/CD Reference Pipelines](/reference-pipelines/)
- [Promotion and retention](../promotion-and-retention/)
- [Witness CI/CD integration](/witness/ci-cd/)
- [Sigstore CI/CD patterns](/sigstore/ci-cd/)
- [Kubernetes-native SSCS](/kubernetes-sscs/)

## Repository anchors

- `witness/.gitlab-ci.yml`
- `witness/docs/attestors/gitlab.md`
- `witness/options/run.go`
- `witness/options/verify.go`
- `go-witness/attestation/{gitlab,docker,oci}/*.go`
