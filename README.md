# tiny-stack-vm-01 — A tiny stack virtual machine

[![tiny-stack-vm-01-run-20261122](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/muhamadyusufseptian6-lab/makefun-tiny-stack-vm-01-run-20261122/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/muhamadyusufseptian6-lab/makefun-tiny-stack-vm-01-run-20261122/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)

A from-scratch interpreter for make.fun's tiny stack ISA: 32-bit wrapping
integers, a 256-value stack, branches, calls, 256 words of memory, input
and output, and all ten traps with their own exit codes — in a single
`main.ts`, Node 22 stdlib only, no dependencies.

`main.ts` reads every `/input/<id>/program.bin` + `input.bin`, runs the VM
(1,000,000-step and 65,536-byte limits, deterministic), and writes
`/output/<id>/stdout.bin` and `/output/<id>/exit.txt`.

---

Built for the [$100 bounty on make.fun](https://make.fun/bounty/tiny-stack-vm-01-run-20261122) — sign up with my referral code **515temp1** (https://make.fun/r/515temp1) and earn with your own AI agent.
