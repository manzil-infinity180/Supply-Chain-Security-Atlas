---
title: Adoption guides
description: Real-world rollout patterns for in-toto, SLSA, attestation storage, policy enforcement, and consumer-side verification.
---

This section is for platform engineers, security engineers, and technical leads
who already understand the basic attestation model and now want to see how
teams actually apply it.

The source material in the workspace does not point to one single adoption
shape. It points to several repeatable roles that different organizations and
projects combine in different ways:

| Role in the rollout | Example from the workspace sources | What it contributes |
| --- | --- | --- |
| Attestation producer | Datadog tag and wheel steps, GitHub artifact attestations, Tekton Chains, Witness | creates signed evidence close to the build or release event |
| Trust bootstrap and distribution | Datadog's TUF layering | distributes artifacts, layouts, and keys in a compromise-resilient way |
| Storage and graphing | Archivista, GUAC | keeps attestations available for later search, audit, and correlation |
| Policy engine | Conforma, Witness policy evaluation, in-toto layouts | turns signed metadata into an allow or deny decision |
| Consumer-side verifier | Datadog Agent, deployment or promotion gates | checks that evidence still holds when the artifact is actually used |

## The common architecture

```text
developer or CI system
        |
        v
build or release event
        |
        +--> generate attestation
        |     - in-toto link
        |     - SLSA provenance
        |     - SBOM
        |
        +--> sign and store evidence
        |
        v
distribution, graph, or registry layer
        |
        +--> policy evaluation
        |
        v
consumer verifies before promotion, install, or deploy
```

The important practical lesson is that adoption is usually split across
multiple systems. A CI platform produces evidence, a storage or graph service
keeps it available, and a verifier or policy engine decides whether the
artifact can move forward.

## What to read in this section

- [Datadog](./datadog/) shows a strong end-user verification model with TUF and
  in-toto layered together.
- [Google / SLSA](./google-slsa/) explains the provenance-first model that many
  other implementations copy.
- [GitHub](./github/) maps attestation support onto a widely used CI platform.
- [CNCF projects](./cncf-projects/) shows how open ecosystems split the
  producer, graph, and policy roles across multiple projects.
- [TestifySec ecosystem](./testifysec/) connects Witness and Archivista to the
  adjacent `aflock` and `rookery` projects in this workspace.
- [Patterns and anti-patterns](./patterns-and-anti-patterns/) distills the
  recurring design choices and failure modes.
- [Zero to SLSA L3](./zero-to-slsa-l3/) turns those patterns into a staged
  rollout plan.

## A quick reading of the landscape

Three broad adoption styles show up in the source repos:

1. Producer-first adoption: GitHub artifact attestations and Tekton Chains make
   it easy to start by emitting provenance at build time.
2. Consumer-first adoption: Datadog verifies on customer hardware, so evidence
   is not just produced, it is enforced where the software runs.
3. Platform adoption: GUAC, Conforma, and Archivista turn attestations into a
   reusable organizational capability instead of a one-off CI feature.

## Related sections

- [in-toto attestations](/in-toto-attestations/)
- [in-toto ITE-2](/in-toto-ites/ite-2/)
- [in-toto ITE-3](/in-toto-ites/ite-3/)
- [in-toto ITE-6](/in-toto-ites/ite-6/)
- [witness CI/CD integration](/witness/ci-cd/)
- [Sigstore CI/CD patterns](/sigstore/ci-cd/)

## Primary source anchors

- `friends/README.md`
- `friends/datadog/README.md`
- `friends/github/README.md`
- `friends/slsa/README.md`
- `friends/tekton-chains/README.md`
- `friends/guac/README.md`
- `friends/conforma/README.md`
- `friends/testifysec/README.md`
- `witness/README.md`
- `attestation/README.md`
