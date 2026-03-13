---
title: Build, Attest, Sign, and Verify
description: "Run the required Witness lab loop locally: create an artifact, record an attestation collection, sign a policy, and verify the artifact against it."
---

**Estimated time:** 25 minutes

**Audience:** readers who want to understand the minimum moving parts of a
software supply chain proof before adding Rego or Kubernetes.

This page assumes you already completed
[Set up the workspace lab](../setup-workspace/).

## What you will produce

```text
artifacts/hello.txt
      |
      +--> attestations/build.att.json
      |
      +--> policies/build-policy.json
      |
      +--> policies/build-policy.dsse.json
```

## 1. Generate local keys

Use one key for the functionary that signs the build evidence and a second key
for the policy authority that signs the policy document.

```sh
cd "$LAB_ROOT"

openssl genrsa -out keys/functionary.pem 2048
openssl rsa -in keys/functionary.pem -pubout -out keys/functionary.pub.pem

openssl genrsa -out keys/policy.pem 2048
openssl rsa -in keys/policy.pem -pubout -out keys/policy.pub.pem
```

## 2. Record a build step with Witness

This command creates `artifacts/hello.txt` and records a signed attestation
collection for the `build` step:

```sh
"$LAB_ROOT/bin/witness" run \
  --step build \
  --outfile "$LAB_ROOT/attestations/build.att.json" \
  --workingdir "$LAB_ROOT" \
  --signer-file-key-path "$LAB_ROOT/keys/functionary.pem" \
  -- bash -lc 'printf "hello from the SSCS lab\n" > artifacts/hello.txt'
```

What happened:

- `material` and `product` ran automatically
- `command-run` ran because you supplied a command
- `environment` and `git` ran because they are the default extra attestors in
  `witness/options/run.go`

## 3. Inspect the DSSE payload

```sh
jq -r '.payload' "$LAB_ROOT/attestations/build.att.json" | base64 -d | jq
```

Look for:

- the collection name `build`
- a `product` attestation that includes `artifacts/hello.txt`
- a `command-run` attestation showing `bash -lc`

## 4. Create a minimal Witness policy

Compute the key ID for the functionary public key and embed that key in the
policy:

```sh
FUNCTIONARY_KEY_ID="$(openssl dgst -sha256 "$LAB_ROOT/keys/functionary.pub.pem" | awk '{print $2}')"
FUNCTIONARY_KEY_B64="$(openssl base64 -A -in "$LAB_ROOT/keys/functionary.pub.pem")"

cat > "$LAB_ROOT/policies/build-policy.json" <<EOF
{
  "expires": "2035-12-17T23:57:40Z",
  "steps": {
    "build": {
      "name": "build",
      "attestations": [
        { "type": "https://witness.dev/attestations/material/v0.1" },
        { "type": "https://witness.dev/attestations/command-run/v0.1" },
        { "type": "https://witness.dev/attestations/product/v0.1" }
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

## 5. Lint and sign the policy

`policy check` is the fastest way to catch malformed JSON or broken functionary
references before you try verification.

```sh
"$LAB_ROOT/bin/witness" policy check --verbose "$LAB_ROOT/policies/build-policy.json"

"$LAB_ROOT/bin/witness" sign \
  --infile "$LAB_ROOT/policies/build-policy.json" \
  --outfile "$LAB_ROOT/policies/build-policy.dsse.json" \
  --signer-file-key-path "$LAB_ROOT/keys/policy.pem"
```

## 6. Verify the artifact against the signed policy

`witness verify` checks the policy signature with the policy authority key, then
checks the evidence against the functionary key embedded in the policy.

```sh
"$LAB_ROOT/bin/witness" verify \
  --artifactfile "$LAB_ROOT/artifacts/hello.txt" \
  --attestations "$LAB_ROOT/attestations/build.att.json" \
  --policy "$LAB_ROOT/policies/build-policy.dsse.json" \
  --publickey "$LAB_ROOT/keys/policy.pub.pem"
```

Expected result:

- exit status `0`
- log output ending in `Verification succeeded`

## What this lab proves

- the artifact digest is matched at verification time, not trusted by filename
- the build evidence and the policy are signed separately
- the policy decides which functionaries are trusted for the `build` step

## Next step

Move on to [Policy and admission-style checks](../policy-and-admission-checks/)
to add content-aware policy evaluation instead of checking only that the step
exists.

## Repository anchors

- `witness/cmd/run.go`
- `witness/cmd/sign.go`
- `witness/cmd/verify.go`
- `witness/options/{run,verify}.go`
- `go-witness/cryptoutil/util.go`
