---
title: Attestations and verification
description: Understand aflock's DSSE envelopes, SPIRE-backed signing path, and the difference between session verification and step verification.
---

This page is for readers who care about the evidence aflock produces, not just
the runtime blocking decisions it makes.

## What aflock signs

aflock uses in-toto Statements inside DSSE envelopes. In the implementation,
the default payload type is:

```text
application/vnd.in-toto+json
```

The action predicate type used by `internal/attestation` is:

```text
https://aflock.ai/attestations/action/v0.1
```

## Action attestations

In MCP mode, standard tool actions can become signed action attestations when
SPIRE is available. The signed predicate records:

- the action kind and tool name
- the tool input, when it could be parsed
- the policy decision: `allow`, `deny`, or `ask`
- the timestamp
- cumulative session metrics
- transitive agent identity details

The subject name is shaped like:

```text
session:<session-id>/action:<tool-use-id>
```

## Arbitrary predicate signing

The MCP `sign_attestation` tool lets a caller submit any predicate type and
predicate body. aflock creates a Statement, signs it with the SPIRE-derived
identity, stores it, and returns the envelope.

That makes aflock useful as a policy-gated attestation broker, not just a
tool-execution wrapper.

## Step attestations

The `bash` tool has a second path for verification-oriented supply-chain steps:

```json
{
  "command": "go test ./...",
  "attest": true,
  "step": "test",
  "reason": "Capture unit test evidence"
}
```

When `attest=true`, aflock runs attestors around the command, signs the
resulting collection, and stores it by git tree hash and step name.

## Signing model

The current implementation is SPIRE-first:

- `internal/identity/spire.go` connects to the SPIRE workload API
- `internal/attestation/signer.go` fetches an X.509 SVID and private key
- aflock only enables signing when SPIRE is reachable and the discovered model
  is in the trusted-model list

If SPIRE is unavailable, aflock keeps enforcing policy but disables signing.

## Verification modes

There are two verification stories in the repo.

### 1. Session verification

`internal/verify.Verifier.VerifySession()` reads session state from
`~/.aflock/sessions/<session-id>/state.json` and checks:

- post-hoc limit violations
- required logical attestation names
- recorded data-flow denials
- a summary of allowed versus blocked actions

This path is useful for hook-driven sessions and debugging.

### 2. Step verification

`aflock verify` currently drives `VerifySteps()` or `VerifyTreeHash()`. This is
the stronger CLI-facing path and it is based on:

- `policy.roots`
- `policy.steps`
- attestation files under `~/.aflock/attestations/<tree-hash>/`

For each step, aflock checks:

1. policy expiration
2. attestation existence
3. DSSE signature validity against trusted roots
4. collection name equals the declared step name
5. required attestation types exist inside the collection
6. artifact chaining through `artifactsFrom`

## What the draft spec adds

Repository prose also describes a broader six-phase verifier with identity
checks, materials binding, Rego evaluation, AI evaluation, and recursive
sublayout handling. That model is useful for understanding direction, but the
current CLI verify command is primarily the step verifier described above.

## Example `steps` policy fragment

```json
{
  "roots": {
    "ci-root": {
      "certificate": "./certs/ci-root.pem"
    }
  },
  "steps": {
    "lint": {
      "name": "lint",
      "functionaries": [
        {
          "type": "root",
          "certConstraint": {
            "commonName": "ci.example.internal"
          }
        }
      ],
      "attestations": [
        {
          "type": "https://aflock.ai/attestations/product/v0.1"
        }
      ]
    },
    "test": {
      "name": "test",
      "functionaries": [],
      "attestations": [
        {
          "type": "https://aflock.ai/attestations/product/v0.1"
        }
      ],
      "artifactsFrom": ["lint"]
    }
  }
}
```

## Related topics

- [Rego policy evaluation](../rego-policy-evaluation/) for the richer policy
  language described in examples and spec prose
- [in-toto attestations](/in-toto-attestations/) for Statement and DSSE
  background
- [SPIFFE / SPIRE](/spiffe-spire/) for workload signing identity

## Repository anchors

- `aflock/internal/attestation/signer.go`
- `aflock/internal/mcp/server.go`
- `aflock/internal/verify/verifier.go`
