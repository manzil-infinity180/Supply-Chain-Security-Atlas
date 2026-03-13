---
title: Presets
description: How rookery's preset packages and builder presets work, and where they currently diverge.
---

`rookery` has two preset mechanisms with the same names but different source
files:

- preset packages in `presets/*/imports.go`
- builder preset lists in `builder/cmd/builder/main.go`

They are related, but they are not exact mirrors.

## Preset packages

These are normal Go packages that only blank-import selected plugins.

Example:

```go
import (
    _ "github.com/aflock-ai/rookery/presets/minimal"
)
```

Current package memberships are:

| Preset package | Attestors | Signers |
| --- | --- | --- |
| `minimal` | `commandrun`, `environment`, `git`, `material`, `product` | `file` |
| `cicd` | `commandrun`, `configuration`, `environment`, `git`, `github`, `githubaction`, `gitlab`, `material`, `product`, `slsa` | `file` |
| `all` | `aws-codebuild`, `aws`, `commandrun`, `configuration`, `docker`, `environment`, `gcp-iit`, `git`, `github`, `githubaction`, `gitlab`, `jenkins`, `jwt`, `k8smanifest`, `link`, `lockfiles`, `material`, `maven`, `oci`, `omnitrail`, `product`, `sarif`, `sbom`, `secretscan`, `slsa`, `system-packages`, `vex` | `debug`, `file`, `fulcio`, `kms/aws`, `kms/azure`, `kms/gcp`, `spiffe`, `vault`, `vault-transit` |

## Builder presets

The builder keeps its own preset map instead of importing those preset
packages. Current builder memberships are:

| Builder preset | Attestors | Signers |
| --- | --- | --- |
| `minimal` | `commandrun`, `environment`, `git`, `material`, `product` | `file` |
| `cicd` | `commandrun`, `environment`, `git`, `github`, `gitlab`, `material`, `product`, `slsa` | `file` |
| `all` | `aws-codebuild`, `aws`, `commandrun`, `docker`, `environment`, `gcp-iit`, `git`, `github`, `githubwebhook`, `gitlab`, `jenkins`, `jwt`, `k8smanifest`, `link`, `lockfiles`, `material`, `maven`, `oci`, `omnitrail`, `policyverify`, `product`, `sarif`, `sbom`, `secretscan`, `slsa`, `system-packages`, `vex` | `debug`, `file`, `fulcio`, `kms/aws`, `kms/azure`, `kms/gcp`, `spiffe`, `vault`, `vault-transit` |

## Where they differ

`minimal` is aligned across both surfaces.

`cicd` differs today:

- preset package `cicd` includes `configuration` and `githubaction`
- builder preset `cicd` does not

`all` also differs today:

- preset package `all` includes `configuration` and `githubaction`
- builder preset `all` includes `githubwebhook` and `policyverify`
- neither surface matches the full `cilock` import list exactly

That means you should treat the preset name as a source-specific shorthand, not
as a universal contract.

## Choosing the right surface

- Use `presets/*` when you are writing your own Go binary and want blank-import
  convenience.
- Use builder presets when you are driving `rookery-builder`.
- Use `cilock` when you want the broadest shipped command surface without
  reconciling preset differences yourself.

## Example: package preset

```go
package main

import (
    "fmt"
    "sort"

    "github.com/aflock-ai/rookery/attestation"
    _ "github.com/aflock-ai/rookery/presets/minimal"
)

func main() {
    entries := attestation.RegistrationEntries()
    names := make([]string, 0, len(entries))
    for _, entry := range entries {
        names = append(names, entry.Name)
    }
    sort.Strings(names)
    fmt.Println(names)
}
```

## Example: builder preset

```bash
go run ./builder/cmd/builder --local --preset minimal --output ./rookery-minimal
./rookery-minimal attestors
./rookery-minimal signers
```

## Repository anchors

- `rookery/presets/minimal/imports.go`
- `rookery/presets/cicd/imports.go`
- `rookery/presets/all/imports.go`
- `rookery/builder/cmd/builder/main.go`
