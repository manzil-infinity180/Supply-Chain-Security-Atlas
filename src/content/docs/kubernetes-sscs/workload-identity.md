---
title: Workload identity
description: Use SPIFFE and SPIRE to replace long-lived signing keys with workload identity in Kubernetes-oriented attestation flows.
---

For Kubernetes, the strongest signing story is usually:

the thing that signs release evidence should be the workload that actually ran
the step, not a private key copied into a secret.

## What the workspace already implements

| Source anchor | What it proves |
| --- | --- |
| `go-witness/signer/spiffe/spiffe.go` | `go-witness` can fetch an X.509-SVID from the SPIFFE Workload API socket and turn it into a signer. |
| `witness/docs/commands.md` | The CLI exposes `--signer-spiffe-socket-path` for that signer. |
| `aflock/internal/identity/spire.go` | `aflock` uses `SPIFFE_ENDPOINT_SOCKET` and defaults to `unix:///tmp/spire-agent/public/api.sock`. |
| `aflock/docker-compose.yml` | The local lab stack wires a SPIRE server, SPIRE agent, and a workload sharing the agent socket. |

## Local lab path from this workspace

The checked-in `aflock` compose file is the easiest way to see the identity
plumbing:

```sh
cd aflock
docker compose up -d
docker compose exec aflock-test env | grep SPIFFE_ENDPOINT_SOCKET
```

That gives you:

- a SPIRE server
- a SPIRE agent
- a workload container with the Workload API socket mounted read-only

## Signing a Kubernetes delivery step with SPIFFE

Once a workload can see the socket, the CLI path is:

```sh
export SPIFFE_ENDPOINT_SOCKET=unix:///tmp/spire-agent/public/api.sock

witness run \
  --step render-manifests \
  -a k8smanifest \
  --signer-spiffe-socket-path "$SPIFFE_ENDPOINT_SOCKET" \
  -- sh -lc 'kustomize build ./k8s > dist/release.yaml'
```

That swaps a file-backed key for workload identity backed by SPIRE-issued
certificates.

## What changes in Kubernetes

In a real cluster, this usually means:

- SPIRE issues identities to CI runners, deployment controllers, or admission
  services
- those workloads sign or verify evidence using the Workload API
- policy checks trust certificate URIs that encode SPIFFE IDs

The policy side is already reflected in Witness policy docs, where certificate
URI constraints can match values such as `spiffe://example.com/step1`.

## Why this matters for cluster delivery

Without workload identity:

- signing keys become another secret to distribute
- signer identity is easy to blur across jobs and environments

With workload identity:

- the platform decides which workload gets which identity
- certificates are short-lived
- policy can distinguish one build or deployment workload from another

## Keep the boundary clear

What is implemented in this workspace:

- local SPIRE development
- SPIFFE-backed signing support in `go-witness`
- SPIRE-inspired identity modeling in `aflock`

What you still need from the broader ecosystem:

- a SPIRE deployment pattern for your cluster
- registration rules for runners, controllers, or webhooks
- trust-bundle distribution for verifiers

## Related sections

- [SPIFFE / SPIRE overview](/spiffe-spire/)
- [Witness signing methods](/witness/signing-methods/)
- [aflock and agent identity](/spiffe-spire/aflock-and-agent-identity/)
- [Witness and in-toto with SPIFFE](/spiffe-spire/witness-and-intoto/)
