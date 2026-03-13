---
title: Google / SLSA
description: How the Google-led SLSA model uses in-toto attestations, provenance, and verification summaries as a staged rollout path.
---

This page is for teams that need a practical reading of SLSA, not just the
marketing summary.

The workspace sources do not describe one proprietary Google deployment. They
do show the model that came out of Google's Binary Authorization and later SLSA
work: produce provenance in a standard attestation format, then verify and
enforce it progressively.

## What the workspace sources anchor

Two source points matter most:

- `friends/slsa/README.md` says SLSA Level 1 requires provenance information
  and that SLSA provenance plus verification summary are both represented using
  the in-toto attestation framework.
- [ITE-6](/in-toto-ites/ite-6/) says the attestation framework was developed
  jointly by the in-toto maintainers, Google's Binary Authorization team, and
  what later became the SLSA team.

That gives you the implementation pattern:

```text
build or release event
        |
        v
generate in-toto statement
        |
        +--> predicateType = SLSA provenance
        |     or another approved predicate
        |
        v
sign, store, and transport evidence
        |
        v
verify against policy
        |
        +--> optionally emit a verification summary
        |
        v
promotion or deployment decision
```

## The SLSA pattern in plain language

The pattern is not "buy one tool and become compliant." It is:

1. standardize what evidence looks like
2. generate that evidence automatically in the build system
3. bind it to a trustworthy identity
4. verify it before promotion or deployment
5. harden the build platform as you move up the levels

## How the pieces map to this workspace

| SLSA-oriented concern | Workspace anchor |
| --- | --- |
| Standard attestation format | `attestation/README.md`, [in-toto ITE-6](/in-toto-ites/ite-6/) |
| Provenance production | [witness](/witness/), Tekton Chains, GitHub artifact attestations |
| Identity-backed signing | [Sigstore](/sigstore/), [SPIFFE / SPIRE](/spiffe-spire/) |
| Verification and policy | [witness verify](/witness/witness-verify/), Conforma, in-toto layouts |
| Organizational rollout | [Zero to SLSA L3](../zero-to-slsa-l3/) |

## What SLSA changes as you mature

| Stage | Main question | Typical answer |
| --- | --- | --- |
| Early adoption | "Can we emit provenance at all?" | Use GitHub, Tekton Chains, or Witness in CI |
| Middle adoption | "Can we trust who signed it?" | Use keyless or workload identity and verify issuer/subject |
| Policy adoption | "Can we block bad artifacts?" | Add policy checks and promotion gates |
| Higher assurance | "Can the builder itself be trusted?" | Harden isolation, protect secrets, and separate duties |

## Important boundary

SLSA levels are assurance claims about your process, not feature flags in a
single binary.

Witness, GitHub artifact attestations, Tekton Chains, Sigstore, and SPIFFE can
help you implement the evidence and verification parts. They do not by
themselves prove that your build platform meets every higher-level SLSA
requirement. You still need operational controls around runner isolation,
change management, and trusted builders.

## Why this model keeps getting reused

The model is attractive because it lets different tools share the same
evidence. Once provenance is represented as an in-toto statement, multiple
consumers can use it:

- a deployment gate can enforce policy
- a graph system like GUAC can correlate it
- a verifier can emit a higher-level summary
- downstream users can inspect or archive it

## Related sections

- [in-toto ITE-6](/in-toto-ites/ite-6/)
- [in-toto ITE-10](/in-toto-ites/ite-10/)
- [GitHub adoption pattern](../github/)
- [CNCF projects](../cncf-projects/)
- [witness CI/CD integration](/witness/ci-cd/)

## Primary source anchors

- `friends/slsa/README.md`
- `attestation/README.md`
- `ITE/ITE/6/README.adoc`
- `ITE/ITE/10/README.adoc`
- `witness/README.md`
