# Khronos Group Standards in KUHUL

## Overview

KUHUL leverages **Khronos Group open standards** for cross-platform GPU compute:

```
┌─────────────────────────────────────────────────────────────┐
│                  KUHUL Compute Stack                        │
├─────────────────────────────────────────────────────────────┤
│  Application Layer (KUHUL-TS)                               │
│  π/τ bindings, glyphs, phases                              │
├─────────────────────────────────────────────────────────────┤
│  Compute Bridge (HybridComputeBridge)                       │
│  Routes operations to best available backend               │
├─────────────────────────────────────────────────────────────┤
│  Khronos Standards Layer                                    │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │   WebGPU    │   WebGL 2   │   OpenCL    │   Vulkan    │ │
│  │  (Modern)   │ (Compatible)│  (Legacy)   │  (Native)   │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Native GPU Drivers                                         │
│  D3D11 · Metal · OpenGL ES · CUDA                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Khronos Standards Supported

### 1. **WebGPU** (Modern Web Standard)
- **Status**: Primary web backend
- **Feature Level**: Compute shaders, storage buffers
- **Use Case**: Tensor ops, physics, geometry
- **Fallback**: WebGL 2

```typescript
// WebGPU compute pipeline
const pipeline = device.createComputePipeline({
  compute: {
    module: shaderModule,
    entryPoint: 'matmul'
  }
});
```

### 2. **WebGL 2.0** (Compatible Web Standard)
- **Status**: Fallback for WebGPU
- **Feature Level**: Transform feedback, compute via frag shaders
- **Use Case**: Wide compatibility
- **Fallback**: CPU

```typescript
// WebGL2 transform feedback
gl.transformFeedbackVaryings(program, varyings, gl.SEPARATE_ATTRIBS);
gl.beginTransformFeedback(gl.POINTS);
gl.drawArrays(gl.POINTS, 0, count);
gl.endTransformFeedback();
```

### 3. **OpenCL** (Cross-Platform Compute)
- **Status**: Native GPU compute (AMD/Intel/NVIDIA)
- **Feature Level**: Full compute kernels, shared memory
- **Use Case**: Vector/linear algebra, N-body physics
- **Fallback**: CPU

```opencl
// OpenCL kernel
__kernel void matrix_mul(
    __global const float* A,
    __global const float* B,
    __global float* C,
    const int rows, const int cols
) {
    int row = get_global_id(1);
    int col = get_global_id(0);
    // ...
}
```

### 4. **Vulkan** (Native Low-Level)
- **Status**: Via node-vulkan (optional)
- **Feature Level**: Full compute queues, async compute
- **Use Case**: Maximum performance
- **Fallback**: OpenCL

```typescript
// Vulkan compute pipeline
const computePipeline = device.createComputePipeline({
  layout: pipelineLayout,
  stage: { module: shaderModule, entryPoint: 'main' }
});
```

---

## Vector Shaders with Linear Algebra (OpenCL)

### Available Kernels

| Kernel | Operation | Performance |
|--------|-----------|-------------|
| `vector_add` | C = A + B | O(n) |
| `vector_dot` | scalar = A · B | O(n) |
| `vector_cross` | C = A × B (3D) | O(1) |
| `vector_scale` | B = A * s | O(n) |
| `vector_normalize` | B = A / |A| | O(n) |
| `matrix_vector_mul` | y = A * x | O(mn) |
| `matrix_mul_naive` | C = A × B | O(mnp) |
| `matrix_mul_tiled` | C = A × B (optimized) | O(mnp / tile) |
| `matrix_transpose` | B = A^T | O(mn) |
| `lu_decompose` | A = LU | O(n³) |
| `gaussian_elimination` | Solve Ax = b | O(n²) |
| `back_substitution` | Upper triangular solve | O(n²) |
| `eigenvalue_power_iteration` | Dominant eigenvalue | O(n²) per iter |
| `svd_step` | SVD (one step) | O(mn) |
| `convolution_1d` | 1D convolution | O(nk) |
| `convolution_2d` | 2D convolution | O(mnk²) |

### Usage Example

```typescript
import { OpenCLVectorLane } from './compute/OpenCLVectorShaders';

const lane = new OpenCLVectorLane({ useGPU: true });
await lane.initialize();

// Vector operations
const a = new Float32Array([1, 2, 3, 4, 5]);
const b = new Float32Array([5, 4, 3, 2, 1]);

const sum = await lane.vectorAdd(a, b);
const dot = await lane.vectorDot(a, b);

// Matrix operations
const A = new Float32Array([...]); // 3x3 matrix
const B = new Float32Array([...]); // 3x3 matrix

const C = await lane.matrixMulTiled(A, B, 3, 3, 3);

// Linear system solving
const x = await lane.solveLinearSystem(A, b, 3);
// Solves Ax = b
```

---

## Backend Selection Logic

```typescript
// Automatic backend selection
const preferBackend = 'auto'; // or 'webgpu', 'webgl2', 'opencl', 'd3d11'

// Selection priority (auto mode):
// 1. D3D11 (Windows native, best performance)
// 2. WebGPU (Modern web standard)
// 3. WebGL2 (Wide compatibility)
// 4. OpenCL (Legacy native)
// 5. CPU (Last resort)
```

---

## Khronos Compliance

### WebGPU
- ✅ Compute shaders
- ✅ Storage buffers
- ✅ Work groups
- ✅ Atomic operations
- ❌ Ray tracing (requires WebGPU extensions)

### WebGL 2
- ✅ Transform feedback
- ✅ Uniform buffers
- ✅ Texture buffers
- ❌ True compute shaders (use fragment shaders)

### OpenCL
- ✅ Full compute kernels
- ✅ Shared local memory
- ✅ Atomic operations
- ✅ Image/sampler objects
- ✅ Double precision (if device supports)

---

## Performance Guidelines

### Work Group Sizes
```
WebGPU:  64, 128, 256 (multiple of 32 for warp/wavefront)
WebGL2:  64, 128 (limited by maxVertexAttribs)
OpenCL:  64, 128, 256 (device-dependent)
D3D11:   64, 128, 256 (thread group size)
```

### Memory Alignment
```
Constant buffers: 256-byte alignment (D3D11)
Storage buffers:  16-byte alignment (WebGPU)
Uniform buffers:  64-byte alignment (OpenGL)
```

### Tiling Strategies
```
Matrix multiply: 16x16 or 32x32 tiles
Convolution:     8x8 or 16x16 tiles
N-body:          64 or 128 threads per block
```

---

## Khronos Ecosystem Integration

```
┌─────────────────────────────────────────────────────────────┐
│              KUHUL + Khronos Ecosystem                      │
├─────────────────────────────────────────────────────────────┤
│  glTF 2.0      → 3D model import (mesh lane)               │
│  SPIR-V        → Shader intermediate (WebGPU/Vulkan)       │
│  OpenXR        → VR/AR integration (future)                │
│  Vulkan        → Native compute (node-vulkan)              │
│  OpenCL        → Cross-platform compute                    │
│  WebGL/WebGPU  → Web rendering + compute                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Example: Full Linear Algebra Pipeline

```typescript
import { OpenCLVectorLane } from './compute/OpenCLVectorShaders';
import { HybridComputeBridge } from './compute/HybridComputeBridge';

async function runLinearAlgebra() {
  // Initialize compute bridge
  const bridge = new HybridComputeBridge({
    binaryDir: './bin',
    useWebGPU: true,
    useWebGL2: true,
    useOpenCL: true,
    useD3D11: true,
    preferBackend: 'auto'
  });

  // Get stats
  const stats = bridge.getStats();
  console.log('Active backend:', stats.activeBackend);

  // Create vector lane
  const vectorLane = new OpenCLVectorLane();
  await vectorLane.initialize();

  // Solve linear system Ax = b
  const A = new Float32Array([
    2, 1, 1,
    1, 3, 2,
    1, 0, 0
  ]);
  const b = new Float32Array([4, 5, 6]);

  const x = await vectorLane.solveLinearSystem(A, b, 3);
  console.log('Solution:', x);

  // Matrix multiplication
  const B = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const C = await vectorLane.matrixMulTiled(A, B, 3, 3, 3);
  console.log('Product:', C);

  // Cleanup
  bridge.shutdown();
}
```

---

## Summary

KUHUL uses **Khronos open standards** to provide:

1. **Cross-platform GPU compute** (WebGPU, WebGL2, OpenCL, Vulkan)
2. **Vector/linear algebra kernels** (16+ optimized OpenCL kernels)
3. **Automatic backend selection** (best available GPU API)
4. **Fallback chain** (GPU → CPU, never fails)
5. **π-hash verification** (deterministic across backends)

This ensures KUHUL runs efficiently on:
- **Windows** (D3D11, OpenCL)
- **macOS** (Metal via WebGPU, OpenCL)
- **Linux** (Vulkan, OpenCL)
- **Web** (WebGPU, WebGL2)
- **Mobile** (WebGL2, OpenCL)

All with the same KUHUL-TS source code!
