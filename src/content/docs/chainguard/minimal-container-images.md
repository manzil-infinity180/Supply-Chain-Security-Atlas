---
title: Minimal container images
description: Why minimal and distroless images reduce attack surface, and what trade-offs they introduce.
---

Minimal images are one of the simplest high-leverage security decisions you can
make.

The idea is not "make the image small for aesthetics". The idea is "ship only
what production actually needs".

## What "minimal" means here

A minimal image tries to include:

- the application
- the runtime libraries it actually needs
- as little else as possible

Chainguard describes many of its images as **distroless**: no interactive
shell, no package manager, and no general-purpose debugging utilities in the
runtime image.

## Why smaller images are usually safer

Every extra package increases one or more of:

- attack surface
- patching work
- scanner noise
- uncertainty during incident response

Fewer packages usually means fewer potential CVE findings, fewer license and
compliance questions, and a tighter story when you generate an SBOM or
provenance attestation.

## Distroless does not mean "immune"

A minimal image can still contain:

- vulnerable application code
- vulnerable runtime libraries
- bad configuration
- overly broad runtime permissions

Distroless is useful because it removes avoidable risk, not because it replaces
signing, provenance, scanning, or policy.

## Runtime image vs. development image

A good pattern is to separate:

| Image type | Purpose | Typical contents |
| --- | --- | --- |
| development or debug image | troubleshooting, shell access, package experiments | shell, package manager, extra tooling |
| production image | deployment runtime | only the app and required runtime dependencies |

Chainguard explicitly ships `-dev` variants for that reason. Keep the richer
tooling where humans need it, not in the artifact you deploy broadly.

## A useful test

Before adding something to a production image, ask:

1. Is it required for the process to start?
2. Is it required for the process to serve traffic?
3. If not, can it stay in the build image or debug variant instead?

If the answer to the first two is "no", it usually does not belong.

## Concrete workspace example

`rookery/deploy/cilock/apko.yaml` is intentionally small. It includes:

- the locally built `cilock` package
- `ca-certificates-bundle`
- `git`
- `busybox`

and it runs as UID `65532` instead of root.

That is not perfectly distroless because `busybox` is still present, but it is
much narrower than a general Linux base image.

## When minimal images become painful

You will feel friction when:

- debugging production-only failures
- relying on `kubectl exec` plus shell habits
- running third-party tools that assume package managers or shell utilities

The answer is usually not "put everything back". It is to keep separate debug
artifacts and stronger build-time observability.

## Related sections

- [Wolfi and apko](../wolfi-and-apko/)
- [Image hardening](../image-hardening/)
- [Vulnerability comparison](../vulnerability-comparison/)

## Primary source anchors

- [Chainguard Containers overview](https://edu.chainguard.dev/chainguard/chainguard-images/overview/)
- [Strategies for minimizing CVE risk](https://edu.chainguard.dev/chainguard/chainguard-images/staying-secure/cve-risk/)

## Repository anchors

- `rookery/deploy/cilock/apko.yaml`
- `learning-aflock-witness-rookery/09-rookery-deep-dive-and-ecosystem.md`
