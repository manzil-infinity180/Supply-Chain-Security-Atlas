---
title: TestifySec ecosystem
description: How Witness and Archivista define the TestifySec-originated attestation workflow, and how aflock and rookery extend adjacent parts of the model in this workspace.
---

This page is for readers trying to place the projects in this workspace into one
operating model.

## What is directly sourced

The TestifySec entry in `friends/testifysec/README.md` is explicit about two
projects:

- Witness implements major parts of the in-toto model, including ITE-5, ITE-6,
  and ITE-7, and adds embedded Rego policy enforcement.
- Archivista stores and queries in-toto attestations through a graph-backed
  API.

`witness/README.md` adds one more important detail: Witness originated at
TestifySec and was later donated into the CNCF in-toto ecosystem.

## How to read the rest of this workspace

The next part is a documentation-layer connection, not a claim of company
ownership:

- [witness](/witness/) is the portable CLI that produces, signs, and verifies
  attestations
- [rookery](/rookery/) modularizes attestors and signers so binaries can be
  assembled for specific environments
- [aflock](/aflock/) applies the same signed-policy and attestation ideas to AI
  agent behavior

Taken together, they show a useful stack for modern SSCS work even though the
repos are not all sourced from the same organization.

## One practical operating model

```text
policy author or platform team
        |
        +--> aflock
        |     signed policy for agent behavior
        |
        +--> rookery
        |     choose or build the attestor and signer set
        |
        v
      witness
      generate and verify in-toto evidence
        |
        v
   Archivista or another evidence store
        |
        v
promotion, deployment, or audit decision
```

## What each project contributes

| Concern | Primary project in this workspace | Why it matters |
| --- | --- | --- |
| Collect evidence from build or runtime context | Witness or a rookery-based binary | attestation capture stays close to the event being described |
| Customize the evidence toolchain | rookery | teams can ship a smaller or more opinionated binary |
| Constrain AI agents and sign their activity | aflock | expands SSCS ideas from CI builds into agent-driven workflows |
| Store and query evidence | Archivista | makes attestations available beyond the current job |
| Enforce policy | Witness, aflock, or another verifier | evidence only matters if something consumes it |

## Why this ecosystem is useful

This combination covers three problems that many teams hit in sequence:

1. generating evidence
2. scaling the evidence system to different environments
3. applying the same trust model to newer execution environments such as AI
   agents

Witness handles the first problem directly. Rookery helps with the second by
making attestors and signers modular. Aflock pushes the same ideas into
interactive agent sessions, where policy, identity, and attestations need to be
tied together tightly.

## Related sections

- [witness](/witness/)
- [rookery](/rookery/)
- [aflock](/aflock/)
- [SPIFFE / SPIRE](/spiffe-spire/)
- [Patterns and anti-patterns](../patterns-and-anti-patterns/)

## Primary source anchors

- `friends/testifysec/README.md`
- `witness/README.md`
- `rookery/README.md`
- `aflock/README.md`
- `attestation/README.md`
