package gowitnesssnippets

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"sync"
	"testing"

	witness "github.com/in-toto/go-witness"
	"github.com/in-toto/go-witness/attestation"
	"github.com/in-toto/go-witness/cryptoutil"
	"github.com/invopop/jsonschema"
)

const (
	exampleAttestorName = "docs-example-attestor"
	exampleAttestorType = "https://example.dev/attestations/docs-example/v0.1"
)

var registerExampleAttestor sync.Once

type exampleAttestor struct {
	Digest string `json:"digest"`
}

func (a *exampleAttestor) Name() string                 { return exampleAttestorName }
func (a *exampleAttestor) Type() string                 { return exampleAttestorType }
func (a *exampleAttestor) RunType() attestation.RunType { return attestation.PreMaterialRunType }
func (a *exampleAttestor) Schema() *jsonschema.Schema   { return jsonschema.Reflect(&exampleAttestor{}) }

func (a *exampleAttestor) Attest(ctx *attestation.AttestationContext) error {
	a.Digest = "d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2"
	return nil
}

func (a *exampleAttestor) Subjects() map[string]cryptoutil.DigestSet {
	return map[string]cryptoutil.DigestSet{
		"artifact": {
			{Hash: crypto.SHA256}: a.Digest,
		},
	}
}

func TestCustomAttestorRegistrationAndLookup(t *testing.T) {
	registerExampleAttestor.Do(func() {
		attestation.RegisterAttestation(
			exampleAttestorName,
			exampleAttestorType,
			attestation.PreMaterialRunType,
			func() attestation.Attestor { return &exampleAttestor{} },
		)
	})

	lookedUp, err := attestation.GetAttestor(exampleAttestorName)
	if err != nil {
		t.Fatalf("lookup registered attestor: %v", err)
	}

	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	signer := cryptoutil.NewRSASigner(privateKey, crypto.SHA256)

	result, err := witness.Run(
		"custom",
		witness.RunWithSigners(signer),
		witness.RunWithAttestors([]attestation.Attestor{lookedUp}),
	)
	if err != nil {
		t.Fatalf("run custom attestor: %v", err)
	}

	if len(result.Collection.Subjects()) != 1 {
		t.Fatalf("expected one subject from custom attestor")
	}
}
