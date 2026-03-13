---
title: SPIRE runtime model
description: See how the checked-in repos model SPIRE as a server, an agent, a local socket, and a set of attestors that decide which workload gets which identity.
---

This page is about the runtime picture, not just vocabulary.

## The model used in this workspace

The `aflock` repository includes a concrete SPIRE dev stack in
`aflock/docker-compose.yml`, `aflock/docker/spire/server/server.conf`, and
`aflock/docker/spire/agent/agent.conf`.

That stack shows the minimum moving parts:

```text
SPIRE Server
  - trust domain: aflock.ai
  - CA + trust bundle
  - registration entries

SPIRE Agent
  - joins the server
  - runs close to workloads
  - exposes /tmp/spire-agent/public/api.sock
  - evaluates workload selectors

Workload
  - reads X.509 SVIDs from the local Workload API socket
  - signs or authenticates with that short-lived identity
```

## What the checked-in configs tell you

### Server configuration

`aflock/docker/spire/server/server.conf` sets:

- `trust_domain = "aflock.ai"`
- `bind_port = "8081"`
- `default_x509_svid_ttl = "1h"`
- `DataStore "sql"` using SQLite
- `NodeAttestor "join_token"`
- `UpstreamAuthority "disk"`

That gives you a small but real trust domain with short-lived x509 SVIDs.

### Agent configuration

`aflock/docker/spire/agent/agent.conf` sets:

- `server_address = "spire-server"`
- `socket_path = "/tmp/spire-agent/public/api.sock"`
- `trust_domain = "aflock.ai"`
- `NodeAttestor "join_token"`
- `WorkloadAttestor "unix"`
- `WorkloadAttestor "docker"`

The important part for day-to-day docs readers is the last two lines:

- `unix` selectors let SPIRE reason about process-level properties
- `docker` selectors let SPIRE reason about container-image and container
  placement details

## Why the agent matters more than the server to app code

Application code rarely needs to know the server address. It usually needs only
the Workload API socket.

That is exactly what the code does today:

- `aflock/internal/identity/spire.go` creates a client with
  `workloadapi.New(..., workloadapi.WithAddr(socketPath))`
- `go-witness/signer/spiffe/spiffe.go` calls
  `workloadapi.FetchX509Context(..., workloadapi.WithAddr(socketPath))`

The server is still essential, but it is not the process the app typically
talks to directly.

## Registration entries are the control point

The checked-in `aflock` compose files start the server and agent, but they do
not themselves define every workload registration entry you might need.

You can see the registration pattern in `witness/dev/build-and-push-builders.sh`
where the repo creates entries like:

```sh
spire-server entry create \
  -parentID "${node}" \
  -spiffeID spiffe://dev.testifysec.com/witness-demo/builder \
  -selector k8s:container-image:"${imagetag}" \
  -selector k8s:ns:gitlab-runner
```

That shows the important SPIRE idea: a workload gets an identity because it
matches selectors, not because the workload self-declared a name.

## Mental model for selectors

```text
selector facts observed by SPIRE
  -> container image
  -> namespace
  -> unix process properties
  -> other runtime attributes

registration entry
  -> if selectors match, issue this SPIFFE ID

result
  -> workload receives an X.509 SVID for that ID
```

## Why this fits SSCS

Supply chain security is stronger when identity comes from verifiable runtime
facts instead of long-lived secrets copied into jobs.

That is why SPIRE shows up naturally beside:

- [Witness](/witness/) signing
- [Sigstore](/sigstore/) keyless ideas
- [aflock](/aflock/) derived identity and functionary matching
- [in-toto ITE-7](/in-toto-ites/ite-7/) certificate-backed functionaries

## Related sections

- [SPIFFE IDs, trust domains, and SVIDs](../spiffe-ids-and-svids/)
- [Local development with SPIRE](../local-development/)

## Primary source anchors

- `aflock/docker-compose.yml`
- `aflock/docker/spire/server/server.conf`
- `aflock/docker/spire/agent/agent.conf`
- `aflock/internal/identity/spire.go`
- `go-witness/signer/spiffe/spiffe.go`
- `witness/dev/build-and-push-builders.sh`
