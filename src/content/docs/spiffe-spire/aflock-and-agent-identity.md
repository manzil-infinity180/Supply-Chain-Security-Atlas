---
title: aflock and agent identity
description: Understand how aflock borrows SPIRE ideas, derives agent identity from runtime state, and maps that identity into SPIFFE-shaped policy constraints.
---

This page is for readers who want to connect workload identity to AI agents
without hand-waving.

## What aflock takes from SPIRE

The key idea is architectural, not identical implementation.

SPIRE says:

- identity should be derived from observable workload properties
- the workload should not mint its own trust assertions
- short-lived credentials are safer than handing the workload a long-lived key

aflock applies the same mindset to AI agents:

- derive identity from runtime observations
- authorize with a token the agent can present
- keep signing authority outside the agent process

That framing is visible in `aflock/README.md` and in the code under
`aflock/internal/identity/`.

## The two identity layers in aflock

aflock has two related but distinct identity views.

### 1. Derived agent identity

`AgentIdentity.DeriveIdentity()` in `aflock/internal/identity/agent.go`
constructs a canonical representation from runtime facts such as:

- model and model version
- binary path, version, and digest
- environment details
- tools
- policy digest
- optional parent identity

That string is hashed and becomes the stable internal identity anchor.

### 2. SPIFFE-shaped external identity

`ToFunctionary(trustDomain string)` maps the derived identity into a SPIFFE ID:

```text
spiffe://<trust-domain>/agent/<model>/<version>/<identity-hash-prefix>
```

The implementation sanitizes model and version strings and currently uses the
first 16 hex characters of the identity hash in the path.

## What the trust domain is today

`aflock/internal/identity/spire.go` sets:

```text
TrustDomain = "aflock.ai"
```

The same trust domain appears in the checked-in SPIRE server and agent configs.

The repo also carries a small `TrustedModels` map that binds specific Claude
model names to selectors and canonical SPIFFE IDs:

- `claude-opus-4-5-20251101`
- `claude-sonnet-4-20250514`
- `claude-3-5-haiku-20241022`

## What aflock fetches from SPIRE

`aflock/internal/identity/spire.go` wraps the SPIFFE Workload API and exposes:

- `FetchX509SVID`
- `FetchX509Context`
- `GetIdentity`
- `WatchX509Context`
- `MustHaveSPIRE`

`GetIdentity` returns:

- the workload's `SPIFFEID`
- the leaf certificate
- the private key
- the trust bundle for the trust domain
- the certificate expiration time

That is the concrete identity material used by signing and verification code.

## Functionary matching in policy

The `Functionary` type in `aflock/pkg/aflock/types.go` supports a SPIFFE-focused
mode:

```json
{
  "type": "spiffe",
  "spiffeIdPattern": "spiffe://aflock.ai/agent/claude-*",
  "trustDomain": "aflock.ai",
  "modelConstraint": "claude-*"
}
```

`AgentIdentity.matchesSPIFFEFunctionary()` checks:

- exact `spiffeId`
- glob-style `spiffeIdPattern`
- `trustDomain`
- `modelConstraint`
- `versionConstraint`

That gives aflock a policy vocabulary that feels natural to supply chain and
workload-identity practitioners even though the "workload" is an AI agent.

## Attestation signing path

The attestation signer in `aflock/internal/attestation/signer.go` initializes a
`SpireClient`, fetches identity, and signs DSSE envelopes with a `spireSigner`
wrapper around the workload key material.

In practical terms:

- the signing key comes from the workload identity path
- the trust bundle is available for verification
- the signed material is still an in-toto-style DSSE envelope

This is the bridge between SPIFFE identity and [aflock attestations](/aflock/attestations-and-verification/).

## Where aflock differs from classic SPIRE usage

aflock is not treating AI agents as plain interchangeable workloads.

It adds AI-specific inputs such as:

- Claude session discovery
- model/version extraction
- policy digest binding
- parent-child delegation context

That is why aflock talks about SPIRE as inspiration and reference architecture,
not as a one-to-one copy.

## Practical takeaway

If you need one sentence for design review:

aflock uses a SPIRE-style trust model to make agent identity emerge from
observed runtime state, then expresses authorization and verification rules with
SPIFFE-shaped functionary constraints.

## Related sections

- [aflock agent identity](/aflock/agent-identity/)
- [aflock attestations and verification](/aflock/attestations-and-verification/)
- [SPIFFE IDs, trust domains, and SVIDs](../spiffe-ids-and-svids/)
- [Witness signing and in-toto verification](../witness-and-intoto/)

## Primary source anchors

- `aflock/README.md`
- `aflock/internal/identity/agent.go`
- `aflock/internal/identity/spire.go`
- `aflock/internal/attestation/signer.go`
- `aflock/pkg/aflock/types.go`
- `aflock/examples/data-flow-policy.aflock`
