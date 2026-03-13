---
title: DSSE And In-Toto
description: Understand how go-witness builds in-toto statements and wraps them in DSSE envelopes.
---

The repo keeps the in-toto statement code and the DSSE code separate:

- `intoto` builds statement payloads
- `dsse` signs and verifies envelopes

## In-toto statements

`intoto.NewStatement(predicateType, predicateBytes, subjects)` creates:

- `_type: https://in-toto.io/Statement/v0.1`
- `subject[]`
- `predicateType`
- `predicate`

Subjects are derived from `map[string]cryptoutil.DigestSet`, which is why
implementing `Subjecter` on an attestor matters.

## DSSE envelopes

`dsse.Envelope` contains:

- `payload`
- `payloadType`
- `signatures[]`

Each signature can optionally include:

- `certificate`
- `intermediates[]`
- `timestamps[]`

That extra bundle data is what lets a Fulcio or SPIFFE-backed signer carry its
trust material with the signature.

## Signing flow

`dsse.Sign(...)`:

1. reads the payload bytes
2. pre-authenticates them using DSSE PAE
3. signs with every configured signer
4. optionally timestamps each signature
5. embeds certificate material for signers that implement `TrustBundler`

`witness.Sign(...)` is just a JSON-writing wrapper around that lower-level API.

## Verification flow

`Envelope.Verify(...)` accepts several verification options:

- `VerifyWithVerifiers(...)`
- `VerifyWithRoots(...)`
- `VerifyWithIntermediates(...)`
- `VerifyWithThreshold(...)`
- `VerifyWithTimestampVerifiers(...)`

The verifier can succeed through:

- raw public-key verification
- x509 certificate verification
- x509 plus trusted timestamp verification

If no signatures match, the package returns `ErrNoMatchingSigs`. If signatures
match but do not meet the configured threshold, it returns
`ErrThresholdNotMet`.

## Why this matters for SSCS

This split lets you:

- sign arbitrary JSON payloads, not just Witness collections
- carry certificate chains with evidence
- validate signatures before you evaluate policy
- reuse the same DSSE path for collection envelopes, exported attestations, and
  verification summaries

## Related sections

- [Core API](/go-witness/core-api/)
- [In-toto attestations](/in-toto-attestations/)
- [Sigstore](/sigstore/)
