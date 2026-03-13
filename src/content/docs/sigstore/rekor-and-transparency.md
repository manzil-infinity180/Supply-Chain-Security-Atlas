---
title: Rekor and transparency
description: Learn what Rekor proves, how transparency logs help verifiers, and why append-only evidence is different from trust.
---

Rekor is Sigstore's transparency log. Its job is to make signing events visible,
auditable, and hard to rewrite without detection.

The short version:

- a signer produces a signature or attestation
- a record of that event is added to Rekor
- the log is append-only and backed by a Merkle tree
- verifiers and monitors can check inclusion and consistency

## Why transparency logs matter

A valid signature tells you "someone with the right signing material approved
this payload."

A transparency log adds a second useful property:

"This signing event was recorded in a public append-only log that other parties
can inspect."

That helps with:

- retroactive investigation
- monitoring unexpected identities
- proving a certificate existed and was logged at signing time
- detecting tampering with log history through consistency checks

## Mental model

```text
signature or attestation created
       |
       v
  log entry submitted to Rekor
       |
       +--> entry gets a log index
       +--> entry contributes to the Merkle tree
       +--> Rekor returns signed evidence about inclusion
       |
       v
verifiers can check:
  - the entry matches the artifact or certificate they expect
  - the entry is included in the log
  - the log history is consistent over time
```

## What Rekor does not replace

Rekor is not a substitute for policy.

You still need to verify:

- the signature itself
- the Fulcio certificate chain or public key
- the signer identity constraints
- any attestation predicate rules

Think of Rekor as additional evidence, not as the entire trust decision.

## Bundles vs live log lookups

In connected environments, tools can query Rekor directly. In constrained or
offline verification flows, Sigstore bundles package the evidence that would
otherwise require a live transparency-log lookup.

That distinction matters operationally:

- live Rekor checks are useful when the verifier can reach the public service
- bundles are useful when the verifier needs portable, self-contained evidence

## What employers usually expect you to know

Be ready to explain these terms:

- `append-only log`
- `Merkle tree`
- `inclusion proof`
- `consistency proof`
- `Signed Entry Timestamp`

You do not need to memorize the exact wire format on day one, but you should be
able to explain why log proofs make history tampering detectable.

## Operational advice

- monitor for identities that should never sign your artifacts
- pin verification to expected issuer and signer identity, not just Rekor
- keep digest-based records so you can correlate an incident with a specific log
  entry
- use bundles when you need portability across air-gapped or approval-heavy
  environments

## Related sections

- [Keyless signing](../keyless-signing/)
- [Security model](../security-model/)
- [Policy Controller](../policy-controller/)

## Source anchors

Official references:

- [Rekor overview](https://docs.sigstore.dev/logging/overview/)
- [The importance of verification](https://docs.sigstore.dev/about/faq/#what-is-sigstore)

Workspace anchors:

- `witness/INSTALL.md`
- `go-witness/verify.go`
- `go-witness/policy/constraints.go`
