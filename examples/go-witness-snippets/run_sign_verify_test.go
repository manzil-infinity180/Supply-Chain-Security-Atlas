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
	"github.com/in-toto/go-witness/attestation/commandrun"
	"github.com/in-toto/go-witness/attestation/material"
	"github.com/in-toto/go-witness/attestation/product"
	"github.com/in-toto/go-witness/cryptoutil"
	"github.com/in-toto/go-witness/dsse"
	"github.com/in-toto/go-witness/policy"
	"github.com/in-toto/go-witness/source"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestRunSignAndVerify(t *testing.T) {
	workingDir := t.TempDir()

	functionaryKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate functionary key: %v", err)
	}
	functionarySigner := cryptoutil.NewRSASigner(functionaryKey, crypto.SHA256)

	runResults, err := witness.RunWithExports(
		"build",
		witness.RunWithSigners(functionarySigner),
		witness.RunWithAttestors([]attestation.Attestor{
			material.New(),
			commandrun.New(commandrun.WithCommand([]string{"sh", "-c", "echo ok > artifact.txt"})),
			product.New(),
		}),
		witness.RunWithAttestationOpts(attestation.WithWorkingDir(workingDir)),
	)
	if err != nil {
		t.Fatalf("run attestations: %v", err)
	}
	if len(runResults) != 1 {
		t.Fatalf("expected one collection result, got %d", len(runResults))
	}

	subjectDigest, err := cryptoutil.CalculateDigestSetFromFile(
		filepath.Join(workingDir, "artifact.txt"),
		[]cryptoutil.DigestValue{{Hash: crypto.SHA256}},
	)
	if err != nil {
		t.Fatalf("calculate subject digest: %v", err)
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
			"build": {
				Name: "build",
				Functionaries: []policy.Functionary{
					{PublicKeyID: functionaryKeyID},
				},
				Attestations: []policy.Attestation{
					{Type: material.Type},
					{Type: product.ProductType},
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
		t.Fatalf("policy verifier: %v", err)
	}

	memorySource := source.NewMemorySource()
	if err := memorySource.LoadEnvelope("build-collection", runResults[0].SignedEnvelope); err != nil {
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
		t.Fatalf("verify policy: %v", err)
	}

	if verifyResult.VerificationSummary.VerificationResult == "" {
		t.Fatalf("expected verification summary result to be populated")
	}
}

func TestSignAndVerifySignature(t *testing.T) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	signer := cryptoutil.NewRSASigner(privateKey, crypto.SHA256)
	verifier, err := signer.Verifier()
	if err != nil {
		t.Fatalf("build verifier: %v", err)
	}

	var signed bytes.Buffer
	if err := witness.Sign(
		bytes.NewReader([]byte(`{"hello":"world"}`)),
		"application/json",
		&signed,
		dsse.SignWithSigners(signer),
	); err != nil {
		t.Fatalf("sign payload: %v", err)
	}

	envelope, err := witness.VerifySignature(bytes.NewReader(signed.Bytes()), verifier)
	if err != nil {
		t.Fatalf("verify envelope signature: %v", err)
	}
	if envelope.PayloadType != "application/json" {
		t.Fatalf("unexpected payload type: %s", envelope.PayloadType)
	}
}

func TestRunWithWorkingDir(t *testing.T) {
	workingDir := t.TempDir()
	if err := os.WriteFile(filepath.Join(workingDir, "existing.txt"), []byte("hello"), 0o644); err != nil {
		t.Fatalf("seed working dir: %v", err)
	}

	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	signer := cryptoutil.NewRSASigner(key, crypto.SHA256)

	result, err := witness.Run(
		"snapshot",
		witness.RunWithSigners(signer),
		witness.RunWithAttestors([]attestation.Attestor{material.New()}),
		witness.RunWithAttestationOpts(attestation.WithWorkingDir(workingDir)),
	)
	if err != nil {
		t.Fatalf("run material attestor: %v", err)
	}
	if len(result.Collection.Attestations) != 1 {
		t.Fatalf("expected one attestation in collection, got %d", len(result.Collection.Attestations))
	}
}
