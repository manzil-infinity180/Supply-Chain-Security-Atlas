package gowitnesssnippets

import (
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"sync"
	"testing"

	"github.com/in-toto/go-witness/cryptoutil"
	"github.com/in-toto/go-witness/registry"
	"github.com/in-toto/go-witness/signer"
)

const docsSignerProviderName = "docs-inline-signer"

var registerDocsSigner sync.Once

type inlineSignerProvider struct{}

func (inlineSignerProvider) Signer(context.Context) (cryptoutil.Signer, error) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, err
	}
	return cryptoutil.NewSigner(privateKey, cryptoutil.SignWithHash(crypto.SHA256))
}

func TestCustomSignerProviderRegistration(t *testing.T) {
	registerDocsSigner.Do(func() {
		signer.Register(
			docsSignerProviderName,
			func() signer.SignerProvider { return inlineSignerProvider{} },
			registry.StringConfigOption(
				"note",
				"Example option used only for docs tests",
				"",
				func(sp signer.SignerProvider, note string) (signer.SignerProvider, error) {
					return sp, nil
				},
			),
		)
	})

	provider, err := signer.NewSignerProvider(docsSignerProviderName)
	if err != nil {
		t.Fatalf("create provider from registry: %v", err)
	}

	s, err := provider.Signer(context.Background())
	if err != nil {
		t.Fatalf("build signer from provider: %v", err)
	}

	if _, err := s.KeyID(); err != nil {
		t.Fatalf("get signer key id: %v", err)
	}
}
