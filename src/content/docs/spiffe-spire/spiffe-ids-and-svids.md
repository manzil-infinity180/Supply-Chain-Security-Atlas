---
title: SPIFFE IDs, trust domains, and SVIDs
description: Understand the minimum SPIFFE vocabulary you need before reading the aflock and Witness integration guides.
---

This page is for readers who know regular TLS certificates but have not yet
worked with workload identity.

## SPIFFE ID

A SPIFFE ID is a URI that names a workload.

The repos in this workspace show IDs such as:

- `spiffe://aflock.ai/agent/claude-opus-4-5`
- `spiffe://dev.testifysec.com/witness-demo/builder`
- `spiffe://example.com/step1`

Those examples come from:

- `aflock/internal/identity/spire.go`
- `witness/dev/build-and-push-builders.sh`
- `witness/docs/concepts/policy.md`

The shape is always:

```text
spiffe://<trust-domain>/<workload-path>
```

## Trust domain

The trust domain is the administrative boundary for a group of SPIFFE IDs.

In this workspace, you can see it explicitly configured as `aflock.ai` in:

- `aflock/internal/identity/spire.go`
- `aflock/docker/spire/server/server.conf`
- `aflock/docker/spire/agent/agent.conf`

You can think of a trust domain as the identity namespace whose certificates are
anchored by the same trust bundle.

## SVID

SVID stands for SPIFFE Verifiable Identity Document.

The important practical detail here is that the code in these repos uses
`X.509 SVIDs`, not JWT-SVIDs:

- `aflock/internal/identity/spire.go` fetches `X509SVID` and `X509Context`
- `go-witness/signer/spiffe/spiffe.go` calls `FetchX509Context`
- [ITE-7](/in-toto-ites/ite-7/) describes certificate-backed signing and trust
  bundle verification

An X.509 SVID is a short-lived certificate chain plus private key associated
with a SPIFFE ID.

## Workload API

Applications do not talk directly to the SPIRE server when they need their
certificate. They typically read it from the SPIFFE Workload API exposed by the
local SPIRE agent.

That is why the critical configuration surface in both repos is the socket path:

```text
/tmp/spire-agent/public/api.sock
```

In `aflock`, the default is wrapped as:

```text
unix:///tmp/spire-agent/public/api.sock
```

and controlled by the `SPIFFE_ENDPOINT_SOCKET` environment variable.

In `Witness`, the CLI exposes:

```text
--signer-spiffe-socket-path
```

## What actually gets verified

When people say "verify a SPIFFE identity", they usually mean a verifier checks
some combination of:

- the certificate chain up to a trusted root or bundle
- the URI SAN on the certificate
- additional certificate fields such as email, organization, or DNS names

That pattern is explicit in [ITE-7](/in-toto-ites/ite-7/) and in
`witness/docs/concepts/policy.md`, where SPIFFE IDs are matched through the
certificate `uris` field.

Example Witness policy constraint:

```json
{
  "commonname": "*",
  "dnsnames": ["*"],
  "emails": ["*"],
  "organizations": ["*"],
  "uris": ["spiffe://example.com/step1"],
  "roots": ["*"]
}
```

## Why the distinction matters

Do not treat these as interchangeable:

| Term | What it is | What it is used for here |
| --- | --- | --- |
| SPIFFE ID | URI identifier | policy matching and identity naming |
| X.509 SVID | short-lived certificate + key | signing and certificate-based verification |
| Trust bundle | trusted CA roots for a domain | certificate path validation |
| Workload API socket | local delivery mechanism | how `aflock` and `witness` fetch identity material |

## Example: the same idea across repos

```text
aflock policy functionary
  -> matches spiffe://aflock.ai/agent/...

Witness verifier policy
  -> matches certificate uris: ["spiffe://example.com/step1"]

ITE-7 layout
  -> constrains certificate URIs and trust bundles
```

These are different policy surfaces expressing the same underlying idea:
identity is carried in a certificate URI and validated against a trusted root.

## Related sections

- [SPIRE runtime model](../spire-runtime/)
- [aflock and agent identity](../aflock-and-agent-identity/)
- [Witness signing and in-toto verification](../witness-and-intoto/)

## Primary source anchors

- `aflock/internal/identity/spire.go`
- `aflock/docker/spire/server/server.conf`
- `aflock/docker/spire/agent/agent.conf`
- `witness/docs/concepts/policy.md`
- `witness/docs/commands.md`
- `ITE/ITE/7/README.adoc`
