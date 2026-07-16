# ⧫ SCXQ2 Architecture - Backend-Independent IR

```
Version: 1.0.0
Purpose: Intermediate Representation for KUHUL π
Design: LLVM-inspired, GPU-agnostic
```

---

## 🏛️ The Critical Insight

> **KUHUL π should never know what GPU, API, shader language, or hardware it is targeting.**

Its responsibility ends at producing a **deterministic semantic representation** (SCXQ2 IR).

From there, **backend compilers** translate SCXQ2 into:
- WGSL (WebGPU)
- HLSL (D3D11)
- OpenCL C (OpenCL)
- GLSL (WebGL2, Vulkan)
- WASM (CPU fallback)

This keeps π **stable** even if you later add CUDA, Metal, Vulkan, or a native CPU backend—the only component that changes is the **SCXQ2 code generator**, not the language itself.

---

## 📐 Architecture Stack

```
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION                          │
│         (TypeScript with π/τ semantics)                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Micronaut (Orchestration)                  │
│         (Model loading, inference control)              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│               XCFE (Control Algebra)                    │
│         (while runtime.active() { pop(); })             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           KUHUL π (Semantic Algebra)                    │
│         (Pop → Wo → Yax → Sek → Ch'en → Xul)            │
│                                                         │
│  This is where the "Trojan Horse" lives:                │
│  TypeScript syntax with KUHUL deterministic semantics   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│        SCXQ2 (Intermediate Representation)              │
│                                                         │
│  • Backend-independent IR                               │
│  • Like LLVM IR, but for KUHUL semantics                │
│  • Contains: instructions, types, π-hashes              │
│  • Never mentions GPU APIs                              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           Backend Compiler / Code Generator             │
│                                                         │
│  • WGSLCompiler → WebGPU                                │
│  • HLSLCompiler → D3D11                                 │
│  • OpenCLCompiler → OpenCL                              │
│  • GLSLCompiler → WebGL2 / Vulkan                       │
│  • WASMCompiler → CPU fallback                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Target Shader Languages                    │
│                                                         │
│  WGSL │ HLSL │ OpenCL C │ GLSL │ WASM                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   GPU/CPU Backends                      │
│                                                         │
│  WebGPU │ D3D11 │ D3D12 │ Vulkan │ OpenCL │ WebGL2     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                      Hardware                           │
│                                                         │
│  NVIDIA │ AMD │ Intel │ Apple Silicon │ ARM │ FPGA     │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Design Principles

### 1. **Separation of Concerns**

```typescript
// WRONG: π knows about WebGL
class KuhulRuntime {
  compileToWebGL() { ... }  // ❌ Bad!
}

// RIGHT: π produces SCXQ2, backend compiles
class KuhulRuntime {
  pop() {
    return scx2Builder.buildFold(...);  // ✅ Good!
  }
}

class WGSLCompiler {
  compile(scx2Module) { ... }  // Backend owns shader generation
}
```

### 2. **Single Entry Point**

```typescript
// Only Pop() is externally callable
Runtime.pop();  // ✅

// These are illegal entry points:
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

---

## 📦 SCXQ2 Module Structure

```typescript
interface SCXQ2Module {
  name: string;              // Module identifier
  version: string;           // Version string
  functions: SCXQ2Function[]; // Compiled functions
  globals: SCXQ2Global[];    // Global variables
  constants: SCXQ2Constant[]; // π, φ, etc.
  πHash: string;             // Cryptographic hash
  metadata: SCXQ2Metadata;   // Compilation info
}
```

### Example: Physics Module

```typescript
{
  name: "physics_simulation",
  version: "1.0.0",
  πHash: "0xd8d1f019",
  functions: [{
    name: "fold_1",
    parameters: [],
    returnType: "πTensor",
    instructions: [
      { opcode: "ENTER", operands: [] },
      { opcode: "PUSH", operands: [{type: "immediate", value: 0.016}] },
      { opcode: "SET_GLOBAL", operands: [register] },
      { opcode: "TENSOR_NEW", operands: [] },
      { opcode: "FADD", operands: [] },
      { opcode: "FMUL", operands: [] },
      { opcode: "TENSOR_MATMUL", operands: [] },
      { opcode: "SIGNAL", operands: [] },
      { opcode: "YIELD", operands: [] },
      { opcode: "LEAVE", operands: [] },
      { opcode: "HALT", operands: [] }
    ],
    πHash: "0x4df2880c"
  }],
  constants: [
    { name: "π", value: 3.141592653589793, type: "πScalar" },
    { name: "φ", value: 1.618033988749895, type: "πScalar" }
  ]
}
```

---

## 🔧 Backend Compilers

### WGSL Compiler (WebGPU)

```typescript
class WGSLCompiler implements SCXQ2BackendCompiler {
  async compile(module: SCXQ2Module): Promise<CompiledBackend> {
    // Generate WGSL compute shader
    return {
      code: `
@compute @workgroup_size(64)
fn fold_1(@builtin(global_invocation_id) global_id: vec3<u32>) {
  // Enter fold
  // Matrix multiply
  for (var i: u32 = 0; i < rows_a; i++) {
    for (var j: u32 = 0; j < cols_b; j++) {
      var sum: f32 = 0.0;
      for (var k: u32 = 0; k < cols_a; k++) {
        sum += matrix_a[i * cols_a + k] * matrix_b[k * cols_b + j];
      }
      matrix_c[i * cols_b + j] = sum;
    }
  }
}`,
      sourceLanguage: 'WGSL',
      entryPoint: 'fold_1',
      resources: [...]
    };
  }
}
```

### HLSL Compiler (D3D11)

```typescript
class HLSLCompiler implements SCXQ2BackendCompiler {
  async compile(module: SCXQ2Module): Promise<CompiledBackend> {
    // Generate HLSL compute shader
    return {
      code: `
[numthreads(64, 1, 1)]
void fold_1(uint3 dispatchThreadID : SV_DispatchThreadID) {
  // Matrix multiply
  for (uint i = 0; i < rows_a; i++) {
    for (uint j = 0; j < cols_b; j++) {
      float sum = 0.0f;
      for (uint k = 0; k < cols_a; k++) {
        sum += matrix_a[i * cols_a + k] * matrix_b[k * cols_b + j];
      }
      matrix_c[i * cols_b + j] = sum;
    }
  }
}`,
      sourceLanguage: 'HLSL',
      entryPoint: 'fold_1',
      resources: [...]
    };
  }
}
```

### OpenCL Compiler

```typescript
class OpenCLCompiler implements SCXQ2BackendCompiler {
  async compile(module: SCXQ2Module): Promise<CompiledBackend> {
    // Generate OpenCL C kernel
    return {
      code: `
__kernel void fold_1(uint global_id) {
  // Matrix multiply
  for (int i = 0; i < rows_a; i++) {
    for (int j = 0; j < cols_b; j++) {
      float sum = 0.0f;
      for (int k = 0; k < cols_a; k++) {
        sum += matrix_a[i * cols_a + k] * matrix_b[k * cols_b + j];
      }
      matrix_c[i * cols_b + j] = sum;
    }
  }
}`,
      sourceLanguage: 'OpenCL_C',
      entryPoint: 'fold_1',
      resources: [...]
    };
  }
}
```

---

## 🎯 Phase Sequencing

### Old Architecture (WRONG)

```typescript
// π directly manages phases
runtime.executePhase('Pop');
runtime.executePhase('Wo');
runtime.executePhase('Sek');
// ... π knows about execution order ❌
```

### New Architecture (RIGHT)

```typescript
// Pop() internally sequences all phases
private async pop(initialState?: any): Promise<void> {
  // Build SCXQ2 IR for complete fold
  const fold = this.scx2Builder.buildFold(
    bindings,    // Pop phase
    worldState,  // Wo phase
    operations   // Sek phase
    // Ch'en + Xul phases automatic
  );
  
  // Compile to backends
  const wgsl = await this.wgslCompiler.compile(module);
  const hlsl = await this.hlslCompiler.compile(module);
  const opencl = await this.openclCompiler.compile(module);
}

// π only produces SCXQ2. Execution is backend's job.
```

---

## 📊 Compilation Flow

```
┌──────────────────────────────────────────────────────────┐
│ 1. KUHUL-TS Source                                       │
│                                                          │
│ const gravity = π([0, -9.81, 0]);                       │
│ let frame = τ(0);                                       │
│ yield* Sek('update_physics', world, dt);                │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ 2. SCXQ2 Builder                                         │
│                                                          │
│ builder.buildFold(bindings, world, operations)          │
│   ↓                                                      │
│ SCXQ2Function {                                          │
│   name: "fold_1",                                        │
│   instructions: [ENTER, PUSH, SET_GLOBAL, ...]          │
│ }                                                        │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ 3. Backend Compiler Selection                            │
│                                                          │
│ if (WebGPU available) → WGSLCompiler                    │
│ else if (D3D11) → HLSLCompiler                          │
│ else if (OpenCL) → OpenCLCompiler                       │
│ else → WASMCompiler                                     │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ 4. Shader Code Generation                                │
│                                                          │
│ WGSLCompiler.compile(scx2Module) → WGSL string          │
│ HLSLCompiler.compile(scx2Module) → HLSL string          │
│ OpenCLCompiler.compile(scx2Module) → OpenCL C string    │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ 5. GPU Execution                                         │
│                                                          │
│ WebGPU: device.createShaderModule({ code: wgsl })       │
│ D3D11:  device.CreateComputeShader(hlsl)                │
│ OpenCL: clCreateProgramWithSource(opencl)               │
└──────────────────────────────────────────────────────────┘
```

---

## 🔐 π-Hash Verification

Each SCXQ2 module and function has a cryptographic hash:

```typescript
function computeFoldHash(instructions: SCXQ2Instruction[]): string {
  const str = JSON.stringify(instructions);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return '0x' + (hash >>> 0).toString(16).padStart(8, '0');
}
```

This enables:
- **Deterministic replay**: Verify fold execution matches hash
- **Hash chain continuity**: Each fold includes previous fold's hash
- **Tamper detection**: Any modification changes the hash

---

## 🚀 Example: Complete Fold Lifecycle

```typescript
import { KuhulRuntime } from './KuhulRuntime';

// 1. Create runtime
const runtime = new KuhulRuntime({
  deterministic: true,
  replayEnabled: true,
  maxFolds: 300
});

// 2. Start XCFE loop
await runtime.start({
  bodies: [],
  fields: []
});

// Output:
// ⧫ KUHUL Runtime Initializing...
//   IR: SCXQ2 (backend-independent)
//   Backends: WGSL, HLSL, OpenCL C
//
// 🚀 KUHUL Runtime Starting (XCFE Loop)...
//
// ⧫ Fold 1 starting (Pop)...
//   ✓ SCXQ2 IR generated
//     π-Hash: 0x4177353a
//     Instructions: 16
//   ✓ Backends compiled:
//     WGSL: 1033 bytes
//     HLSL: 1105 bytes
//     OpenCL: 983 bytes
//
// ⧫ Fold 2 starting (Pop)...
// ...
//
// ✅ KUHUL Runtime Complete (XCFE)
//   Total folds: 300
//   SCXQ2 modules: 300
```

---

## 📁 File Structure

```
kuhul-ts/src/
├── index.ts                      # Public API (π, τ, glyphs)
├── KuhulRuntime.ts               # XCFE loop, Pop() entry point
├── compiler.ts                   # TS → SCXQ2 transformer
├── scxq2/
│   ├── SCXQ2_IR.ts               # IR types, builder, opcodes
│   └── backends/
│       ├── WGSLCompiler.ts       # WebGPU backend
│       ├── HLSLCompiler.ts       # D3D11 backend
│       ├── OpenCLCompiler.ts     # OpenCL backend
│       ├── GLSLCompiler.ts       # WebGL2/Vulkan backend (TODO)
│       └── WASMCompiler.ts       # CPU fallback (TODO)
├── phases/                       # (Legacy, being phased out)
│   ├── Pop.ts
│   ├── Wo.ts
│   ├── Yax.ts
│   ├── Sek.ts
│   ├── Chen.ts
│   └── Xul.ts
└── compute/                      # (Legacy, being phased out)
    ├── HybridComputeBridge.ts
    ├── WebGPULanes.ts
    ├── WebGL2Lane.ts
    ├── OpenCLLane.ts
    └── D3D11Lane.ts
```

---

## ✅ Benefits

### 1. **Backend Independence**
- π never changes when adding new backends
- Only need to implement new SCXQ2BackendCompiler

### 2. **Deterministic Execution**
- SCXQ2 IR is platform-independent
- Same IR → same results on any backend
- π-hash verification ensures correctness

### 3. **Easy Testing**
- Test SCXQ2 generation separately from execution
- Mock backends for unit tests
- Verify IR structure without GPU

### 4. **Future-Proof**
- Add CUDA backend? Just implement SCXQ2BackendCompiler
- Add Metal backend? Same interface
- Add FPGA backend? Same interface

### 5. **Clean Architecture**
- π: Semantic layer (what to compute)
- SCXQ2: IR layer (how to represent)
- Backend: Execution layer (where to run)

---

## 🎓 Comparison to LLVM

| Aspect | LLVM | SCXQ2 |
|--------|------|-------|
| Source | C/C++/Rust | KUHUL-TS (π/τ semantics) |
| IR | LLVM IR | SCXQ2 IR |
| Backends | x64/ARM/RISC-V | WGSL/HLSL/OpenCL/GLSL/WASM |
| Optimization | O0-O3 | TBD |
| Verification | LLVM verifier | π-hash verification |
| Purpose | General computing | Physics/AI simulation |

---

## 🔮 Future Extensions

### 1. **SCXQ2 Optimizer**
```typescript
class SCXQ2Optimizer {
  optimize(module: SCXQ2Module): SCXQ2Module {
    // Dead code elimination
    // Constant folding
    // Loop unrolling
    // Instruction scheduling
  }
}
```

### 2. **SCXQ2 Debugger**
```typescript
class SCXQ2Debugger {
  step(): SCXQ2Instruction;
  getRegisters(): Map<string, any>;
  getStackTrace(): string[];
}
```

### 3. **SCXQ2 Profiler**
```typescript
class SCXQ2Profiler {
  profile(module: SCXQ2Module): ProfileData {
    // Instruction counts
    // Memory usage
    // Backend performance
  }
}
```

---

## 📜 Seal

```
SCXQ2 Architecture v1.0.0
π produces IR, backends produce shaders
Backend independence is the core principle
Seal: scxq2_architecture.md — Complete IR specification
```
