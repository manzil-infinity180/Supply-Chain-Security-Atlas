---
title: "ITE-5: disassociate the signature envelope from in-toto"
description: The accepted proposal that separates the in-toto payload from its signature envelope and recommends DSSE.
---

## Summary

ITE-5 says the in-toto specification should stop hard-coding its own signature
wrapper. Instead, implementations should be free to use a secure external
envelope format. The proposal explicitly recommends DSSE.

## Why this change matters

The older wrapper depended on canonicalization and did not authenticate the
payload type. ITE-5 argues that a good envelope should:

- authenticate the payload type,
- avoid unsafe dependence on canonicalization,
- support multiple signatures,
- and let verifiers check signatures before parsing the payload.

That is exactly the problem DSSE was designed to solve.

## Example: the payload and envelope become separate concerns

The payload is still an in-toto JSON document:

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [
    {
      "name": "artifact.tar.gz",
      "digest": {
        "sha256": "3b2e4d..."
      }
    }
  ],
  "predicateType": "https://example.dev/provenance/v1",
  "predicate": {
    "builder": "ci",
    "result": "ok"
  }
}
```

DSSE then signs that payload with an authenticated `payloadType`:

```json
{
  "payloadType": "application/vnd.in-toto+json",
  "payload": "BASE64_PAYLOAD_BYTES",
  "signatures": [
    {
      "keyid": "abc123",
      "sig": "BASE64_SIGNATURE"
    }
  ]
}
```

## Implementation status in this workspace

ITE-5 is clearly implemented in the current toolchain:

- `go-witness/dsse/dsse.go` defines the envelope with `payloadType`, `payload`,
  and `signatures`.
- `go-witness/dsse/sign.go` and `go-witness/dsse/verify.go` implement signing
  and verification around DSSE pre-authenticated encoding.
- `go-witness/run.go` describes the run result as a signed DSSE envelope.
- `witness` docs and command flows are built around signed DSSE envelopes.

## Why readers should care

When you use `witness run`, `witness sign`, or the `go-witness` library, you
are already living in the post-ITE-5 world. This proposal is the reason the
payload format and the cryptographic wrapper are now cleanly separated.

## Related ITEs

- [ITE-6](../ite-6/) defines the statement payload that often lives inside DSSE.
- [ITE-7](../ite-7/) extends the signing story with certificates and trust bundles.
- [DSSE and in-toto](/go-witness/dsse-and-intoto/) shows the library-level view.

## Repository anchors

- `ITE/ITE/5/README.adoc`
- `go-witness/dsse/dsse.go`
- `go-witness/dsse/sign.go`
- `go-witness/dsse/verify.go`
- `go-witness/run.go`
