---
title: Promotion and Retention
description: Decide where attestations, signatures, bundles, and release artifacts should live after the build stage.
---

This page answers the operational question that usually appears right after a
first successful CI demo: where should the evidence go, and how does a later
stage consume it without rebuilding?

## The retention problem

```text
build job
  |
  +--> artifact or image
  +--> Witness DSSE envelope
  +--> Sigstore signature or bundle
  |
  v
promotion job
  |
  +--> must fetch the same bytes
  +--> must fetch the same evidence
  +--> must verify before release or deploy
```

If any one of those three objects is missing, the gate weakens:

- no artifact means you rebuild
- no Witness evidence means you cannot prove how the build happened
- no signature or bundle means downstream consumers cannot verify distribution

## Good storage patterns

| Object | Store it where | Why |
| --- | --- | --- |
| Binary or archive | release system or package registry | consumers need a durable download target |
| Container image | OCI registry by digest | admission and promotion work better with immutable subjects |
| Witness attestation file | build artifact store, release asset, or Archivista | later stages need the same DSSE envelope without rerunning the build |
| Cosign signature or bundle | next to the released artifact or attached to the image digest | downstream verification should not need a private side channel |
| Signed policy | source repo or policy repo | promotion gates should use versioned policy inputs |

## Promotion rules that hold up in production

1. Build once.
2. Verify the exact build output.
3. Release or promote that same output.
4. Verify again at the next trust boundary.

For binaries, that usually means carrying `dist/app`, `build.att.json`, and the
blob signature outputs together.

For images, that usually means:

1. save the image tarball or export the digest during build
2. run the Witness policy gate before push
3. push the same image
4. sign the pushed digest
5. let downstream systems verify the digest, not the tag

## Archivista vs pipeline artifacts

Use pipeline artifacts when:

- the evidence only needs to move between nearby stages
- the retention window is short
- the CI platform is already your system of record for release traces

Use Archivista when:

- you want later search or audit across many releases
- multiple systems need to resolve attestations by subject digest
- you do not want every downstream stage to carry raw DSSE files around

The current examples in this section keep the first rollout simple by using CI
artifacts, but [Witness CI/CD integration](/witness/ci-cd/) already documents
the Archivista switch.

## Anti-patterns

- Rebuilding in the release job after the policy gate passed on a different
  artifact.
- Uploading only the binary or image and discarding the attestation.
- Signing a mutable container tag and treating that as equivalent to signing a
  digest.
- Letting CI artifact retention expire before the next promotion stage runs.
- Publishing unsigned policy files and trusting branch protection alone.

## Recommended defaults

- Set short-lived artifact retention for intermediate files, but retain release
  evidence for as long as the release itself is supported.
- Publish Witness attestations alongside downloaded binaries when your users
  need offline verification.
- Keep image verification digest-based so Kubernetes admission controls can
  reason about immutable subjects.
- Keep policy files versioned in Git and signed with a separate authority from
  the build signer whenever possible.

## Related sections

- [GitHub Actions reference pipeline](../github-actions/)
- [GitLab CI reference pipeline](../gitlab-ci/)
- [Witness Archivista](/witness/archivista/)
- [Sigstore Rekor and transparency](/sigstore/rekor-and-transparency/)
- [Kubernetes verification and admission](/kubernetes-sscs/verification-and-admission/)

## Repository anchors

- `witness/.github/workflows/release.yml`
- `witness/.goreleaser.yaml`
- `witness/.gitlab-ci.yml`
- `witness/cmd/verify.go`
