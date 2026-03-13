---
title: SPIFFE / SPIRE
description: Learn workload identity from first principles, then map it onto the SPIFFE-backed flows in aflock, Witness, and in-toto attestations.
---

SPIFFE and SPIRE answer a basic software supply chain question:

Who is this workload, and why should I trust the signature it produced?

That question shows up throughout this workspace:

- [aflock](/aflock/) derives an agent identity and can map it into a SPIFFE ID.
- [Witness](/witness/) can sign DSSE envelopes with a certificate fetched from a
  SPIFFE Workload API socket.
- [in-toto ITE-7](/in-toto-ites/ite-7/) extends in-toto with x509-backed
  functionaries, trust bundles, and certificate constraints.

## The short version

Think of the stack like this:

```text
SPIFFE
  = the identity format and APIs
  = "this workload is spiffe://trust-domain/path"

SPIRE
  = a production system that issues those identities
  = server + agent + workload API + attestors

X.509 SVID
  = the short-lived certificate SPIRE gives a workload
  = the thing Witness and aflock code actually consume today
```

The repositories here are focused on `x509`-based SPIFFE flows, not JWT-SVID
flows. That is visible directly in the code:

- `go-witness/signer/spiffe/spiffe.go` calls `workloadapi.FetchX509Context`
- `aflock/internal/identity/spire.go` fetches `X509SVID` and `X509Context`
- [ITE-7](/in-toto-ites/ite-7/) describes certificate-backed functionaries,
  trust bundles, and URI constraints

## Why workload identity matters in SSCS

Static signing keys tell you which private key signed something. Workload
identity tells you which workload received a short-lived certificate at signing
time.

That difference matters when you want policy to say things like:

- only the build job in namespace `gitlab-runner` may sign release provenance
- only a Claude model under the `aflock.ai` trust domain may act as this
  functionary
- only attestations whose certificate contains
  `spiffe://example.com/step1` should satisfy this step

## Architecture at a glance

```text
                    registration + trust
     +-----------------------------------------------+
     |                 SPIRE Server                  |
     |  - trust domain                               |
     |  - CA / trust bundle                          |
     |  - workload registration entries              |
     +-------------------------+---------------------+
                               |
                               | control plane
                               v
     +-----------------------------------------------+
     |                 SPIRE Agent                   |
     |  - runs near workloads                        |
     |  - exposes the Workload API socket            |
     |  - validates selectors from unix/docker/k8s   |
     +-------------------------+---------------------+
                               |
                               | X.509 context
                               v
     +-----------------------------------------------+
     |                Application Code               |
     |  witness -> load SPIFFE signer from socket    |
     |  aflock  -> fetch identity / trust bundle     |
     +-----------------------------------------------+
```

## Read this section in order

- [SPIFFE IDs, trust domains, and SVIDs](./spiffe-ids-and-svids/) for the core
  vocabulary
- [SPIRE runtime model](./spire-runtime/) for the server, agent, and selector
  model used by the repos
- [aflock and agent identity](./aflock-and-agent-identity/) for the AI-agent
  mapping
- [Witness signing and in-toto verification](./witness-and-intoto/) for the
  CLI and policy surface
- [Local development with SPIRE](./local-development/) for the checked-in
  Docker-based dev stack

## What to keep straight

If you are new to the topic, do not blur these together:

- a `SPIFFE ID` is the workload identifier URI
- an `SVID` is the credential that proves the workload currently holds that ID
- a `trust domain` is the administrative boundary for those identities
- `SPIRE` is one implementation that issues SVIDs and exposes them through the
  Workload API

## Related sections

- [aflock agent identity](/aflock/agent-identity/)
- [aflock attestations and verification](/aflock/attestations-and-verification/)
- [witness signing methods](/witness/signing-methods/)
- [witness verify](/witness/witness-verify/)
- [in-toto attestations](/in-toto-attestations/)
- [in-toto ITE-7](/in-toto-ites/ite-7/)

## Primary source anchors

- `aflock/internal/identity/spire.go`
- `aflock/internal/identity/agent.go`
- `aflock/docker-compose.yml`
- `aflock/docker/spire/server/server.conf`
- `aflock/docker/spire/agent/agent.conf`
- `aflock/pkg/aflock/types.go`
- `go-witness/signer/spiffe/spiffe.go`
- `witness/docs/commands.md`
- `witness/docs/concepts/config.md`
- `witness/docs/concepts/policy.md`
- `ITE/ITE/7/README.adoc`
