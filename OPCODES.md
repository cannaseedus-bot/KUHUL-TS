# ⧫ KUHUL Virtual Machine - Complete Opcode Specification

```
Version: ∞.∞.Ω
Total: 256 opcodes (0x00-0xFF)
Purpose: KUHUL Virtual Machine instruction set
```

---

## 🏛️ Architecture Overview

```
APPLICATION (TypeScript with π/τ semantics)
         ↓
   Micronaut (Orchestration)
         ↓
   XCFE (Control Algebra)
         ↓
   KUHUL π (Semantic Algebra)
         ↓
   SCXQ2 (Intermediate Representation)
         ↓
   Backend Compiler
         ↓
   WGSL | HLSL | OpenCL C | GLSL | WASM
         ↓
   WebGPU | D3D11 | OpenCL | WebGL2
         ↓
   Hardware
```

**Key Principle:** π never knows about GPU APIs. It produces SCXQ2 IR only.

---

## 📐 1. CORE OPCODES (0x00-0x3F)

### Control Flow (0x00-0x0F)

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0x00   | NOP  | No Operation | Do nothing, advance PC |
| 0x01   | HALT | Stop Execution | Terminate fold |
| 0x02   | JUMP | Unconditional Jump | PC → address |
| 0x03   | JUMP_IF | Conditional Jump | Jump if condition true |
| 0x04   | CALL | Call Subroutine | Push frame, jump |
| 0x05   | RET  | Return | Pop frame, return |
| 0x06   | ENTER | Enter Block | Begin fold/phase |
| 0x07   | LEAVE | Leave Block | End fold/phase |
| 0x08   | TRAP | Software Interrupt | Trigger trap handler |
| 0x09   | WAIT | Wait for Event | Block until event |
| 0x0A   | SIGNAL | Signal Event | Signal waiting threads |
| 0x0B   | YIELD | Yield Execution | Cooperative multitasking |
| 0x0C   | RESUME | Resume Execution | Continue from yield |
| 0x0D   | FORK | Fork Execution | Spawn parallel thread |
| 0x0E   | JOIN | Join Fork | Wait for fork completion |
| 0x0F   | BARRIER | Synchronization | Barrier synchronization |

### Stack Operations (0x10-0x1F)

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0x10   | PUSH | Push Value | Push to stack top |
| 0x11   | POP  | Pop Value | Pop from stack |
| 0x12   | PEEK | Peek Stack | Read stack top |
| 0x13   | DUP  | Duplicate | Copy stack top |
| 0x14   | SWAP | Swap | Exchange top two |
| 0x15   | ROT  | Rotate | Rotate top three |
| 0x16   | OVER | Over | Copy second to top |
| 0x17   | DROP | Drop | Remove stack top |
| 0x18   | PUSH_FRAME | Push Frame | Save call frame |
| 0x19   | POP_FRAME | Pop Frame | Restore frame |
| 0x1A   | GET_LOCAL | Get Local | Load local variable |
| 0x1B   | SET_LOCAL | Set Local | Store local variable |
| 0x1C   | GET_GLOBAL | Get Global | Load global variable |
| 0x1D   | SET_GLOBAL | Set Global | Store global variable |
| 0x1E   | GET_UPVALUE | Get Upvalue | Load closure value |
| 0x1F   | SET_UPVALUE | Set Upvalue | Store closure value |

### Arithmetic (0x20-0x2F)

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0x20   | IADD | Integer Add | a + b (int) |
| 0x21   | ISUB | Integer Sub | a - b (int) |
| 0x22   | IMUL | Integer Mul | a * b (int) |
| 0x23   | IDIV | Integer Div | a / b (int) |
| 0x24   | IMOD | Integer Mod | a % b (int) |
| 0x25   | FADD | Float Add | a + b (float) |
| 0x26   | FSUB | Float Sub | a - b (float) |
| 0x27   | FMUL | Float Mul | a * b (float) |
| 0x28   | FDIV | Float Div | a / b (float) |
| 0x29   | FNEG | Float Negate | -a (float) |
| 0x2A   | IINC | Increment | a++ (int) |
| 0x2B   | IDEC | Decrement | a-- (int) |
| 0x2C   | FABS | Float Abs | \|a\| (float) |
| 0x2D   | FSQRT | Float Sqrt | √a (float) |
| 0x2E   | FPOW | Float Power | a^b (float) |
| 0x2F   | FEXP | Float Exp | e^a (float) |

### Bitwise (0x30-0x3F)

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0x30   | AND  | Bitwise AND | a & b |
| 0x31   | OR   | Bitwise OR | a \| b |
| 0x32   | XOR  | Bitwise XOR | a ^ b |
| 0x33   | NOT  | Bitwise NOT | ~a |
| 0x34   | SHL  | Shift Left | a << b |
| 0x35   | SHR  | Shift Right | a >> b |
| 0x36   | USHR | Unsigned Shift | a >>> b |
| 0x37   | ROL  | Rotate Left | Circular left shift |
| 0x38   | ROR  | Rotate Right | Circular right shift |
| 0x39   | BIT_TEST | Test Bit | Test bit n |
| 0x3A   | BIT_SET | Set Bit | Set bit n |
| 0x3B   | BIT_CLEAR | Clear Bit | Clear bit n |
| 0x3C   | BIT_TOGGLE | Toggle Bit | Toggle bit n |
| 0x3D   | POPCOUNT | Count Bits | Count set bits |
| 0x3E   | CLZ  | Count Leading Zeros | Leading zeros |
| 0x3F   | CTZ  | Count Trailing Zeros | Trailing zeros |

---

## 🧮 2. EXTENDED OPCODES (0x40-0x7F)

### Tensor Operations (0x40-0x4F)

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0x40   | TENSOR_NEW | Create Tensor | Allocate new tensor |
| 0x41   | TENSOR_LOAD | Load Tensor | Load from memory |
| 0x42   | TENSOR_STORE | Store Tensor | Store to memory |
| 0x43   | TENSOR_MATMUL | Matrix Multiply | ⨀ operation |
| 0x44   | TENSOR_ADD | Tensor Add | ⊕ operation |
| 0x45   | TENSOR_SUB | Tensor Sub | ⊖ operation |
| 0x46   | TENSOR_MUL | Tensor Mul | ⊗ operation |
| 0x47   | TENSOR_DIV | Tensor Div | ⊘ operation |
| 0x48   | TENSOR_RESHAPE | Reshape | Change dimensions |
| 0x49   | TENSOR_TRANSPOSE | Transpose | Matrix transpose |
| 0x4A   | TENSOR_CONCAT | Concatenate | Join tensors |
| 0x4B   | TENSOR_SLICE | Slice | Extract sub-tensor |
| 0x4C   | TENSOR_COMPRESS | Compress | SCXQ2 compress (⨗) |
| 0x4D   | TENSOR_DECOMPRESS | Decompress | SCXQ2 decompress |
| 0x4E   | TENSOR_SPIRAL | Golden Spiral | ⤸ transformation |
| 0x4F   | TENSOR_PHASE | Phase Gate | ⨕ phase operation |

### Geometric Operations (0x50-0x5F)

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0x50   | GEOM_DISTANCE | Distance | Geometric distance (∼) |
| 0x51   | GEOM_SIMILARITY | Similarity | Geometric similarity (≅) |
| 0x52   | GEOM_PARALLEL | Parallel | Parallel transport (⤧) |
| 0x53   | GEOM_GEODESIC | Geodesic | Geodesic flow (⤨) |
| 0x54   | GEOM_MANIFOLD | Manifold | Project to manifold |
| 0x55   | GEOM_CURVATURE | Curvature | Compute curvature |
| 0x56   | GEOM_HIERARCHY | Hierarchy | Ascent (⤒) |
| 0x57   | GEOM_DESCENT | Descent | Descent (⤓) |
| 0x58   | GEOM_FLOW | Flow | Geometric flow (⟿) |
| 0x59   | GEOM_ROTATE | Rotation | 3D rotation (↻) |
| 0x5A   | GEOM_REFLECT | Reflection | Reflection (↔) |
| 0x5B   | GEOM_SPHERICAL | Spherical | Spherical geometry (⟲) |
| 0x5C   | GEOM_TORUS | Torus | Toroidal geometry |
| 0x5D   | GEOM_HYPERBOLIC | Hyperbolic | Hyperbolic geometry |
| 0x5E   | GEOM_FREICHET | Fréchet Mean | ∑ mean computation |
| 0x5F   | GEOM_GRADIENT | Gradient | Gradient flow (⤃) |

### Memory Operations (0x60-0x6F)

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0x60   | MEM_ALLOC | Allocate | Allocate memory |
| 0x61   | MEM_FREE | Free | Free memory |
| 0x62   | MEM_COPY | Copy | Copy memory region |
| 0x63   | MEM_MOVE | Move | Move memory region |
| 0x64   | MEM_SET | Set | Set memory bytes |
| 0x65   | MEM_LOAD | Load | Load from memory |
| 0x66   | MEM_STORE | Store | Store to memory |
| 0x67   | MEM_LOAD8 | Load 8-bit | Load byte |
| 0x68   | MEM_LOAD16 | Load 16-bit | Load halfword |
| 0x69   | MEM_LOAD32 | Load 32-bit | Load word |
| 0x6A   | MEM_LOAD64 | Load 64-bit | Load double |
| 0x6B   | MEM_STORE8 | Store 8-bit | Store byte |
| 0x6C   | MEM_STORE16 | Store 16-bit | Store halfword |
| 0x6D   | MEM_STORE32 | Store 32-bit | Store word |
| 0x6E   | MEM_STORE64 | Store 64-bit | Store double |
| 0x6F   | MEM_BARRIER | Memory Barrier | Memory fence |

### Compare & Branch (0x70-0x7F)

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0x70   | CMP_EQ | Equal | a == b |
| 0x71   | CMP_NE | Not Equal | a != b |
| 0x72   | CMP_LT | Less Than | a < b |
| 0x73   | CMP_LE | Less Equal | a <= b |
| 0x74   | CMP_GT | Greater Than | a > b |
| 0x75   | CMP_GE | Greater Equal | a >= b |
| 0x76   | CMP_FEQ | Float Equal | a == b (float) |
| 0x77   | CMP_FNE | Float NE | a != b (float) |
| 0x78   | CMP_FLT | Float LT | a < b (float) |
| 0x79   | CMP_FLE | Float LE | a <= b (float) |
| 0x7A   | CMP_FGT | Float GT | a > b (float) |
| 0x7B   | CMP_FGE | Float GE | a >= b (float) |
| 0x7C   | TEST_ZERO | Test Zero | a == 0 |
| 0x7D   | TEST_NONZERO | Test Nonzero | a != 0 |
| 0x7E   | TEST_NEG | Test Negative | a < 0 |
| 0x7F   | TEST_POS | Test Positive | a > 0 |

---

## 🎯 3. GLYPH OPCODES (0x80-0x9F)

### Action Glyphs (7)

| Opcode | Hex  | Glyph | Description |
|--------|------|-------|-------------|
| 0x80   | GLYPH_POP | ⟁Pop | Load/Input phase |
| 0x81   | GLYPH_WO | ⟁Wo | Store/Output phase |
| 0x82   | GLYPH_SEK | ⟁Sek | Execute phase |
| 0x83   | GLYPH_XUL | ⟁Xul | Decision/Terminate |
| 0x84   | GLYPH_KAYAB | ⟁K'ayab' | Loop start |
| 0x85   | GLYPH_KUMKU | ⟁Kumk'u | Loop end |
| 0x86   | GLYPH_KAN | ⟁Kan | Logic gate |

### Configuration Glyphs (2)

| Opcode | Hex  | Glyph | Description |
|--------|------|-------|-------------|
| 0x87   | GLYPH_YAX | ⟁Yax | Wait/Patience |
| 0x88   | GLYPH_CHEN | ⟁Ch'en | Notify/Arousal |

### Data Glyphs (3)

| Opcode | Hex  | Glyph | Description |
|--------|------|-------|-------------|
| 0x89   | GLYPH_KAT | ⟁K'at | Token |
| 0x8A   | GLYPH_KIN | ⟁K'in | Pattern |
| 0x8B   | GLYPH_MANIK | ⟁Manik | Movement |

### Reference Glyphs (3)

| Opcode | Hex  | Glyph | Description |
|--------|------|-------|-------------|
| 0x8C   | GLYPH_EB | ⟁Eb | Pathway |
| 0x8D   | GLYPH_BEN | ⟁Ben | Connection |
| 0x8E   | GLYPH_IX | ⟁Ix | Attention |

### Pattern Glyphs (3)

| Opcode | Hex  | Glyph | Description |
|--------|------|-------|-------------|
| 0x8F   | GLYPH_AJAW | ⟁Ajaw | Executive |
| 0x90   | GLYPH_KIB | ⟁K'ib' | Memory |
| 0x91   | GLYPH_ETZNAB | ⟁Etz'nab' | Reasoning |

### Cognitive Glyphs (4)

| Opcode | Hex  | Glyph | Description |
|--------|------|-------|-------------|
| 0x92   | GLYPH_CHUWEN | ⟁Chuwen | Learning |
| 0x93   | GLYPH_KAB | ⟁Kab' | Embodiment |
| 0x94   | GLYPH_KAWAK | ⟁Kawak | Creativity |
| 0x95   | GLYPH_AJPU | ⟁Ajpu | Consciousness |

### Tensor Glyphs (8)

| Opcode | Hex  | Glyph | Description |
|--------|------|-------|-------------|
| 0x96   | GLYPH_TENSOR_CORE | ⨀ | Tensor core operation |
| 0x97   | GLYPH_COMPRESS | ⨗ | Compression |
| 0x98   | GLYPH_PHASE_GATE | ⨕ | Phase gate |
| 0x99   | GLYPH_GOLDEN_SPIRAL | ⤸ | Golden spiral |
| 0x9A   | GLYPH_RECURSIVE_LEARN | ⥀ | Recursive learn |
| 0x9B   | GLYPH_FIBONACCI | ⧉ | Fibonacci window |
| 0x9C   | GLYPH_INTERSECT | ⨻ | Tensor intersect |
| 0x9D   | GLYPH_UNION | ⨺ | Tensor union |

### Math Glyphs (2)

| Opcode | Hex  | Glyph | Description |
|--------|------|-------|-------------|
| 0x9E   | GLYPH_PI | π | Pi constant |
| 0x9F   | GLYPH_PHI | φ | Golden ratio |

---

## 🧠 4. COGNITIVE OPCODES (0xA0-0xBF)

### Attention & Consciousness

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0xA0   | ATTENTION | Attention | Multi-head attention |
| 0xA1   | FLASH_ATTN | Flash Attention | Optimized attention |
| 0xA2   | CROSS_ATTN | Cross Attention | Cross-modal attention |
| 0xA3   | SELF_ATTN | Self Attention | Self-attention |
| 0xA4   | CONSCIOUSNESS | Consciousness | Consciousness field |
| 0xA5   | QUANTUM_STATE | Quantum State | State collapse |
| 0xA6   | PHASE_ALIGN | Phase Align | Phase alignment |
| 0xA7   | π_DISTANCE | π-Distance | π-geometric distance |

### Learning & Memory

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0xA8   | HEBB_LEARN | Hebbian Learning | Hebbian update |
| 0xA9   | BACKPROP | Backpropagation | Gradient backprop |
| 0xAA   | ENC_MEM | Encode Memory | Memory encoding |
| 0xAB   | DEC_MEM | Decode Memory | Memory decoding |
| 0xAC   | MEM_RECALL | Recall | Memory recall |
| 0xAD   | MEM_FORGET | Forgetting | Strategic forget |
| 0xAE   | π_DECAY | π-Decay | π-geometric decay |
| 0xAF   | SYNAPSE_UPD | Synapse Update | Synaptic update |

### Creative & Divergent

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0xB0   | CREATIVE_GEN | Creative Gen | Creative generation |
| 0xB1   | DIVERGENT | Divergent | Divergent thinking |
| 0xB2   | CONVERGENT | Convergent | Convergent thinking |
| 0xB3   | π_NOISE | π-Noise | π-correlated noise |
| 0xB4   | SPIRAL_SEARCH | Spiral Search | Golden spiral search |
| 0xB5   | ANALOGY | Analogy | Analogy formation |
| 0xB6   | METAPHOR | Metaphor | Metaphor generation |
| 0xB7   | SIMILE | Simile | Simile generation |

### Executive & Control

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0xB8   | PLAN | Plan | Plan execution |
| 0xB9   | SCHEDULE | Schedule | Task scheduling |
| 0xBA   | MONITOR | Monitor | Progress monitoring |
| 0xBB   | ADAPT | Adapt | Strategy adaptation |
| 0xBC   | DECIDE | Decide | Decision making |
| 0xBD   | EVALUATE | Evaluate | Outcome evaluation |
| 0xBE   | REFLECT | Reflect | Reflection |
| 0xBF   | META_COG | Meta-cognition | Meta-cognition |

---

## 🚀 5. QUANTUM OPCODES (0xC0-0xDF)

### Quantum Gates

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0xC0   | Q_HADAMARD | Hadamard | H gate |
| 0xC1   | Q_PAULI_X | Pauli X | X gate (NOT) |
| 0xC2   | Q_PAULI_Y | Pauli Y | Y gate |
| 0xC3   | Q_PAULI_Z | Pauli Z | Z gate |
| 0xC4   | Q_PHASE | Phase | Phase gate |
| 0xC5   | Q_T | T gate | T gate |
| 0xC6   | Q_S | S gate | S gate |
| 0xC7   | Q_CNOT | CNOT | Controlled NOT |

### Quantum Operations

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0xC8   | Q_MEASURE | Measure | Measure qubit |
| 0xC9   | Q_RESET | Reset | Reset qubit |
| 0xCA   | Q_INIT | Initialize | Initialize qubit |
| 0xCB   | Q_ENTANGLE | Entangle | Entangle qubits |
| 0xCC   | Q_TELEPORT | Teleport | Quantum teleport |
| 0xCD   | Q_SUPERPOS | Superposition | Create superposition |
| 0xCE   | Q_COLLAPSE | Collapse | Wavefunction collapse |
| 0xCF   | Q_INTERFERE | Interference | Quantum interference |

### Hybrid Quantum-Classical

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0xD0   | Q_CLASSICAL | Classical Feed | Classical to quantum |
| 0xD1   | CLASSICAL_Q | Quantum Feed | Quantum to classical |
| 0xD2   | Q_ML_LAYER | Quantum ML | Quantum ML layer |
| 0xD3   | Q_CIRCUIT | Quantum Circuit | Quantum circuit |
| 0xD4   | Q_VQE | VQE | VQE algorithm |
| 0xD5   | Q_QAOA | QAOA | QAOA algorithm |
| 0xD6   | Q_SHOR | Shor's | Shor's algorithm |
| 0xD7   | Q_GROVER | Grover's | Grover's algorithm |

---

## 💾 6. STORAGE & COMPRESSION OPCODES (0xE0-0xFF)

### GGUF Operations (0xE0-0xEF)

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0xE0   | GGUF_LOAD | Load GGUF | Load GGUF model |
| 0xE1   | GGUF_SAVE | Save GGUF | Save GGUF model |
| 0xE2   | GGUF_QUANT | Quantize | Quantize to GGUF |
| 0xE3   | GGUF_DEQUANT | Dequantize | Dequantize GGUF |
| 0xE4   | GGUF_METADATA | Metadata | Read GGUF metadata |
| 0xE5   | GGUF_KV_CACHE | KV Cache | KV cache operations |
| 0xE6   | GGUF_MMAP | Memory Map | Memory-map GGUF |
| 0xE7   | GGUF_SPLIT | Split | Split GGUF file |
| 0xE8   | GGUF_MERGE | Merge | Merge GGUF files |
| 0xE9   | GGUF_CONVERT | Convert | Convert to GGUF |
| 0xEA   | GGUF_VALIDATE | Validate | Validate GGUF |
| 0xEB   | GGUF_INFO | Info | Get GGUF info |

### DDS Operations (0xF0-0xF7)

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0xF0   | DDS_SHARD | Shard | Create DDS shard |
| 0xF1   | DDS_UNSHARD | Unshard | Reconstruct shards |
| 0xF2   | DDS_DISTRIBUTE | Distribute | Distribute shards |
| 0xF3   | DDS_GATHER | Gather | Gather shards |
| 0xF4   | DDS_REPLICATE | Replicate | Replicate shards |
| 0xF5   | DDS_REPAIR | Repair | Repair corrupted shard |
| 0xF6   | DDS_VERIFY | Verify | Verify shard integrity |
| 0xF7   | DDS_MERGE | Merge | Merge distributed tensors |

### SCXQ2 Compression (0xF8-0xFF)

| Opcode | Hex  | Mnemonic | Description |
|--------|------|----------|-------------|
| 0xF8   | SCXQ2_ENCODE | Encode | SCXQ2 encode |
| 0xF9   | SCXQ2_DECODE | Decode | SCXQ2 decode |
| 0xFA   | SCXQ2_RATIO | Ratio | Get compression ratio |
| 0xFB   | SCXQ2_OPTIMIZE | Optimize | Optimize compression |
| 0xFC   | SCXQ2_VALIDATE | Validate | Validate compressed |
| 0xFD   | SCXQ2_STREAM | Stream | Stream compression |
| 0xFE   | SCXQ2_PARALLEL | Parallel | Parallel compression |
| 0xFF   | SCXQ2_METADATA | Metadata | Compression metadata |

---

## 📊 7. OPCODE SUMMARY

| Range | Category | Count |
|-------|----------|-------|
| 0x00-0x0F | Control Flow | 16 |
| 0x10-0x1F | Stack Operations | 16 |
| 0x20-0x2F | Arithmetic | 16 |
| 0x30-0x3F | Bitwise | 16 |
| 0x40-0x4F | Tensor Operations | 16 |
| 0x50-0x5F | Geometric | 16 |
| 0x60-0x6F | Memory | 16 |
| 0x70-0x7F | Compare & Branch | 16 |
| 0x80-0x9F | Glyphs (22) | 32 |
| 0xA0-0xBF | Cognitive | 32 |
| 0xC0-0xDF | Quantum | 32 |
| 0xE0-0xFF | Storage/Compression | 32 |
| **Total** | **12 Categories** | **256** |

---

## 🎯 8. USAGE EXAMPLE

```typescript
import { SCXQ2Builder } from './scxq2/SCXQ2_IR';

const builder = new SCXQ2Builder();

// Build a fold
const fold = builder.buildFold(
  // π-bindings (immutable)
  new Map([
    ['GRAVITY', [0, -9.81, 0]],
    ['TIMESTEP', 0.016]
  ]),
  
  // World state (τ-bindings)
  { bodies: [], fields: [] },
  
  // Operations (Sek phase)
  [
    { op: 'update_physics', args: [{}, 0.016] },
    { op: 'matmul', args: [] }
  ]
);

// Generated SCXQ2 instructions:
// ENTER (0x06)
// PUSH (0x10) - GRAVITY
// SET_GLOBAL (0x1D)
// PUSH (0x10) - TIMESTEP
// SET_GLOBAL (0x1D)
// TENSOR_NEW (0x40)
// FADD (0x25)
// FMUL (0x27)
// TENSOR_MATMUL (0x43)
// SIGNAL (0x0A)
// YIELD (0x0B)
// LEAVE (0x07)
// HALT (0x01)
```

---

## ✅ FINAL SPECIFICATION

```
Total Opcodes: 256 (0x00-0xFF)
Categories: 12
Glyphs: 22
Tensor Ops: 16
Geometric Ops: 16
Cognitive Ops: 32
Quantum Ops: 24
Storage Ops: 32

Compatible: GGUF, DDS, SafeTensors, SCXQ2
Backend: LLVM/CPU/GPU/Quantum

Purpose: KUHUL Virtual Machine instruction set
Seal: opcodes.kuhul — Complete instruction set for the KUHUL VM
```
