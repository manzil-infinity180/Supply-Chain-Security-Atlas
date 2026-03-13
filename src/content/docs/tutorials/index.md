---
title: Scratch-to-Production Tutorials
description: Guided learning tracks that move from first principles to policy-backed, multi-party software supply chain security workflows.
---

This section is for readers who know software delivery already but want a
concrete path through supply chain security without jumping straight into
reference material.

## How to use this section

Each page is a hands-on track with:

- a clear audience
- an estimated completion time
- a concrete output
- links into the deeper reference pages when you need details

```text
Beginner
  |
  +--> what is SSCS?
  |
  +--> first Witness attestation
          |
          v
Intermediate
  |
  +--> CI/CD pipeline with Witness + cosign
  |
  +--> OPA / Rego policy verification
          |
          v
Advanced
  |
  +--> custom attestors and signer plugins
  |
  +--> aflock sublayouts and delegated verification
```

## Tutorial map

| Track | Tutorial | Time | Outcome |
| --- | --- | --- | --- |
| Beginner | [What is SSCS and why should I care?](./what-is-sscs-and-why-should-i-care/) | 30 minutes | You can explain the difference between hashing, signing, attesting, and verifying. |
| Beginner | [Your first attestation with Witness](./your-first-attestation-with-witness/) | 20 minutes | You generate a signed attestation, sign a policy, and verify an artifact locally. |
| Intermediate | [Full CI/CD pipeline with Witness and cosign](./full-ci-cd-pipeline-with-witness-and-cosign/) | 45 minutes | You can sketch a release pipeline that emits both in-toto evidence and Sigstore signatures. |
| Intermediate | [Policy verification with OPA / Rego](./policy-verification-with-opa-rego/) | 35 minutes | You can write a Rego rule that turns attestation data into a release gate. |
| Advanced | [Custom attestors and signer plugins](./custom-attestors-and-signer-plugins/) | 45 minutes | You can extend `go-witness` and shape a custom rookery binary. |
| Advanced | [Multi-party verification with sublayouts](./multi-party-verification-with-sublayouts/) | 40 minutes | You can model delegated agent work with parent and child `.aflock` policies. |

## Suggested order

1. Start with the two beginner pages in order.
2. Pick one intermediate page based on your immediate need:
   policy authoring or CI/CD rollout.
3. Finish with the advanced pages after you are comfortable reading attestation
   JSON and policy documents.

## Supporting references

- [in-toto attestations](/in-toto-attestations/)
- [Witness](/witness/)
- [Sigstore](/sigstore/)
- [go-witness](/go-witness/)
- [rookery](/rookery/)
- [aflock](/aflock/)

## Repository anchors

- `witness/README.md`
- `witness/docs/tutorials/getting-started.md`
- `witness/docs/tutorials/artifact-policy.md`
- `witness/.github/workflows/witness.yml`
- `go-witness/run.go`
- `go-witness/policy/rego.go`
- `rookery/builder/cmd/builder/main.go`
- `aflock/internal/hooks/handler.go`
