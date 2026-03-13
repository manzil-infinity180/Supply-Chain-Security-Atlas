---
title: Policy reference
description: Field-by-field reference for .aflock, including which fields are implemented today and which are broader draft-spec concepts.
---

This page is for authors of `.aflock` files. It is based primarily on
`pkg/aflock/types.go`, with notes where repository examples or draft prose go
beyond the current Go structs.

## Top-level shape

```json
{
  "version": "1.0",
  "name": "example-policy",
  "expires": "2026-12-31T00:00:00Z",
  "roots": {},
  "steps": {},
  "identity": {},
  "grants": {},
  "limits": {},
  "tools": {},
  "files": {},
  "domains": {},
  "dataFlow": {},
  "hooks": {},
  "sublayouts": [],
  "requiredAttestations": [],
  "attestationDir": "./attestations",
  "attestationsFrom": [],
  "materialsFrom": {},
  "evaluators": {},
  "functionaries": []
}
```

## Field status

| Field | What it does | Current status |
| --- | --- | --- |
| `version` | schema version string | Implemented |
| `name` | human-readable policy name | Implemented |
| `expires` | expiration timestamp checked by step verification | Implemented |
| `roots` | trusted certificates for step-attestation verification | Implemented |
| `steps` | named supply-chain steps with allowed functionaries and required attestation types | Implemented |
| `identity` | allowed models, environments, required tools | Partially enforced today |
| `grants` | secrets, API, and storage grants | Schema present, informational in current runtime |
| `limits` | spend, token, turn, wall-clock, and tool-call budgets | Implemented |
| `tools` | allow, deny, and require-approval patterns | Implemented |
| `files` | allow, deny, read-only path patterns | Implemented |
| `domains` | allow and deny lists for URL-based network access | Implemented for network tools |
| `dataFlow` | taint-style classification and blocked source-to-sink flows | Implemented |
| `hooks` | hook-specific runtime settings | Schema present |
| `sublayouts` | child-policy delegation and attenuation | Partially implemented |
| `requiredAttestations` | required logical attestation names for hook sessions | Implemented |
| `attestationDir` | legacy field used by examples | Schema only in current code |
| `attestationsFrom` | legacy pattern list used by examples/spec prose | Schema only in current code |
| `materialsFrom` | session, git, and artifact bindings | Implemented as a compact struct; richer draft examples exist |
| `evaluators` | Rego, AI, and gRPC evaluators | Structs exist; current CLI verify path is step-focused |
| `functionaries` | legacy top-level signer constraints | Schema present; step verification prefers `steps[*].functionaries` |

## Minimal enforcement policy

This is a small policy that matches the fields aflock actively evaluates in
hook and MCP enforcement paths:

```json
{
  "version": "1.0",
  "name": "safe-local-editing",
  "identity": {
    "allowedModels": ["claude-opus-4-5-20251101", "claude-sonnet-4-*"],
    "requiredTools": ["Read", "Edit", "Bash"]
  },
  "limits": {
    "maxSpendUSD": { "value": 10, "enforcement": "fail-fast" },
    "maxTurns": { "value": 40, "enforcement": "post-hoc" },
    "maxToolCalls": { "value": 200, "enforcement": "post-hoc" }
  },
  "tools": {
    "allow": ["Read", "Edit", "Glob", "Grep", "Bash:git *", "Bash:go test *"],
    "deny": ["Task", "Bash:curl *"],
    "requireApproval": ["Bash:git push *", "Bash:rm *"]
  },
  "files": {
    "allow": ["src/**", "tests/**", "go.mod"],
    "deny": ["**/.env", "**/secrets/**"],
    "readOnly": ["go.mod"]
  },
  "domains": {
    "allow": ["github.com", "pkg.go.dev"],
    "deny": ["*"]
  },
  "dataFlow": {
    "classify": {
      "secret": ["Read:**/.env", "Read:**/secrets/**"]
    },
    "flowRules": [
      {
        "deny": "secret->public",
        "message": "Secrets must not leave the local workspace"
      }
    ]
  }
}
```

## Limits

`Limit` supports both object and bare-number forms. In the bare-number form,
aflock defaults `enforcement` to `fail-fast`.

```json
{
  "limits": {
    "maxSpendUSD": 5,
    "maxTurns": { "value": 30, "enforcement": "post-hoc" }
  }
}
```

Supported limit fields:

- `maxSpendUSD`
- `maxTokensIn`
- `maxTokensOut`
- `maxTurns`
- `maxWallTimeSeconds`
- `maxToolCalls`

## Tool patterns

`internal/policy/evaluator.go` checks tools in this order:

1. `tools.deny`
2. `tools.requireApproval`
3. file and domain restrictions
4. `tools.allow`

Patterns can be plain tool names such as `Read` or tool-plus-command patterns
such as `Bash:git *`. The Bash path is intentionally stricter: the evaluator
also inspects chained commands, pipes to shells, inline interpreters, `eval`,
and variable indirection to stop bypasses.

## File and domain rules

- `files.allow`, `files.deny`, and `files.readOnly` are glob-based.
- `domains` applies to URL-bearing operations, especially `WebFetch`.
- Bash commands get extra file-path analysis so `cat secrets.txt` does not
  bypass `files.deny` just because it was invoked through `Bash`.

## Data-flow rules

`dataFlow.classify` tags observed materials, and `flowRules` blocks unsafe
source-to-sink movement:

```json
{
  "dataFlow": {
    "classify": {
      "internal": ["Read:reports/**"],
      "secret": ["Read:**/.env", "Read:**/credentials.*"]
    },
    "flowRules": [
      {
        "deny": "secret->public",
        "message": "Credential material cannot be sent to public channels"
      }
    ]
  }
}
```

## Step verification fields

`verify` becomes interesting when you define `roots` and `steps`:

```json
{
  "roots": {
    "ci-root": {
      "certificate": "./certs/ci-root.pem"
    }
  },
  "steps": {
    "test": {
      "name": "test",
      "functionaries": [
        {
          "type": "root",
          "certConstraint": {
            "commonName": "ci.example.internal"
          }
        }
      ],
      "attestations": [
        {
          "type": "https://aflock.ai/attestations/product/v0.1"
        }
      ]
    }
  }
}
```

The verifier loads root certificates, verifies DSSE signatures, checks
collection names against step names, and validates artifact chaining through
`artifactsFrom`.

## Draft-spec versus current structs

Two areas are worth calling out:

- Repository examples and the draft specification show richer
  `materialsFrom.session.constraints` blocks, but `SessionMaterial` in
  `pkg/aflock/types.go` currently stores only `path`, `merkleRoot`, and
  `algorithm`.
- `evaluators` and top-level `functionaries` are well-described in repository
  prose, but the strongest current verification path is the step model under
  `roots` and `steps`.

## Repository anchors

- `aflock/pkg/aflock/types.go`
- `aflock/internal/policy/evaluator.go`
- `aflock/examples/todo-app-verification.aflock`
- `aflock/examples/compliance-evaluation.aflock`
