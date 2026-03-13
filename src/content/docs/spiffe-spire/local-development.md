---
title: Local development with SPIRE
description: Reuse the SPIRE dev stack checked into aflock to experiment locally with workload identity, socket plumbing, and SPIFFE-aware signing.
---

This page is for local experimentation, not a production hardening guide.

## What is already checked in

The `aflock` repo includes a Docker Compose setup that starts:

- `spire-server`
- `spire-agent`
- `aflock-test`

The relevant files are:

- `aflock/docker-compose.yml`
- `aflock/docker/spire/server/server.conf`
- `aflock/docker/spire/agent/agent.conf`

## Start the stack

From the workspace root:

```sh
cd aflock
docker compose up -d spire-server spire-agent aflock-test
```

The compose file wires in the important pieces:

- the server listens on port `8081`
- the agent exposes `/tmp/spire-agent/public/api.sock`
- `aflock-test` mounts that socket read-only
- `aflock-test` exports
  `SPIFFE_ENDPOINT_SOCKET=unix:///tmp/spire-agent/public/api.sock`

## Check health

The compose file already defines health checks for both SPIRE services, so the
first thing to inspect is:

```sh
docker compose ps
```

If both `spire-server` and `spire-agent` are healthy, verify the workload-facing
socket from inside the test container:

```sh
docker compose exec aflock-test ls -l /tmp/spire-agent/public/api.sock
docker compose exec aflock-test env | grep SPIFFE_ENDPOINT_SOCKET
```

## Understand the defaults

The checked-in configuration uses:

- trust domain `aflock.ai`
- default x509 SVID TTL `1h`
- server datastore `sqlite3`
- node attestation `join_token`
- workload attestors `unix` and `docker`

Those are small dev-friendly defaults, not a complete production policy set.

## The missing step most people forget

Starting SPIRE is not the same as registering workloads.

The compose files give you:

- a trust domain
- a running server and agent
- a mounted Workload API socket

For a workload to receive a useful identity, you still need registration
entries whose selectors match that workload.

The selector-driven pattern is visible in
`witness/dev/build-and-push-builders.sh`:

```sh
spire-server entry create \
  -parentID "${node}" \
  -spiffeID spiffe://dev.testifysec.com/witness-demo/builder \
  -selector k8s:container-image:"${imagetag}" \
  -selector k8s:ns:gitlab-runner
```

For local experiments, the exact selectors depend on how you launch the
workload and which attestors you want to rely on.

## Using the socket in code and CLIs

Once the socket is available, the repo surfaces line up cleanly:

- `aflock` reads `SPIFFE_ENDPOINT_SOCKET` and defaults to
  `unix:///tmp/spire-agent/public/api.sock`
- `Witness` accepts `--signer-spiffe-socket-path /tmp/spire-agent/public/api.sock`
- `go-witness` fetches the default X.509 SVID from that socket

## Suggested local learning sequence

1. bring up the Compose stack
2. confirm the agent socket is present in `aflock-test`
3. inspect how `aflock/internal/identity/spire.go` resolves the socket path
4. inspect how `go-witness/signer/spiffe/spiffe.go` consumes the x509 context
5. add registration entries appropriate for your test workload
6. try a SPIFFE-backed `witness run` or an `aflock` integration test

## Production caution

Do not copy this Compose setup into production unchanged.

It is useful because it is small and readable. It is not a full example of:

- registration lifecycle management
- upstream CA hardening
- multi-node trust distribution
- namespace isolation
- workload selector design

## Related sections

- [SPIRE runtime model](../spire-runtime/)
- [aflock and agent identity](../aflock-and-agent-identity/)
- [Witness signing and in-toto verification](../witness-and-intoto/)

## Primary source anchors

- `aflock/docker-compose.yml`
- `aflock/docker/spire/server/server.conf`
- `aflock/docker/spire/agent/agent.conf`
- `aflock/internal/identity/spire.go`
- `witness/dev/build-and-push-builders.sh`
