---
title: Local SSCS Labs
description: Build a reproducible local lab with the workspace repos so you can practice build, attest, sign, verify, policy checks, and optional Kubernetes flows without cloud dependencies.
---

**Audience:** developers who know Git, shells, and CI basics but want a
repeatable hands-on SSCS environment.

**What you get:** one local workbench rooted in this workspace, a proven Witness
loop, a Rego-backed verification gate, an admission-style manifest check, and
optional extensions for Kubernetes and SPIRE-backed identity.

## What this section is for

This track keeps the lab small on purpose:

- the required path uses only the checked-out workspace repos plus local CLI
  tools
- the optional path adds `kind` or `k3d` for cluster experiments
- the optional identity extension reuses the checked-in `aflock`
  `docker-compose.yml` and SPIRE config

```text
workspace repos
    |
    +--> witness CLI lab
    |     build -> attest -> sign -> verify
    |
    +--> policy lab
    |     Rego gate -> local verification -> admission-style check
    |
    +--> optional extensions
          kind or k3d cluster
          aflock SPIRE dev stack
```

## Required vs optional tools

| Tool | Required for the base lab? | Why it is used |
| --- | --- | --- |
| `go` | Yes | Build `witness` and optionally `aflock` from the repos in this workspace. |
| `openssl` | Yes | Generate local signing keys for the functionary and policy authority roles. |
| `jq` | Yes | Inspect DSSE payloads and sanity-check generated JSON. |
| `git` | Yes | The default Witness `git` attestor expects the workbench to be a repository. |
| Docker + Compose | Optional | Reuse `aflock/docker-compose.yml` for the local SPIRE identity extension. |
| `kubectl` | Optional | Inspect or apply manifests during the Kubernetes extension. |
| `kind` or `k3d` | Optional | Run a throwaway local cluster for manifest and admission experiments. |

## What is implemented in this workspace

| Workspace anchor | How it fits into the lab | What to treat as broader ecosystem guidance |
| --- | --- | --- |
| `witness/cmd/{run,sign,verify}.go` | The concrete CLI loop used in the required exercises. | Your production rollout will still need your own CI wiring and key management. |
| `go-witness/attestation/k8smanifest/` | The manifest attestor behind the admission-style exercise. | A packaged admission controller is not shipped in this workspace. |
| `sscs-docs-site/examples/go-witness-snippets/kubernetes_admission_test.go` | A compile-tested local manifest verification loop you can run without a cluster. | It demonstrates the verification pattern, not a complete cluster operator. |
| `aflock/docker-compose.yml` and `aflock/docker/spire/*` | A small SPIRE-backed identity sandbox for local experiments. | It is a dev stack, not a production SPIRE deployment recipe. |
| `sscs-docs-site/examples/admission/*.yaml` | Example admission-policy resources you can inspect or apply in an optional cluster. | Sigstore Policy Controller, Kyverno, and Gatekeeper remain upstream components. |

## Pages in this track

- [Set up the workspace lab](./setup-workspace/) creates the workbench and
  builds the local binaries.
- [Build, attest, sign, and verify](./build-attest-sign-verify/) walks through
  the minimum Witness loop that proves the mechanics.
- [Policy and admission-style checks](./policy-and-admission-checks/) adds a
  Rego gate and a local manifest verification exercise.
- [Optional Kubernetes and SPIRE extension](./optional-kubernetes-and-spire/)
  shows how to extend the lab with `kind` or `k3d`, plus the checked-in SPIRE
  dev stack from `aflock`.
- [Reset and troubleshooting](./reset-and-troubleshooting/) gives cleanup
  commands and the failure modes you are most likely to hit.

## Recommended order

1. Start with [the Witness quick start](/witness/quick-start/) if you want the
   absolute minimum CLI loop first.
2. Build the local workbench in [Set up the workspace lab](./setup-workspace/).
3. Finish the required Witness loop in
   [Build, attest, sign, and verify](./build-attest-sign-verify/).
4. Add a Rego gate and a manifest check in
   [Policy and admission-style checks](./policy-and-admission-checks/).
5. Only then branch into [Kubernetes-native SSCS](/kubernetes-sscs/) or
   [SPIFFE / SPIRE](/spiffe-spire/) if you want cluster or workload-identity
   depth.

## Repository anchors

- `witness/cmd/run.go`
- `witness/cmd/sign.go`
- `witness/cmd/verify.go`
- `witness/options/{run,verify}.go`
- `go-witness/attestation/k8smanifest/k8s.go`
- `aflock/docker-compose.yml`
- `aflock/docker/spire/server/server.conf`
- `aflock/docker/spire/agent/agent.conf`
