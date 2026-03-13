---
title: Image hardening
description: Practical hardening patterns for container images, from package selection to reproducibility and runtime identity.
---

Image hardening is the discipline of making the shipped container harder to
exploit, easier to reason about, and cheaper to patch.

## A pragmatic hardening checklist

### 1. Remove unnecessary software

This is the biggest win:

- no shell unless you truly need one
- no package manager in the production image
- no debugging tools in the runtime artifact
- no build toolchain in the runtime artifact

### 2. Run as non-root

If the application does not need root, do not ship it as root.

The `cilock` `apko.yaml` in this workspace sets:

```yaml
accounts:
  run-as: 65532
```

That does not solve every container escape or application bug, but it narrows
the blast radius of many common mistakes.

### 3. Separate build, package, and runtime stages

The Chainguard pattern is useful because it isolates concerns:

- build the binary or package
- compose the runtime image declaratively
- verify the produced artifact

That reduces the chance of accidental toolchain leakage into production images.

### 4. Rebuild frequently

Even a well-designed image gets stale. Fresh rebuilds matter because new
vulnerabilities and package fixes continue to land after your original build.

### 5. Make the image reproducible enough to audit

Reproducibility helps in two ways:

- security teams can confirm what should have been produced
- incident responders can compare a rebuilt artifact to the shipped one

Chainguard documents a reproducible flow where `cosign verify-attestation`
retrieves the `apko` image configuration and `apko publish` recreates the
image.

### 6. Preserve machine-readable metadata

Hardened images should not just be small. They should also be inspectable.

Useful metadata includes:

- SBOMs
- source annotations
- build timestamps
- provenance attestations
- signer identity

## Common anti-patterns

- Using a general-purpose distro image because it is convenient in development.
- Keeping `bash`, `curl`, and package managers in production "just in case".
- Treating nightly rebuilds as optional.
- Comparing only image size instead of package count, privileges, and metadata.
- Adding hardening after deployment instead of making it part of the build path.

## Hardening and attestations reinforce each other

Hardening reduces the chance that your artifact is risky.

Attestations and signatures reduce the chance that your artifact is
misunderstood, replaced, or incorrectly trusted.

You want both.

## Related sections

- [Minimal container images](../minimal-container-images/)
- [Wolfi and apko](../wolfi-and-apko/)
- [SBOMs and provenance](../sboms-and-provenance/)
- [SPIFFE / SPIRE](/spiffe-spire/)

## Primary source anchors

- [Chainguard Containers overview](https://edu.chainguard.dev/chainguard/chainguard-images/overview/)
- [Strategies for minimizing CVE risk](https://edu.chainguard.dev/chainguard/chainguard-images/staying-secure/cve-risk/)
- [Reproducibility and Chainguard Containers](https://edu.chainguard.dev/chainguard/chainguard-images/staying-secure/repro/)

## Repository anchors

- `rookery/deploy/cilock/apko.yaml`
- `rookery/deploy/cilock/melange.yaml`
