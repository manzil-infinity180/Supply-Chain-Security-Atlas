---
title: Datadog
description: How Datadog combines in-toto and TUF so release evidence is generated in CI and verified on customer hardware.
---

This page is for readers who want to understand a mature software distribution
pattern, not just a CI pipeline feature.

The Datadog example in the workspace sources is important because it does two
things at once:

- it records how integrations move through the release pipeline
- it verifies that evidence again when the Datadog Agent uses the integration

## The rollout shape

```text
developer tags integration with YubiKey
              |
              v
        tag step emits source evidence
              |
              v
     wheels-builder creates Python wheel
              |
              v
      wheels-signer prepares release set
              |
              +--> TUF distributes:
              |     - wheels
              |     - in-toto metadata
              |     - trusted keys and delegations
              |
              v
customer hardware running Datadog Agent
              |
              v
verifies wheel, metadata, and release chain before trust
```

## What the source material says

The `friends/datadog/README.md` summary and [ITE-3](/in-toto-ites/ite-3/) agree
on the core flow:

- Datadog developers sign a release tag for the integration they want to ship.
- The CI/CD system builds Python wheels and emits in-toto link metadata.
- The Datadog Agent verifies that metadata on customer hardware.
- TUF distributes both the packages and the metadata that tells clients which
  keys and layouts to trust.

That last point matters. [ITE-2](/in-toto-ites/ite-2/) explains why in-toto
alone is not enough for distribution: you still need a compromise-resilient way
to publish layouts, keys, and revocations. TUF is the outer trust layer.

## Design decisions worth copying

| Decision | Source signal | Why it matters |
| --- | --- | --- |
| Release starts with a human-controlled signing event | Datadog's `tag` step uses developer YubiKeys in ITE-3 | ties the release intent to an accountable developer action |
| Builder and signer are separate pipeline stages | `wheels-builder` and `wheels-signer` are distinct steps in ITE-3 | reduces the blast radius of a single compromised job |
| Offline trust roots protect the layout | ITE-3 describes a 2-of-3 offline root layout threshold | prevents the CI system from silently replacing the rules |
| Distribution has its own security model | ITE-2 layers TUF over in-toto | shipping trusted metadata is a different problem from generating it |
| Verification happens where software is consumed | Datadog Agent verifies on customer hardware | catches tampering that happens after CI finishes |

## Why this is stronger than a build-only rollout

Many teams stop once CI emits provenance. Datadog's model goes further:

1. release intent is signed
2. build steps are recorded
3. distribution is protected
4. the installed client verifies again

That last step is the difference between "we collected evidence" and "the
consumer can refuse untrusted software."

## Practical lessons

- If you distribute artifacts over a public repository or CDN, protect the
  metadata distribution path, not just the build path.
- If different steps have different risk profiles, give them different keys and
  thresholds.
- If your customers or downstream services can verify attestations, push
  verification closer to actual use.

## Tradeoffs

- TUF adds operational overhead because keys, delegations, expiries, and
  revocation become part of the release process.
- Customer-side verification improves security but raises compatibility and
  rollout complexity.
- Offline thresholds strengthen the design, but they also slow emergency
  changes unless you rehearse the process.

## Related sections

- [in-toto ITE-2](/in-toto-ites/ite-2/)
- [in-toto ITE-3](/in-toto-ites/ite-3/)
- [witness verify](/witness/witness-verify/)
- [Sigstore security model](/sigstore/security-model/)

## Primary source anchors

- `friends/datadog/README.md`
- `ITE/ITE/2/README.adoc`
- `ITE/ITE/3/README.adoc`
