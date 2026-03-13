package commandrun

deny[msg] {
  input.exitcode != 0
  msg := "exitcode not 0"
}

deny[msg] {
  input.cmd[2] != "printf \"hello from the SSCS lab\\n\" > artifacts/hello.txt"
  msg := "build command not correct"
}
