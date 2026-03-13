---
title: Wolfi and apko
description: How Wolfi packages and apko composition help build minimal, reproducible container images.
---

If you want to understand the Chainguard approach technically, start here:

- **Wolfi** is the package universe
- **melange** builds packages
- **apko** composes those packages into images

## Wolfi in one paragraph

Chainguard describes Wolfi as a Linux **undistro** for the container and
cloud-native era. It is not meant to be a traditional bare-metal Linux
distribution with its own kernel. Instead, it focuses on granular packages,
build-time SBOMs, declarative builds, and the package shape needed for minimal
images.

Those design choices matter because you cannot make a tight runtime image if
your package layer is too coarse or opaque.

## Why apko exists

`apko` is intentionally narrower than Docker:

- it is a **composition** tool
- it builds images from declarative YAML
- it generates SBOMs as part of successful builds
- it pairs naturally with `melange`, which builds APK packages from source

That separation is the point. Build your software once, then compose it into a
small image in a repeatable way.

## Build flow

```text
source code
   |
   v
melange package build
   |
   v
APK packages
   |
   v
apko image composition
   |
   +--> OCI image
   +--> SBOM
   +--> image configuration metadata
```

## Workspace example: `cilock`

The `rookery` repository already uses this pattern.

`rookery/deploy/cilock/melange.yaml` builds a `cilock` APK package from source:

```yaml
package:
  name: cilock
  description: "Witness-compatible CI attestation CLI with all attestors and signers"

pipeline:
  - uses: git-checkout
    with:
      repository: https://github.com/aflock-ai/rookery
      tag: v${{package.version}}

  - runs: |
      cd cilock
      GOWORK=off go build \
        -trimpath \
        -ldflags="-s -w -X 'github.com/aflock-ai/rookery/cilock/internal/cmd.Version=v${{package.version}}'" \
        -o "${{targets.destdir}}/usr/bin/cilock" \
        ./cmd/cilock/
```

Then `rookery/deploy/cilock/apko.yaml` composes the runtime image:

```yaml
contents:
  repositories:
    - https://packages.wolfi.dev/os
    - '@local ./packages'
  packages:
    - cilock@local
    - ca-certificates-bundle
    - git
    - busybox

accounts:
  run-as: 65532

entrypoint:
  command: /usr/bin/cilock
```

That separation is worth noticing:

- package build concerns stay in `melange.yaml`
- runtime composition concerns stay in `apko.yaml`

## What this buys you

| Property | Why it helps |
| --- | --- |
| Granular packages | Easier to keep images minimal |
| Declarative image config | Easier to review and reproduce |
| Build-time SBOM generation | Better downstream inventory and verification |
| Non-root runtime declaration | Better default hardening |

## What it does not buy you automatically

- safe application code
- correct runtime policy
- perfect scanner output
- verified provenance at deploy time

You still need signatures, attestations, and policy checks. That is where
[Sigstore](/sigstore/) and [witness](/witness/) fit.

## Related sections

- [Minimal container images](../minimal-container-images/)
- [SBOMs and provenance](../sboms-and-provenance/)
- [rookery custom binary builder](/rookery/custom-binary-builder/)

## Primary source anchors

- [Wolfi overview](https://edu.chainguard.dev/open-source/wolfi/overview/)
- [apko getting started](https://edu.chainguard.dev/open-source/build-tools/apko/getting-started-with-apko/)
- [Reproducibility and Chainguard Containers](https://edu.chainguard.dev/chainguard/chainguard-images/staying-secure/repro/)

## Repository anchors

- `rookery/deploy/cilock/melange.yaml`
- `rookery/deploy/cilock/apko.yaml`
- `learning-aflock-witness-rookery/09-rookery-deep-dive-and-ecosystem.md`
