---
title: Optional Kubernetes and SPIRE Extension
description: Extend the local lab with a throwaway kind or k3d cluster and the checked-in aflock SPIRE sandbox, while keeping the required Witness lab path separate.
---

**Estimated time:** 30 to 45 minutes

**Audience:** readers who finished the base lab and want to connect it to local
cluster or workload-identity experiments.

This page is intentionally split into two optional tracks. You do not need both.

## Track 1: local Kubernetes with kind or k3d

This is broader ecosystem guidance layered on top of the workspace repos. The
attestation and verification logic is grounded here; the cluster runtime itself
comes from upstream `kind` or `k3d`.

### What this track is for

- running the checked-in manifest examples against a disposable cluster
- testing `kubectl` flows before you involve a shared dev cluster
- connecting the local lab to the Kubernetes pages in this docs site

### Create a cluster

Use one of these upstream defaults:

```sh
kind create cluster --name sscs-lab --wait 60s
```

```sh
k3d cluster create sscs-lab
```

After either command:

```sh
kubectl cluster-info
kubectl get nodes -o wide
```

### Optional: import a local image

If you also build a local image for manifest testing, use the cluster-specific
import command instead of assuming the cluster can see your host daemon
automatically:

```sh
kind load docker-image ghcr.io/acme/demo:local --name sscs-lab
```

```sh
k3d image import ghcr.io/acme/demo:local --cluster sscs-lab
```

### Connect the lab to Kubernetes content in this workspace

Use the checked-in manifest example as your deployment subject:

```sh
kubectl apply --dry-run=client -f "$LAB_ROOT/manifests/release.yaml"
```

Then compare the local lab flow to these pages:

- [Kubernetes-native SSCS](/kubernetes-sscs/)
- [Attesting images and manifests](/kubernetes-sscs/attesting-images-and-manifests/)
- [Verification and admission](/kubernetes-sscs/verification-and-admission/)

## Track 2: local SPIRE-backed identity with aflock

This track is grounded entirely in the `aflock/` repo checked into this
workspace.

### Start the checked-in SPIRE dev stack

```sh
cd "$SSCS_WORKSPACE/aflock"
docker compose up -d spire-server spire-agent aflock-test
docker compose ps
```

The compose file wires:

- `spire-server` on port `8081`
- the Workload API socket at `/tmp/spire-agent/public/api.sock`
- `aflock-test` with `SPIFFE_ENDPOINT_SOCKET` pointing at that socket

### Confirm the socket path from inside the test container

```sh
docker compose exec aflock-test ls -l /tmp/spire-agent/public/api.sock
docker compose exec aflock-test env | grep SPIFFE_ENDPOINT_SOCKET
```

This lines up with the default path in `aflock/internal/identity/spire.go`:

- `unix:///tmp/spire-agent/public/api.sock`

### Understand the scope of the checked-in stack

What you get:

- readable server and agent config
- local socket plumbing for Workload API experiments
- a small sandbox for following the `aflock` identity model

What you do not get automatically:

- workload registration entries
- production trust-domain design
- multi-node or multi-namespace SPIRE operations

For the larger identity model, continue with:

- [SPIFFE / SPIRE local development](/spiffe-spire/local-development/)
- [aflock agent identity](/aflock/agent-identity/)
- [aflock attestations and verification](/aflock/attestations-and-verification/)

## Cleanup

Delete whichever optional environment you created:

```sh
kind delete cluster --name sscs-lab
```

```sh
k3d cluster delete sscs-lab
```

```sh
cd "$SSCS_WORKSPACE/aflock"
docker compose down -v
```

## Repository anchors

- `go-witness/attestation/k8smanifest/k8s.go`
- `sscs-docs-site/examples/admission/*.yaml`
- `aflock/docker-compose.yml`
- `aflock/docker/spire/server/server.conf`
- `aflock/docker/spire/agent/agent.conf`
- `aflock/internal/identity/spire.go`
