---
title: CNCF projects
description: How CNCF-adjacent projects divide attestation production, storage, graphing, policy, and verification into reusable building blocks.
---

This page is for readers who need to explain the ecosystem, not just one tool.

The workspace sources show that CNCF and CNCF-adjacent adoption is deliberately
modular. Different projects own different parts of the trust chain.

## The ecosystem split

```text
producer                   storage / graph             policy / decision
--------                   ---------------             -----------------
Tekton Chains -----------> GUAC ---------------------> Conforma
Jenkins plugin ----------> Archivista ---------------> Witness verify
Witness -----------------> artifact registry --------> deployment gate
```

The pattern is useful because organizations rarely want a single system to do
everything. CI systems generate evidence, graph systems correlate it, and
policy systems decide what is allowed.

## Producer projects

### Tekton Chains

The `friends/tekton-chains/README.md` entry says Chains watches Tekton
`TaskRuns` and generates an in-toto attestation. That makes it a good example
of platform-native provenance: if Tekton already runs your builds, provenance
can be emitted from the pipeline engine itself.

### Jenkins plugin

The `friends/jenkins/README.md` entry points to the in-toto Jenkins plugin.
That matters for adoption because it shows the same pattern in an older CI
ecosystem: the CI server becomes the metadata producer rather than requiring a
fully separate sidecar system.

### Witness

`witness/README.md` shows a third producer shape: a portable CLI that runs
inside GitHub Actions, GitLab, Jenkins, cloud VMs, or local automation. This
is usually the best fit when a team has more than one CI environment.

## Aggregation and graph projects

### GUAC

The `friends/guac/README.md` entry describes GUAC as a graph that ingests SLSA
and other ITE-6 attestations, normalizes identities, and supports audit, risk,
and policy decisions. GUAC is the "make the data queryable" layer.

### Archivista

The TestifySec entry highlights Archivista as a graph and storage service for
in-toto attestations with a GraphQL API. Compared with GUAC, Archivista is the
more direct "store and retrieve attestation evidence" layer in this workspace's
tool set.

## Policy and verification projects

### Conforma

The `friends/conforma/README.md` entry frames Conforma as a policy engine that
verifies supply chain artifacts using in-toto attestations. This is the "turn
evidence into a compliance decision" step.

### in-toto layouts and Witness policy

The attestation framework and Witness pages in this site show the same idea
from the implementation side: once attestations are standardized, multiple
verifiers can consume them. A project might use Conforma in one environment and
Witness or in-toto layout verification in another.

## Common CNCF adoption pattern

The following summary is an inference from the workspace sources:

- start by generating provenance inside an existing CI system
- centralize evidence in a store or graph
- evaluate policy close to promotion or deployment
- keep producer and verifier loosely coupled through standard in-toto metadata

That loose coupling is why these projects can be combined rather than chosen as
mutually exclusive alternatives.

## Related sections

- [witness](/witness/)
- [witness CI/CD integration](/witness/ci-cd/)
- [in-toto attestations](/in-toto-attestations/)
- [Google / SLSA](../google-slsa/)
- [Patterns and anti-patterns](../patterns-and-anti-patterns/)

## Primary source anchors

- `friends/tekton-chains/README.md`
- `friends/jenkins/README.md`
- `friends/guac/README.md`
- `friends/conforma/README.md`
- `friends/testifysec/README.md`
- `witness/README.md`
- `attestation/README.md`
