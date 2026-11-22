// Tiny stack VM, make.fun ISA v1: 32-bit wrapping ints, 256-value stack,
// 64-deep call stack, 256 words of memory, 10 traps, 1M-step and 64K-byte
// limits. Node 22 stdlib only, deterministic.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const IN = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function run(p, inp) {
  const s = new Int32Array(256), m = new Int32Array(256), c = new Int32Array(64);
  let sp = 0, cp = 0, pc = 0, ip = 0, steps = 0;
  const o = [];
  for (;;) {
    if (steps >= 1000000) return [o, 10];
    if (pc < 0 || pc >= p.length) return [o, 9];
    const op = p[pc];
    let n = 1;
    if (op === 1) n = 2;
    else if (op === 2) n = 5;
    else if (op >= 0x30 && op <= 0x33) n = 3;
    else if (!(op <= 7 || (op >= 0x10 && op <= 0x22) || op === 0x34 ||
      (op >= 0x40 && op <= 0x41) || (op >= 0x50 && op <= 0x53))) return [o, 5];
    if (pc + n > p.length) return [o, 9];
    steps++;
    let a, b, t;
    switch (op) {
      case 0x00: return [o, 0];
      case 0x01:
        if (sp >= 256) return [o, 3];
        s[sp++] = (p[pc + 1] << 24) >> 24; pc += 2; break;
      case 0x02:
        if (sp >= 256) return [o, 3];
        s[sp++] = p[pc + 1] | (p[pc + 2] << 8) | (p[pc + 3] << 16) | (p[pc + 4] << 24);
        pc += 5; break;
      case 0x03: if (sp < 1) return [o, 2]; sp--; pc++; break;
      case 0x04:
        if (sp < 1) return [o, 2];
        if (sp >= 256) return [o, 3];
        s[sp] = s[sp - 1]; sp++; pc++; break;
      case 0x05:
        if (sp < 2) return [o, 2];
        t = s[sp - 1]; s[sp - 1] = s[sp - 2]; s[sp - 2] = t; pc++; break;
      case 0x06:
        if (sp < 2) return [o, 2];
        if (sp >= 256) return [o, 3];
        s[sp] = s[sp - 2]; sp++; pc++; break;
      case 0x07:
        if (sp < 3) return [o, 2];
        t = s[sp - 3]; s[sp - 3] = s[sp - 2]; s[sp - 2] = s[sp - 1]; s[sp - 1] = t; pc++; break;
      case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16:
      case 0x18: case 0x19: case 0x1a: case 0x1c: case 0x1d: case 0x1e:
      case 0x20: case 0x21: case 0x22:
        if (sp < 2) return [o, 2];
        b = s[--sp]; a = s[sp - 1];
        if (op === 0x10) s[sp - 1] = (a + b) | 0;
        else if (op === 0x11) s[sp - 1] = (a - b) | 0;
        else if (op === 0x12) s[sp - 1] = Math.imul(a, b);
        else if (op === 0x13) {
          if (b === 0) return [o, 4];
          s[sp - 1] = a === -2147483648 && b === -1 ? -2147483648 : (a / b) | 0;
        } else if (op === 0x14) {
          if (b === 0) return [o, 4];
          s[sp - 1] = (a % b) | 0;
        } else if (op === 0x15) {
          if (b === 0) return [o, 4];
          s[sp - 1] = ((a >>> 0) / (b >>> 0)) | 0;
        } else if (op === 0x16) {
          if (b === 0) return [o, 4];
          s[sp - 1] = ((a >>> 0) % (b >>> 0)) | 0;
        } else if (op === 0x18) s[sp - 1] = a & b;
        else if (op === 0x19) s[sp - 1] = a | b;
        else if (op === 0x1a) s[sp - 1] = a ^ b;
        else if (op === 0x1c) s[sp - 1] = a << (b & 31);
        else if (op === 0x1d) s[sp - 1] = a >> (b & 31);
        else if (op === 0x1e) s[sp - 1] = (a >>> (b & 31)) | 0;
        else if (op === 0x20) s[sp - 1] = a === b ? 1 : 0;
        else if (op === 0x21) s[sp - 1] = a < b ? 1 : 0;
        else s[sp - 1] = (a >>> 0) < (b >>> 0) ? 1 : 0;
        pc++; break;
      case 0x17:
        if (sp < 1) return [o, 2];
        s[sp - 1] = (-s[sp - 1]) | 0; pc++; break;
      case 0x1b:
        if (sp < 1) return [o, 2];
        s[sp - 1] = ~s[sp - 1]; pc++; break;
      case 0x30:
        t = p[pc + 1] | (p[pc + 2] << 8);
        pc = pc + 3 + (t & 0x8000 ? t - 0x10000 : t); break;
      case 0x31: case 0x32:
        if (sp < 1) return [o, 2];
        t = p[pc + 1] | (p[pc + 2] << 8);
        if (t & 0x8000) t -= 0x10000;
        a = s[--sp];
        pc = (op === 0x31 ? a === 0 : a !== 0) ? pc + 3 + t : pc + 3; break;
      case 0x33:
        if (cp >= 64) return [o, 7];
        c[cp++] = pc + 3; pc = p[pc + 1] | (p[pc + 2] << 8); break;
      case 0x34:
        if (cp === 0) return [o, 8];
        pc = c[--cp]; break;
      case 0x40:
        if (sp < 1) return [o, 2];
        a = s[sp - 1];
        if (a < 0 || a > 255) return [o, 6];
        s[sp - 1] = m[a]; pc++; break;
      case 0x41:
        if (sp < 2) return [o, 2];
        a = s[--sp]; b = s[--sp];
        if (a < 0 || a > 255) return [o, 6];
        m[a] = b; pc++; break;
      case 0x50: {
        if (sp < 1) return [o, 2];
        const d = String(s[--sp]);
        if (o.length + d.length > 65536) return [o, 11];
        for (let i = 0; i < d.length; i++) o.push(d.charCodeAt(i));
        pc++; break;
      }
      case 0x51:
        if (sp < 1) return [o, 2];
        if (o.length + 1 > 65536) return [o, 11];
        o.push(s[--sp] & 255); pc++; break;
      case 0x52:
        if (sp >= 256) return [o, 3];
        s[sp++] = ip < inp.length ? inp[ip++] : -1; pc++; break;
      case 0x53:
        if (sp < 1) return [o, 2];
        return [o, s[--sp] & 255];
    }
  }
}

for (const id of readdirSync(IN).sort()) {
  let prog;
  try { prog = readFileSync(join(IN, id, 'program.bin')); } catch { continue; }
  let inp = Buffer.alloc(0);
  try { inp = readFileSync(join(IN, id, 'input.bin')); } catch {}
  const [o, code] = run(prog, inp);
  mkdirSync(join(OUT, id), { recursive: true });
  writeFileSync(join(OUT, id, 'stdout.bin'), Buffer.from(o));
  writeFileSync(join(OUT, id, 'exit.txt'), code + '\n');
}
