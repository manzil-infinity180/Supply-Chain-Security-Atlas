package gowitnesssnippets

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"os"
	"path/filepath"
	"testing"

	witness "github.com/in-toto/go-witness"
	"github.com/in-toto/go-witness/attestation"
	"github.com/in-toto/go-witness/attestation/k8smanifest"
	"github.com/in-toto/go-witness/attestation/product"
	"github.com/in-toto/go-witness/cryptoutil"
)

func TestKubernetesManifestAttestor(t *testing.T) {
	workingDir := t.TempDir()
	manifestPath := filepath.Join(workingDir, "deployment.yaml")
	manifest := `apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo
spec:
  selector:
    matchLabels:
      app: demo
  template:
    metadata:
      labels:
        app: demo
    spec:
      containers:
        - name: demo
          image: cgr.dev/chainguard/nginx:latest
`
	if err := os.WriteFile(manifestPath, []byte(manifest), 0o644); err != nil {
		t.Fatalf("write manifest: %v", err)
	}

	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	signer := cryptoutil.NewRSASigner(privateKey, crypto.SHA256)

	result, err := witness.Run(
		"deploy",
		witness.RunWithSigners(signer),
		witness.RunWithAttestors([]attestation.Attestor{
			product.New(),
			k8smanifest.New(),
		}),
		witness.RunWithAttestationOpts(attestation.WithWorkingDir(workingDir)),
	)
	if err != nil {
		t.Fatalf("run k8s manifest attestor: %v", err)
	}

	if len(result.Collection.Attestations) != 2 {
		t.Fatalf("expected two attestations in collection, got %d", len(result.Collection.Attestations))
	}
}
