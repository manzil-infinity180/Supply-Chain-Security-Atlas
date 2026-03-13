---
title: Policy and Admission-Style Checks
description: Extend the local lab with a Rego-backed Witness policy and a manifest verification exercise that mirrors admission decisions without requiring a cluster.
---

**Estimated time:** 30 minutes

**Audience:** readers who already understand the basic Witness loop and want to
turn it into a gate instead of a record.

This page assumes the files from
[Build, attest, sign, and verify](../build-attest-sign-verify/) already exist.

## Exercise A: add a Rego gate to the build step

The checked-in `command.rego` file is intentionally narrow: it asserts that the
build command exited cleanly and that the shell fragment matches the lab
exercise.

### 1. Review the Rego module

```txt
package commandrun

deny[msg] {
  input.exitcode != 0
  msg := "exitcode not 0"
}

deny[msg] {
  input.cmd[2] != "printf \"hello from the SSCS lab\\n\" > artifacts/hello.txt"
  msg := "build command not correct"
}
```

That exact file is stored at
`sscs-docs-site/examples/local-lab/command.rego` and was copied into
`$LAB_ROOT/policies/command.rego` on the setup page.

Current repo nuance:

- the runtime verification path exercised by `witness verify` and
  `go-witness/policy/rego_test.go` accepts this legacy `deny[msg]` form
- `witness policy check` currently validates Rego with a different parser path
  and rejects the same module in this workspace snapshot

For that reason, the runnable lab below verifies the policy directly and uses
`jq` for JSON sanity checks instead of `witness policy check`.

### 2. Build a policy that embeds the Rego module

```sh
FUNCTIONARY_KEY_ID="$(openssl dgst -sha256 "$LAB_ROOT/keys/functionary.pub.pem" | awk '{print $2}')"
FUNCTIONARY_KEY_B64="$(openssl base64 -A -in "$LAB_ROOT/keys/functionary.pub.pem")"
COMMAND_REGO_B64="$(openssl base64 -A -in "$LAB_ROOT/policies/command.rego")"

cat > "$LAB_ROOT/policies/command-policy.json" <<EOF
{
  "expires": "2035-12-17T23:57:40Z",
  "steps": {
    "build": {
      "name": "build",
      "attestations": [
        { "type": "https://witness.dev/attestations/material/v0.1" },
        { "type": "https://witness.dev/attestations/product/v0.1" },
        {
          "type": "https://witness.dev/attestations/command-run/v0.1",
          "regoPolicies": [
            { "name": "expected-command", "module": "${COMMAND_REGO_B64}" }
          ]
        }
      ],
      "functionaries": [
        { "type": "publickey", "publickeyid": "${FUNCTIONARY_KEY_ID}" }
      ]
    }
  },
  "publickeys": {
    "${FUNCTIONARY_KEY_ID}": {
      "keyid": "${FUNCTIONARY_KEY_ID}",
      "key": "${FUNCTIONARY_KEY_B64}"
    }
  }
}
EOF
```

### 3. Sanity-check the JSON, then sign and verify

```sh
jq empty "$LAB_ROOT/policies/command-policy.json"

"$LAB_ROOT/bin/witness" sign \
  --infile "$LAB_ROOT/policies/command-policy.json" \
  --outfile "$LAB_ROOT/policies/command-policy.dsse.json" \
  --signer-file-key-path "$LAB_ROOT/keys/policy.pem"

"$LAB_ROOT/bin/witness" verify \
  --artifactfile "$LAB_ROOT/artifacts/hello.txt" \
  --attestations "$LAB_ROOT/attestations/build.att.json" \
  --policy "$LAB_ROOT/policies/command-policy.dsse.json" \
  --publickey "$LAB_ROOT/keys/policy.pub.pem"
```

If you change the shell command and re-run the build, verification should fail.

## Exercise B: run an admission-style manifest check locally

The local lab does not need a cluster to teach the decision point. The
compile-tested snippet in `examples/go-witness-snippets/` already demonstrates
the pattern:

- build or load a manifest
- record `product` and `k8smanifest` evidence
- verify the manifest before it would reach admission

Run that example directly:

```sh
cd "$SSCS_WORKSPACE/sscs-docs-site/examples/go-witness-snippets"
go test -run TestKubernetesAdmissionStyleVerification -v ./...
```

Why this is a useful local exercise:

- it is grounded in `go-witness/attestation/k8smanifest/k8s.go`
- it proves the verification model without asking you to install a controller
- it uses the same manifest-attestation concept you would later move behind
  admission in a cluster

## Inspect the manifest asset and admission resources

The lab workbench already contains `manifests/release.yaml`, copied from the
checked-in example:

```sh
sed -n '1,160p' "$LAB_ROOT/manifests/release.yaml"
```

If you want to compare that local pattern to upstream admission resources, look
at:

- `sscs-docs-site/examples/admission/sigstore-clusterimagepolicy.yaml`
- `sscs-docs-site/examples/admission/kyverno-imagevalidatingpolicy.yaml`
- `sscs-docs-site/examples/admission/gatekeeper-allowed-registry-digest.yaml`

## What to learn from this page

- Witness policies can check attestation content, not just attestation presence
- admission is just a later enforcement point for the same verification model
- you can learn the manifest flow locally before adding a cluster

## Next steps

- Continue to [Optional Kubernetes and SPIRE extension](../optional-kubernetes-and-spire/)
- Read [witness verify](/witness/witness-verify/)
- Read [Admission and policy enforcement](/kubernetes-sscs/admission-policy-enforcement/)

## Repository anchors

- `witness/cmd/policy_check.go`
- `witness/docs/tutorials/artifact-policy.md`
- `go-witness/policy/rego.go`
- `go-witness/attestation/k8smanifest/k8s.go`
- `sscs-docs-site/examples/go-witness-snippets/policy_rego_test.go`
- `sscs-docs-site/examples/go-witness-snippets/kubernetes_admission_test.go`
