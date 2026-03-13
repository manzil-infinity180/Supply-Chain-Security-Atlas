---
title: Zero to SLSA L3
description: A staged rollout plan that takes a team from no provenance to policy-enforced, identity-backed, higher-assurance supply chain controls.
---

This page is for teams that need an implementation plan, not a maturity badge.

Important boundary: SLSA levels are claims about your process and platform, not
switches you enable in one tool. The plan below shows how the workspace tools
map onto a realistic path toward SLSA L3-style controls.

## The staged rollout

| Stage | Goal | Practical output |
| --- | --- | --- |
| 0. Inventory | know what you build and where it ships | stable build steps, artifact names, repositories, and release owners |
| 1. Emit provenance | produce attestation evidence automatically | in-toto or SLSA provenance attached to every build |
| 2. Bind identity | make signatures meaningful | CI OIDC, developer hardware keys, Sigstore, or SPIFFE identity |
| 3. Verify before promotion | stop treating evidence as passive metadata | policy checks in CI, release, or deploy stages |
| 4. Harden the builder | raise assurance toward SLSA L3 | isolated runners, protected secrets, separation of duties, trusted build platform |

## Step 1: standardize the evidence format

Start with standard in-toto statements and common predicate types. This lets you
change CI systems or verifiers later without rewriting the trust model.

Good early producers from this workspace:

- GitHub artifact attestations for GitHub-native builds
- Tekton Chains for Tekton `TaskRuns`
- Witness for mixed CI environments or richer evidence capture

## Step 2: wrap the build, do not redesign it

Witness is useful early because it can sit around an existing command:

```sh
witness run \
  --step build \
  --outfile build.att.json \
  --signer-file-key-path testkey.pem \
  --attestations git,github,environment \
  -- make build
```

That command shape is grounded in the Witness docs and keeps adoption friction
low. The main goal at this stage is coverage: every important build produces
evidence consistently.

## Step 3: move from keys to verifiable identity

Once provenance exists, make the signer identity stronger:

- use GitHub OIDC or another CI identity for keyless signing
- use SPIFFE or SPIRE where workload identity already exists
- keep human release intent on separate keys where approvals matter

The question you are solving is not just "was this signed?" It is "was this
signed by the right workflow, workload, or person?"

## Step 4: add policy gates before shipping

Evidence becomes valuable when another system refuses to trust bad artifacts.
Common choices in this workspace include:

- `witness verify` with explicit policy
- in-toto layout verification
- Conforma for policy-based compliance decisions
- a deployment gate that checks GitHub, Sigstore, or stored attestations

This is the point where many teams first get real security value from the
metadata they have been collecting.

## Step 5: separate trust bootstrap from build execution

Datadog's TUF plus in-toto model is the strongest lesson in the workspace
sources. If the same CI system controls artifacts, layouts, and trusted keys,
then an attacker who compromises CI may be able to rewrite the whole story.

Protect these separately when the risk justifies it:

- trust roots and root layouts
- release approval keys
- artifact distribution metadata
- CI signing identities

## Step 6: harden toward SLSA L3

This is where process and platform controls dominate:

- isolate or dedicate build runners
- prevent unreviewed workflow changes from silently changing the signer identity
- restrict secret access and keep long-lived trust roots offline where possible
- record and verify builder provenance, not just artifact provenance
- require promotion-time verification rather than only build-time generation

Without these platform controls, you may still have useful attestations, but
you do not have the stronger assurance normally associated with SLSA L3.

## A practical roadmap by quarter

1. Quarter 1: inventory artifacts, standardize build step names, emit
   provenance everywhere.
2. Quarter 2: add identity constraints, central storage, and warning-mode
   verification.
3. Quarter 3: gate releases and deployments on policy.
4. Quarter 4: harden runners, separate duties, and audit exception handling.

## Related sections

- [Google / SLSA](../google-slsa/)
- [Datadog](../datadog/)
- [GitHub](../github/)
- [CNCF projects](../cncf-projects/)
- [Sigstore CI/CD patterns](/sigstore/ci-cd/)
- [SPIFFE / SPIRE](/spiffe-spire/)

## Primary source anchors

- `friends/slsa/README.md`
- `friends/datadog/README.md`
- `friends/github/README.md`
- `friends/tekton-chains/README.md`
- `friends/conforma/README.md`
- `witness/README.md`
- `witness/docs/attestors/github.md`
- `attestation/README.md`
- `ITE/ITE/2/README.adoc`
- `ITE/ITE/3/README.adoc`
- `ITE/ITE/6/README.adoc`
