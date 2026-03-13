package gowitnesssnippets

import (
	"bytes"
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"

	witness "github.com/in-toto/go-witness"
	"github.com/in-toto/go-witness/attestation"
	"github.com/in-toto/go-witness/attestation/k8smanifest"
	"github.com/in-toto/go-witness/attestation/product"
	"github.com/in-toto/go-witness/cryptoutil"
	"github.com/in-toto/go-witness/dsse"
	"github.com/in-toto/go-witness/policy"
	"github.com/in-toto/go-witness/source"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestKubernetesAdmissionStyleVerification(t *testing.T) {
	workingDir := t.TempDir()
	manifestPath := filepath.Join(workingDir, "release.yaml")
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
          image: ghcr.io/acme/demo:1.2.3
`
	if err := os.WriteFile(manifestPath, []byte(manifest), 0o644); err != nil {
		t.Fatalf("write manifest: %v", err)
	}

	functionaryKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate functionary key: %v", err)
	}
	functionarySigner := cryptoutil.NewRSASigner(functionaryKey, crypto.SHA256)

	runResults, err := witness.RunWithExports(
		"deploy",
		witness.RunWithSigners(functionarySigner),
		witness.RunWithAttestors([]attestation.Attestor{
			product.New(),
			k8smanifest.New(),
		}),
		witness.RunWithAttestationOpts(attestation.WithWorkingDir(workingDir)),
	)
	if err != nil {
		t.Fatalf("run manifest attestors: %v", err)
	}
	if len(runResults) != 1 {
		t.Fatalf("expected one collection result, got %d", len(runResults))
	}

	subjectDigest, err := cryptoutil.CalculateDigestSetFromFile(
		manifestPath,
		[]cryptoutil.DigestValue{{Hash: crypto.SHA256}},
	)
	if err != nil {
		t.Fatalf("calculate manifest digest: %v", err)
	}

	functionaryVerifier, err := functionarySigner.Verifier()
	if err != nil {
		t.Fatalf("build functionary verifier: %v", err)
	}
	functionaryKeyID, err := functionaryVerifier.KeyID()
	if err != nil {
		t.Fatalf("functionary key id: %v", err)
	}
	functionaryKeyBytes, err := functionaryVerifier.Bytes()
	if err != nil {
		t.Fatalf("functionary verifier bytes: %v", err)
	}

	policyDoc := policy.Policy{
		Expires: metav1.NewTime(time.Now().Add(time.Hour)),
		PublicKeys: map[string]policy.PublicKey{
			functionaryKeyID: {
				KeyID: functionaryKeyID,
				Key:   functionaryKeyBytes,
			},
		},
		Steps: map[string]policy.Step{
			"deploy": {
				Name: "deploy",
				Functionaries: []policy.Functionary{
					{PublicKeyID: functionaryKeyID},
				},
				Attestations: []policy.Attestation{
					{Type: product.ProductType},
					{Type: k8smanifest.Type},
				},
			},
		},
	}

	policyBytes, err := json.Marshal(policyDoc)
	if err != nil {
		t.Fatalf("marshal policy: %v", err)
	}

	policyKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate policy key: %v", err)
	}
	policySigner := cryptoutil.NewRSASigner(policyKey, crypto.SHA256)

	var signedPolicy bytes.Buffer
	if err := witness.Sign(
		bytes.NewReader(policyBytes),
		policy.PolicyPredicate,
		&signedPolicy,
		dsse.SignWithSigners(policySigner),
	); err != nil {
		t.Fatalf("sign policy: %v", err)
	}

	var policyEnvelope dsse.Envelope
	if err := json.Unmarshal(signedPolicy.Bytes(), &policyEnvelope); err != nil {
		t.Fatalf("decode policy envelope: %v", err)
	}

	policyVerifier, err := policySigner.Verifier()
	if err != nil {
		t.Fatalf("build policy verifier: %v", err)
	}

	memorySource := source.NewMemorySource()
	if err := memorySource.LoadEnvelope("deploy-collection", runResults[0].SignedEnvelope); err != nil {
		t.Fatalf("load collection envelope: %v", err)
	}

	verifyResult, err := witness.Verify(
		context.Background(),
		policyEnvelope,
		[]cryptoutil.Verifier{policyVerifier},
		witness.VerifyWithCollectionSource(memorySource),
		witness.VerifyWithSubjectDigests([]cryptoutil.DigestSet{subjectDigest}),
	)
	if err != nil {
		t.Fatalf("verify deployment policy: %v", err)
	}
	if verifyResult.VerificationSummary.VerificationResult == "" {
		t.Fatalf("expected verification result to be populated")
	}
}
