package gowitnesssnippets

import (
	"encoding/base64"
	"testing"

	"github.com/in-toto/go-witness/attestation/commandrun"
	"github.com/in-toto/go-witness/policy"
)

func TestTutorialRegoPolicyEvaluatesCommandRunAttestation(t *testing.T) {
	module := `package commandrun

deny[msg] {
  input.exitcode != 0
  msg := "exitcode not 0"
}

deny[msg] {
  input.cmd[2] != "echo 'hello' > hello.txt"
  msg := "cmd not correct"
}`

	encoded := base64.StdEncoding.EncodeToString([]byte(module))
	decoded, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		t.Fatalf("decode module: %v", err)
	}

	att := commandrun.New()
	att.Cmd = []string{"bash", "-lc", "echo 'hello' > hello.txt"}
	att.ExitCode = 0

	if err := policy.EvaluateRegoPolicy(att, []policy.RegoPolicy{{
		Name:   "expected-command",
		Module: decoded,
	}}); err != nil {
		t.Fatalf("rego policy should pass: %v", err)
	}

	att.Cmd = []string{"bash", "-lc", "echo nope > hello.txt"}

	if err := policy.EvaluateRegoPolicy(att, []policy.RegoPolicy{{
		Name:   "expected-command",
		Module: decoded,
	}}); err == nil {
		t.Fatalf("rego policy should reject unexpected command")
	}
}
