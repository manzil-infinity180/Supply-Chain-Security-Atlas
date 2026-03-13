---
title: Reset and Troubleshooting
description: Cleanly reset the local SSCS lab and diagnose the most common Witness, Kubernetes, and SPIRE issues you will hit while repeating the exercises.
---

**Audience:** readers who want to rerun the lab from a clean slate or debug why
their local evidence no longer verifies.

## Reset the base workbench

If you want to keep the workbench directory but remove generated outputs:

```sh
rm -f "$LAB_ROOT"/artifacts/*
rm -f "$LAB_ROOT"/attestations/*
rm -f "$LAB_ROOT"/keys/*
rm -f "$LAB_ROOT"/policies/*.json
```

If you want to recreate the entire lab from scratch:

```sh
rm -rf "$LAB_ROOT"
```

Then rerun [Set up the workspace lab](../setup-workspace/).

## Common failures and fixes

| Symptom | Likely cause | What to check |
| --- | --- | --- |
| `no signers found` from `witness run` or `witness sign` | The private-key flag was omitted or points at the wrong file. | Confirm `--signer-file-key-path` points at a PEM private key under `keys/`. |
| `must supply either a public key, CA certificates or a verifier` from `witness verify` | You passed the wrong verification input. | `--publickey` is for the policy signer, not the build functionary. |
| Verification fails after you edit the build command | The Rego gate is doing its job. | Decode `build.att.json` and compare the `command-run` fields to `policies/command.rego`. |
| `witness policy check` rejects the lab Rego module but `witness verify` accepts it | The CLI linter and runtime verifier are using different Rego parser behavior in this repo snapshot. | For the local lab, use the legacy `deny[msg]` module shape shown on the policy page, sanity-check JSON with `jq`, and treat this as a current repo limitation. |
| The `git` attestor reports missing repo context | The workbench was not initialized as a Git repository. | Run the `git init` and first commit steps from [Set up the workspace lab](../setup-workspace/). |
| `SPIRE workload API not available` | The optional SPIRE stack is not running or the socket is not mounted. | Check `docker compose ps` in `aflock/` and confirm `/tmp/spire-agent/public/api.sock` exists inside `aflock-test`. |
| `kubectl` cannot reach the cluster | The optional cluster is gone or your current context changed. | Run `kubectl config current-context` and `kubectl cluster-info`. |

## Decode evidence before changing policy

Many verification bugs are really evidence-shape misunderstandings. Inspect the
attestation payload first:

```sh
jq -r '.payload' "$LAB_ROOT/attestations/build.att.json" | base64 -d | jq
```

This lets you answer:

- which attestation types were actually recorded
- what command array Rego sees
- which subject digest the collection is tied to

## Validate local assets mechanically

Useful quick checks while you iterate:

```sh
jq empty "$LAB_ROOT/policies/build-policy.json"
jq empty "$LAB_ROOT/policies/command-policy.json"
kubectl apply --dry-run=client -f "$LAB_ROOT/manifests/release.yaml"
```

If you want to re-run the compile-tested manifest check:

```sh
cd "$SSCS_WORKSPACE/sscs-docs-site/examples/go-witness-snippets"
go test -run TestKubernetesAdmissionStyleVerification -v ./...
```

## When to stop debugging locally

Stay in the local lab when the issue is about:

- key handling
- policy structure
- Rego logic
- manifest parsing

Move to the broader docs when the issue is about:

- CI identity in GitHub Actions or GitLab
- Sigstore keyless certificates
- cluster admission controller installation
- multi-workload SPIRE registration design

## Related sections

- [Tutorials](/tutorials/)
- [Witness troubleshooting](/witness/troubleshooting/)
- [Admission and policy enforcement](/kubernetes-sscs/admission-policy-enforcement/)
- [SPIFFE / SPIRE local development](/spiffe-spire/local-development/)

## Repository anchors

- `witness/cmd/{run,sign,verify}.go`
- `witness/options/{run,verify}.go`
- `aflock/internal/identity/spire.go`
- `sscs-docs-site/examples/go-witness-snippets/kubernetes_admission_test.go`
