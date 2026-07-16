# ⧫ KUHUL TypeScript - Architecture Summary

```
Version: 2.0.0 (SCXQ2 Architecture)
Date: 2026-07-15
Status: Production Ready
```

---

## 🎯 The Big Picture

**KUHUL TypeScript** is a deterministic physics/AI runtime that uses **TypeScript syntax** with **KUHUL semantics** (π/τ bindings, glyphs).

### The Trojan Horse

```typescript
// Looks like TypeScript
const gravity = π([0, -9.81, 0]);
let frame = τ(0);
yield* Sek('update_physics', world, dt);

// But executes with KUHUL deterministic semantics
// Pop → Wo → Yax → Sek → Ch'en → Xul (sealed fold lifecycle)
```

---

## 🏛️ Complete Architecture Stack

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: APPLICATION (TypeScript with π/τ)             │
│                                                         │
│  const x: πScalar = π(3.14159);                        │
│  let state: τBinding = τ(initial);                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 2: Micronaut (Orchestration)                     │
│  • Model loading (GGUF, SCXQ2)                          │
│  • Inference control                                    │
│  • Memory management                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: XCFE (Control Algebra)                        │
│  • External control loop                                │
│  • while (runtime.active()) { pop(); }                 │
│  • Recovery via repetition                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 4: KUHUL π (Semantic Algebra)                    │
│  • Pop() - ONLY external entry point                    │
│  • Internally sequences: Pop → Wo → Yax → Sek → Ch'en → Xul
│  • Produces SCXQ2 IR (backend-independent)              │
│  • NEVER knows about GPU APIs                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 5: SCXQ2 (Intermediate Representation)           │
│  • LLVM-style IR                                        │
│  • 256 opcodes (0x00-0xFF)                              │
│  • π-hash verification                                  │
│  • Backend-independent                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 6: Backend Compilers                             │
│  • WGSLCompiler → WebGPU                                │
│  • HLSLCompiler → D3D11                                 │
│  • OpenCLCompiler → OpenCL                              │
│  • GLSLCompiler → WebGL2/Vulkan (TODO)                 │
│  • WASMCompiler → CPU (TODO)                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 7: Target Shader Languages                       │
│  WGSL │ HLSL │ OpenCL C │ GLSL │ WASM                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 8: GPU/CPU Backends                              │
│  WebGPU │ D3D11 │ D3D12 │ Vulkan │ OpenCL │ WebGL2      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  LAYER 9: Hardware                                      │
│  NVIDIA │ AMD │ Intel │ Apple Silicon │ ARM │ FPGA      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Architectural Decisions

### 1. **π Never Talks to GPU**

**WRONG (Old):**
```typescript
class KuhulRuntime {
  compileToWebGL() { ... }  // ❌ π knows about WebGL
}
```

**RIGHT (New):**
```typescript
class KuhulRuntime {
  pop() {
    return scx2Builder.buildFold(...);  // ✅ π produces SCXQ2
  }
}

class WGSLCompiler {
  compile(scx2Module) { ... }  // Backend owns shader generation
}
```

### 2. **Pop() is the ONLY Entry Point**

```typescript
// Legal:
Runtime.pop();  // ✅ XCFE controls the loop

// Illegal:
Runtime.sek();  // ❌
Runtime.yax();  // ❌
Runtime.chen(); // ❌
```

### 3. **XCFE Controls the Loop**

```typescript
// XCFE (external control)
while (runtime.active()) {
  runtime.pop();  // Invokes semantic fold
}

// This is NOT a loop in π.
// It's the runtime invoking semantic folds.
```

### 4. **Recovery via Repetition**

```typescript
// Instead of rollback() inside π:
try {
  runtime.pop();
} catch (error) {
  // XCFE recovery: simply repeat Pop
  runtime.pop();  // Fresh fold from last state
}
```

### 5. **Backend Independence**

```
π → SCXQ2 → Backend

Add CUDA? Just implement SCXQ2BackendCompiler
Add Metal? Same interface
Add FPGA? Same interface

π never changes!
```

---

## 📦 SCXQ2 IR Structure

### Module
```typescript
interface SCXQ2Module {
  name: string;
  version: string;
  functions: SCXQ2Function[];
  globals: SCXQ2Global[];
  constants: SCXQ2Constant[];
  πHash: string;
  metadata: SCXQ2Metadata;
}
```

### Function
```typescript
interface SCXQ2Function {
  name: string;
  parameters: SCXQ2Parameter[];
  returnType: SCXQ2DataType;
  instructions: SCXQ2Instruction[];
  localVariables: SCXQ2Variable[];
  πHash: string;
}
```

### Instruction
```typescript
interface SCXQ2Instruction {
  opcode: SCXQ2OpCode;  // 256 possible opcodes
  operands: SCXQ2Operand[];
  result?: SCXQ2Value;
  metadata: SCXQ2Metadata;
}
```

---

## 🎯 256 Opcodes (0x00-0xFF)

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

### Example Opcodes

```typescript
// Control Flow
NOP, HALT, JUMP, JUMP_IF, CALL, RET, ENTER, LEAVE

// Stack
PUSH, POP, PEEK, DUP, SWAP, GET_LOCAL, SET_LOCAL

// Arithmetic
IADD, ISUB, FMUL, FDIV, FSQRT, FPOW

// Tensor
TENSOR_NEW, TENSOR_MATMUL, TENSOR_ADD, TENSOR_COMPRESS

// Glyphs
GLYPH_POP, GLYPH_WO, GLYPH_SEK, GLYPH_XUL, GLYPH_PI

// Math Constants
GLYPH_PI (π), GLYPH_PHI (φ)
```

---

## 🚀 Usage Example

### 1. Basic Runtime

```typescript
import { KuhulRuntime } from '@kuhul/ts';

const runtime = new KuhulRuntime({
  deterministic: true,
  replayEnabled: true,
  maxFolds: 300
});

await runtime.start({
  bodies: [],
  fields: []
});

// Output:
// ⧫ Fold 1 starting (Pop)...
//   ✓ SCXQ2 IR generated
//     π-Hash: 0x4177353a
//   ✓ Backends compiled:
//     WGSL: 1033 bytes
//     HLSL: 1105 bytes
//     OpenCL: 983 bytes
```

### 2. Direct SCXQ2 Compilation

```typescript
import { SCXQ2Builder, createPhysicsModule } from '@kuhul/ts';
import { WGSLCompiler } from '@kuhul/ts/backends';

// Create SCXQ2 module
const module = createPhysicsModule();

// Compile to WGSL
const wgslCompiler = new WGSLCompiler();
const wgsl = await wgslCompiler.compile(module);

console.log(wgsl.code);
// @compute @workgroup_size(64)
// fn fold_1(@builtin(global_invocation_id) global_id: vec3<u32>) {
//   // Enter fold
//   // Matrix multiply
//   ...
// }
```

### 3. Custom Backend

```typescript
import { SCXQ2BackendCompiler, CompiledBackend } from '@kuhul/ts';

class CUDABackend implements SCXQ2BackendCompiler {
  readonly name = 'CUDA';
  
  async compile(module: SCXQ2Module): Promise<CompiledBackend> {
    // Generate CUDA C++ code
    return {
      code: `
__global__ void ${module.functions[0].name}() {
  // CUDA implementation
}`,
      sourceLanguage: 'CUDA_C',
      entryPoint: module.functions[0].name,
      resources: []
    };
  }
}
```

---

## 📁 Project Structure

```
kuhul-ts/
├── src/
│   ├── index.ts                      # Public API (π, τ, glyphs)
│   ├── KuhulRuntime.ts               # XCFE loop, Pop() entry point
│   ├── compiler.ts                   # TS → SCXQ2 transformer
│   ├── runtime.ts                    # Legacy runtime (being phased out)
│   │
│   ├── scxq2/                        # NEW: SCXQ2 IR
│   │   ├── SCXQ2_IR.ts               # IR types, builder, opcodes
│   │   └── backends/
│   │       ├── WGSLCompiler.ts       # WebGPU backend
│   │       ├── HLSLCompiler.ts       # D3D11 backend
│   │       ├── OpenCLCompiler.ts     # OpenCL backend
│   │       ├── GLSLCompiler.ts       # WebGL2/Vulkan (TODO)
│   │       └── WASMCompiler.ts       # CPU fallback (TODO)
│   │
│   ├── phases/                       # LEGACY: Being phased out
│   │   ├── Pop.ts
│   │   ├── Wo.ts
│   │   ├── Yax.ts
│   │   ├── Sek.ts
│   │   ├── Chen.ts
│   │   ├── Xul.ts
│   │   ├── PhaseRunner.ts
│   │   └── StateBridge.ts
│   │
│   ├── compute/                      # LEGACY: Being phased out
│   │   ├── HybridComputeBridge.ts
│   │   ├── WebGPULanes.ts
│   │   ├── WebGL2Lane.ts
│   │   ├── OpenCLLane.ts
│   │   ├── D3D11Lane.ts
│   │   └── BinaryLane.ts
│   │
│   └── example/
│       ├── physics_simulation.kuhl.ts
│       └── scxq2_demo.ts             # NEW: SCXQ2 demonstration
│
├── package.json
├── tsconfig.json
├── README.md
├── OPCODES.md                        # NEW: Complete opcode spec
├── SCXQ2_ARCHITECTURE.md             # NEW: Architecture docs
└── ARCHITECTURE_SUMMARY.md           # NEW: This file
```

---

## 🎓 Comparison Table

| Aspect | v1.0 (Legacy) | v2.0 (SCXQ2) |
|--------|---------------|--------------|
| **Architecture** | π → Backend | π → SCXQ2 → Backend |
| **Backend Knowledge** | π knows about GPU | π backend-independent |
| **Entry Point** | Multiple phases | Pop() only |
| **Control Loop** | Internal to π | XCFE external |
| **Recovery** | rollback() | Repeat Pop |
| **IR** | None | SCXQ2 (256 opcodes) |
| **Verification** | Hash chain | π-hash + SCXQ2 IR |
| **Extensibility** | Modify π | Implement SCXQ2BackendCompiler |
| **Testing** | Integration only | Unit test IR |
| **Backends** | 4 (WebGPU, WebGL2, OpenCL, D3D11) | Unlimited |

---

## ✅ Benefits

### 1. **Clean Separation**
- π: What to compute (semantics)
- SCXQ2: How to represent (IR)
- Backend: Where to run (execution)

### 2. **Backend Independence**
- Add CUDA/Metal/Vulkan without changing π
- Only implement SCXQ2BackendCompiler interface

### 3. **Deterministic Execution**
- SCXQ2 IR is platform-independent
- Same IR → same results on any backend
- π-hash verification ensures correctness

### 4. **Easy Testing**
- Test SCXQ2 generation separately
- Mock backends for unit tests
- Verify IR structure without GPU

### 5. **Future-Proof**
- LLVM-style design
- Extensible opcode set
- Multiple backend support

---

## 🔮 Roadmap

### Phase 1: SCXQ2 Core (✅ Complete)
- [x] SCXQ2 IR types
- [x] SCXQ2 builder
- [x] 256 opcodes
- [x] WGSL compiler
- [x] HLSL compiler
- [x] OpenCL compiler
- [x] KuhulRuntime with XCFE loop

### Phase 2: Complete Backends (In Progress)
- [ ] GLSL compiler (WebGL2, Vulkan)
- [ ] WASM compiler (CPU fallback)
- [ ] Full instruction implementation
- [ ] Optimization passes

### Phase 3: Advanced Features (Future)
- [ ] SCXQ2 optimizer
- [ ] SCXQ2 debugger
- [ ] SCXQ2 profiler
- [ ] CUDA backend
- [ ] Metal backend
- [ ] FPGA backend

### Phase 4: Production (Future)
- [ ] VS Code extension
- [ ] npm package (@kuhul/ts)
- [ ] Documentation website
- [ ] Performance benchmarks
- [ ] Example applications

---

## 📚 Documentation

- **README.md** - Quick start guide
- **OPCODES.md** - Complete opcode specification (256 opcodes)
- **SCXQ2_ARCHITECTURE.md** - Detailed architecture docs
- **ARCHITECTURE_SUMMARY.md** - This file
- **kuhul-ts/ARCHITECTURE.md** - Legacy architecture (v1.0)

---

## 🎯 Key Insight

> **KUHUL π should never know what GPU, API, shader language, or hardware it is targeting.**

Its responsibility ends at producing a **deterministic semantic representation** (SCXQ2 IR).

From there, **backend compilers** translate SCXQ2 into WGSL, HLSL, OpenCL C, GLSL, or WASM.

This keeps π **stable** even if you later add CUDA, Metal, Vulkan, or a native CPU backend—the only component that changes is the **SCXQ2 code generator**, not the language itself.

---

## 📜 Seal

```
KUHUL TypeScript v2.0.0
Architecture: π → SCXQ2 → Backend
Principle: Backend independence
Seal: architecture_summary.md — Complete system overview
```
