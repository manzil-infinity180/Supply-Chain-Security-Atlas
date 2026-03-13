---
title: Patterns and anti-patterns
description: Repeatable adoption lessons inferred from the real-world in-toto and SLSA examples in the workspace.
---

This page is intentionally interpretive. The items below are inferences from the
workspace sources, not direct quotes from a single spec.

## Patterns that keep showing up

### Generate evidence where the event happens

Datadog signs at the developer tag step and again records the wheel-building
pipeline. Tekton Chains watches `TaskRuns`. Witness wraps the command being run.
The repeated lesson is simple: generate evidence as close as possible to the
actual build, release, or verification event.

### Separate production, distribution, and verification

Datadog uses in-toto for the supply-chain record and TUF for trusted
distribution. GUAC and Archivista separate storage from enforcement. Conforma
and Witness separate policy decisions from raw metadata generation.

### Bind evidence to an identity you can verify later

GitHub workflows, developer YubiKeys, SPIFFE identities, and Sigstore-issued
certificates all show the same idea: an attestation is much more useful when
you can answer "who or what was allowed to sign this?"

### Start with standard predicate types

SLSA provenance, SBOMs, and the in-toto attestation framework appear repeatedly
because reuse matters. Standard predicates let many verifiers, policy engines,
and graph systems consume the same artifact evidence.

### Enforce gradually, not all at once

The Palantir entry in `friends/palantir/README.md` explicitly mentions gradual
enforcement with exemptions and controlled overrides. The same rollout logic is
implied by the broader ecosystem: first produce evidence, then verify, then
gate promotions and installs once the data is stable.

## Anti-patterns to avoid

### Treating provenance as a reporting feature

If a team generates attestations but never checks them at promotion, deploy, or
install time, it has observability, not enforcement. Datadog is the clearest
counter-example because the agent verifies on customer hardware.

### Letting CI define trust by itself

ITE-2 exists for a reason. If the same compromised pipeline can replace the
layout, the public keys, and the artifact, then the evidence system collapses.
Protect trust roots and distribution separately.

### Building one-off metadata formats

Custom JSON blobs that only one internal tool understands make future policy and
tooling reuse much harder. The in-toto attestation framework and SLSA model are
valuable precisely because multiple producers and consumers can share them.

### Coupling your rollout to one CI vendor

GitHub artifact attestations are useful, but many organizations also run
GitLab, Jenkins, Tekton, or local release automation. Portable tooling such as
Witness or modular tooling such as rookery helps avoid a dead end.

### Turning on blocking policy before you trust the data

If step names, identity constraints, or attestor outputs are still unstable,
hard blocking will generate noise and political pushback. Start with collection,
then warning modes, then policy gates once the metadata is dependable.

## A simple decision test

Use a candidate design only if it answers all four questions clearly:

1. Where is the attestation produced?
2. What identity signs it?
3. Who stores or distributes it?
4. Who verifies it before trust is granted?

If any answer is vague, the rollout design is probably incomplete.

## Related sections

- [Adoption guides overview](../)
- [Datadog](../datadog/)
- [CNCF projects](../cncf-projects/)
- [Zero to SLSA L3](../zero-to-slsa-l3/)

## Primary source anchors

- `friends/README.md`
- `friends/datadog/README.md`
- `friends/github/README.md`
- `friends/palantir/README.md`
- `friends/tekton-chains/README.md`
- `friends/guac/README.md`
- `friends/conforma/README.md`
- `friends/testifysec/README.md`
- `ITE/ITE/2/README.adoc`
- `ITE/ITE/3/README.adoc`
