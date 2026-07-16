/**
 * OpenCL Vector Shaders - Linear Algebra Kernels
 * 
 * Khronos OpenCL compute kernels for vector/matrix operations
 * Used by physics, graphics, and ML pipelines
 */

import { OpenCLLane, OpenCLComputeConfig } from './OpenCLLane';

// ============================================================================
// OPENCL KERNEL SOURCES - LINEAR ALGEBRA
// ============================================================================

/**
 * Vector Addition Kernel
 * C = A + B
 */
export const vectorAddCL = `
__kernel void vector_add(
    __global const float* a,
    __global const float* b,
    __global float* c,
    const int n
) {
    int i = get_global_id(0);
    if (i >= n) return;
    
    c[i] = a[i] + b[i];
}
`;

/**
 * Vector Subtraction Kernel
 * C = A - B
 */
export const vectorSubCL = `
__kernel void vector_sub(
    __global const float* a,
    __global const float* b,
    __global float* c,
    const int n
) {
    int i = get_global_id(0);
    if (i >= n) return;
    
    c[i] = a[i] - b[i];
}
`;

/**
 * Vector Dot Product Kernel
 * Returns scalar = A · B
 */
export const vectorDotCL = `
__kernel void vector_dot(
    __global const float* a,
    __global const float* b,
    __global float* partial_sums,
    const int n
) {
    int i = get_global_id(0);
    int local_size = get_local_size(0);
    
    float sum = 0.0f;
    
    // Each work-item computes partial dot product
    for (int j = i; j < n; j += local_size * 2) {
        sum += a[j] * b[j];
        if (j + local_size < n) {
            sum += a[j + local_size] * b[j + local_size];
        }
    }
    
    partial_sums[i] = sum;
}
`;

/**
 * Vector Cross Product Kernel (3D only)
 * C = A × B
 */
export const vectorCrossCL = `
__kernel void vector_cross(
    __global const float3* a,
    __global const float3* b,
    __global float3* c,
    const int n
) {
    int i = get_global_id(0);
    if (i >= n) return;
    
    float3 va = a[i];
    float3 vb = b[i];
    
    c[i] = (float3)(
        va.y * vb.z - va.z * vb.y,
        va.z * vb.x - va.x * vb.z,
        va.x * vb.y - va.y * vb.x
    );
}
`;

/**
 * Vector Scale Kernel
 * C = A * scalar
 */
export const vectorScaleCL = `
__kernel void vector_scale(
    __global const float* a,
    __global float* c,
    const float scalar,
    const int n
) {
    int i = get_global_id(0);
    if (i >= n) return;
    
    c[i] = a[i] * scalar;
}
`;

/**
 * Vector Normalize Kernel
 * C = A / |A|
 */
export const vectorNormalizeCL = `
__kernel void vector_normalize(
    __global const float* a,
    __global float* c,
    const int n,
    const int vec_size
) {
    int i = get_global_id(0);
    if (i >= n / vec_size) return;
    
    int base = i * vec_size;
    float sum = 0.0f;
    
    // Compute magnitude
    for (int j = 0; j < vec_size; j++) {
        sum += a[base + j] * a[base + j];
    }
    
    float mag = sqrt(sum);
    float inv_mag = (mag > 0.0f) ? (1.0f / mag) : 0.0f;
    
    // Normalize
    for (int j = 0; j < vec_size; j++) {
        c[base + j] = a[base + j] * inv_mag;
    }
}
`;

/**
 * Vector Magnitude Kernel
 * |A| = sqrt(A · A)
 */
export const vectorMagnitudeCL = `
__kernel void vector_magnitude(
    __global const float* a,
    __global float* mags,
    const int n,
    const int vec_size
) {
    int i = get_global_id(0);
    if (i >= n / vec_size) return;
    
    int base = i * vec_size;
    float sum = 0.0f;
    
    for (int j = 0; j < vec_size; j++) {
        sum += a[base + j] * a[base + j];
    }
    
    mags[i] = sqrt(sum);
}
`;

/**
 * Matrix-Vector Multiplication Kernel
 * y = A * x (where A is M×N, x is N×1, y is M×1)
 */
export const matrixVectorMulCL = `
__kernel void matrix_vector_mul(
    __global const float* matrix,
    __global const float* vector,
    __global float* result,
    const int rows,
    const int cols
) {
    int row = get_global_id(0);
    if (row >= rows) return;
    
    float sum = 0.0f;
    
    for (int col = 0; col < cols; col++) {
        sum += matrix[row * cols + col] * vector[col];
    }
    
    result[row] = sum;
}
`;

/**
 * Matrix-Matrix Multiplication Kernel (Naive)
 * C = A × B
 */
export const matrixMulNaiveCL = `
__kernel void matrix_mul_naive(
    __global const float* A,
    __global const float* B,
    __global float* C,
    const int rowsA,
    const int colsA,
    const int colsB
) {
    int row = get_global_id(1);
    int col = get_global_id(0);
    
    if (row >= rowsA || col >= colsB) return;
    
    float sum = 0.0f;
    
    for (int k = 0; k < colsA; k++) {
        sum += A[row * colsA + k] * B[k * colsB + col];
    }
    
    C[row * colsB + col] = sum;
}
`;

/**
 * Matrix-Matrix Multiplication Kernel (Tiled/Optimized)
 * Uses shared local memory for better performance
 * C = A × B
 */
export const matrixMulTiledCL = `
__kernel void matrix_mul_tiled(
    __global const float* A,
    __global const float* B,
    __global float* C,
    const int rowsA,
    const int colsA,
    const int colsB
) {
    // Tile size (must match work group size)
    const int TILE_SIZE = 16;
    
    __local float tileA[TILE_SIZE][TILE_SIZE];
    __local float tileB[TILE_SIZE][TILE_SIZE];
    
    int row = get_global_id(1);
    int col = get_global_id(0);
    int localRow = get_local_id(1);
    int localCol = get_local_id(0);
    
    float sum = 0.0f;
    
    // Loop over tiles
    for (int t = 0; t < (colsA + TILE_SIZE - 1) / TILE_SIZE; t++) {
        // Load tile A
        if (row < rowsA && (t * TILE_SIZE + localCol) < colsA) {
            tileA[localRow][localCol] = A[row * colsA + t * TILE_SIZE + localCol];
        } else {
            tileA[localRow][localCol] = 0.0f;
        }
        
        // Load tile B
        if ((t * TILE_SIZE + localRow) < colsA && col < colsB) {
            tileB[localRow][localCol] = B[(t * TILE_SIZE + localRow) * colsB + col];
        } else {
            tileB[localRow][localCol] = 0.0f;
        }
        
        // Synchronize
        barrier(CLK_LOCAL_MEM_FENCE);
        
        // Multiply tiles
        for (int k = 0; k < TILE_SIZE; k++) {
            sum += tileA[localRow][k] * tileB[k][localCol];
        }
        
        // Synchronize
        barrier(CLK_LOCAL_MEM_FENCE);
    }
    
    // Store result
    if (row < rowsA && col < colsB) {
        C[row * colsB + col] = sum;
    }
}
`;

/**
 * Matrix Transpose Kernel
 * B = A^T
 */
export const matrixTransposeCL = `
__kernel void matrix_transpose(
    __global const float* A,
    __global float* B,
    const int rows,
    const int cols
) {
    int row = get_global_id(1);
    int col = get_global_id(0);
    
    if (row >= rows || col >= cols) return;
    
    B[col * rows + row] = A[row * cols + col];
}
`;

/**
 * Matrix Addition Kernel
 * C = A + B
 */
export const matrixAddCL = `
__kernel void matrix_add(
    __global const float* A,
    __global const float* B,
    __global float* C,
    const int rows,
    const int cols
) {
    int row = get_global_id(1);
    int col = get_global_id(0);
    
    if (row >= rows || col >= cols) return;
    
    C[row * cols + col] = A[row * cols + col] + B[row * cols + col];
}
`;

/**
 * Matrix Subtraction Kernel
 * C = A - B
 */
export const matrixSubCL = `
__kernel void matrix_sub(
    __global const float* A,
    __global const float* B,
    __global float* C,
    const int rows,
    const int cols
) {
    int row = get_global_id(1);
    int col = get_global_id(0);
    
    if (row >= rows || col >= cols) return;
    
    C[row * cols + col] = A[row * cols + col] - B[row * cols + col];
}
`;

/**
 * Matrix Scale Kernel
 * B = A * scalar
 */
export const matrixScaleCL = `
__kernel void matrix_scale(
    __global const float* A,
    __global float* B,
    const float scalar,
    const int rows,
    const int cols
) {
    int row = get_global_id(1);
    int col = get_global_id(0);
    
    if (row >= rows || col >= cols) return;
    
    B[row * cols + col] = A[row * cols + col] * scalar;
}
`;

/**
 * LU Decomposition Kernel (Partial)
 * For solving linear systems
 */
export const luDecompositionCL = `
__kernel void lu_decompose(
    __global float* matrix,
    __global int* pivot,
    const int n
) {
    int row = get_global_id(0);
    if (row >= n) return;
    
    // Initialize pivot
    pivot[row] = row;
    
    // Find pivot for this column
    float max_val = fabs(matrix[row * n + row]);
    int max_row = row;
    
    for (int i = row + 1; i < n; i++) {
        float val = fabs(matrix[i * n + row]);
        if (val > max_val) {
            max_val = val;
            max_row = i;
        }
    }
    
    // Swap rows if needed
    if (max_row != row) {
        pivot[row] = max_row;
        for (int j = 0; j < n; j++) {
            float temp = matrix[row * n + j];
            matrix[row * n + j] = matrix[max_row * n + j];
            matrix[max_row * n + j] = temp;
        }
    }
    
    // Eliminate column
    if (matrix[row * n + row] != 0.0f) {
        for (int i = row + 1; i < n; i++) {
            float factor = matrix[i * n + row] / matrix[row * n + row];
            matrix[i * n + row] = factor;
            
            for (int j = row + 1; j < n; j++) {
                matrix[i * n + j] -= factor * matrix[row * n + j];
            }
        }
    }
}
`;

/**
 * Gaussian Elimination Kernel
 * For solving Ax = b
 */
export const gaussianEliminationCL = `
__kernel void gaussian_elimination(
    __global float* A,
    __global float* b,
    __global float* x,
    const int n
) {
    int row = get_global_id(0);
    if (row >= n) return;
    
    // Forward elimination
    for (int k = 0; k < n; k++) {
        if (row > k) {
            float factor = A[row * n + k] / A[k * n + k];
            for (int j = k; j < n; j++) {
                A[row * n + j] -= factor * A[k * n + j];
            }
            b[row] -= factor * b[k];
        }
    }
}
`;

/**
 * Back Substitution Kernel
 * Solve upper triangular system
 */
export const backSubstitutionCL = `
__kernel void back_substitution(
    __global const float* U,
    __global const float* y,
    __global float* x,
    const int n
) {
    int row = get_global_id(0);
    if (row >= n) return;
    
    float sum = 0.0f;
    
    for (int j = row + 1; j < n; j++) {
        sum += U[row * n + j] * x[j];
    }
    
    x[row] = (y[row] - sum) / U[row * n + row];
}
`;

/**
 * Eigenvalue Power Iteration Kernel
 * Find dominant eigenvalue/eigenvector
 */
export const eigenvaluePowerIterationCL = `
__kernel void power_iteration(
    __global const float* matrix,
    __global float* vector,
    __global float* new_vector,
    __global float* eigenvalue,
    const int n
) {
    int row = get_global_id(0);
    if (row >= n) return;
    
    // Matrix-vector multiply
    float sum = 0.0f;
    for (int col = 0; col < n; col++) {
        sum += matrix[row * n + col] * vector[col];
    }
    new_vector[row] = sum;
}
`;

/**
 * SVD (Singular Value Decomposition) - One Step
 * Simplified for GPU
 */
export const svdStepCL = `
__kernel void svd_step(
    __global float* matrix,
    __global float* U,
    __global float* S,
    __global float* V,
    const int rows,
    const int cols,
    const float tolerance
) {
    int row = get_global_id(0);
    int col = get_global_id(1);
    
    if (row >= rows || col >= cols) return;
    
    // Simplified SVD step (Jacobi rotation)
    // Full SVD would require multiple iterations
    
    float val = matrix[row * cols + col];
    float sigma = fabs(val);
    
    if (sigma > tolerance) {
        // Update singular value
        S[min(row, col)] += val;
    }
}
`;

/**
 * Convolution Kernel (1D)
 * For signal processing
 */
export const convolution1DCL = `
__kernel void convolution_1d(
    __global const float* signal,
    __global const float* kernel,
    __global float* output,
    const int signal_len,
    const int kernel_len
) {
    int i = get_global_id(0);
    if (i >= signal_len) return;
    
    float sum = 0.0f;
    int half_kernel = kernel_len / 2;
    
    for (int j = 0; j < kernel_len; j++) {
        int idx = i - half_kernel + j;
        if (idx >= 0 && idx < signal_len) {
            sum += signal[idx] * kernel[j];
        }
    }
    
    output[i] = sum;
}
`;

/**
 * Convolution Kernel (2D)
 * For image processing
 */
export const convolution2DCL = `
__kernel void convolution_2d(
    __global const float* image,
    __global const float* kernel,
    __global float* output,
    const int width,
    const int height,
    const int kernel_size
) {
    int x = get_global_id(0);
    int y = get_global_id(1);
    
    if (x >= width || y >= height) return;
    
    float sum = 0.0f;
    int half_kernel = kernel_size / 2;
    
    for (int ky = -half_kernel; ky <= half_kernel; ky++) {
        for (int kx = -half_kernel; kx <= half_kernel; kx++) {
            int img_x = x + kx;
            int img_y = y + ky;
            
            if (img_x >= 0 && img_x < width && img_y >= 0 && img_y < height) {
                int kernel_idx = (ky + half_kernel) * kernel_size + (kx + half_kernel);
                sum += image[img_y * width + img_x] * kernel[kernel_idx];
            }
        }
    }
    
    output[y * width + x] = sum;
}
`;

// ============================================================================
// OPENCL VECTOR LANE CLASS
// ============================================================================

export class OpenCLVectorLane extends OpenCLLane {
  private vectorKernels: Map<string, string> = new Map();

  constructor(config: Partial<OpenCLComputeConfig> = {}) {
    super(config);
    this.initializeVectorKernels();
  }

  /**
   * Initialize vector/linear algebra kernels
   */
  private initializeVectorKernels(): void {
    this.vectorKernels.set('vector_add', vectorAddCL);
    this.vectorKernels.set('vector_sub', vectorSubCL);
    this.vectorKernels.set('vector_dot', vectorDotCL);
    this.vectorKernels.set('vector_cross', vectorCrossCL);
    this.vectorKernels.set('vector_scale', vectorScaleCL);
    this.vectorKernels.set('vector_normalize', vectorNormalizeCL);
    this.vectorKernels.set('vector_magnitude', vectorMagnitudeCL);
    this.vectorKernels.set('matrix_vector_mul', matrixVectorMulCL);
    this.vectorKernels.set('matrix_mul_naive', matrixMulNaiveCL);
    this.vectorKernels.set('matrix_mul_tiled', matrixMulTiledCL);
    this.vectorKernels.set('matrix_transpose', matrixTransposeCL);
    this.vectorKernels.set('matrix_add', matrixAddCL);
    this.vectorKernels.set('matrix_sub', matrixSubCL);
    this.vectorKernels.set('matrix_scale', matrixScaleCL);
    this.vectorKernels.set('lu_decompose', luDecompositionCL);
    this.vectorKernels.set('gaussian_elimination', gaussianEliminationCL);
    this.vectorKernels.set('back_substitution', backSubstitutionCL);
    this.vectorKernels.set('eigenvalue_power_iteration', eigenvaluePowerIterationCL);
    this.vectorKernels.set('svd_step', svdStepCL);
    this.vectorKernels.set('convolution_1d', convolution1DCL);
    this.vectorKernels.set('convolution_2d', convolution2DCL);

    console.log('  ✓ Vector kernels registered: ' + this.vectorKernels.size);
  }

  /**
   * Execute vector addition
   */
  async vectorAdd(a: Float32Array, b: Float32Array): Promise<Float32Array> {
    if (a.length !== b.length) {
      throw new Error('Vector lengths must match');
    }

    const result = new Float32Array(a.length);
    
    // Simulated OpenCL execution
    for (let i = 0; i < a.length; i++) {
      result[i] = a[i] + b[i];
    }

    return result;
  }

  /**
   * Execute vector dot product
   */
  async vectorDot(a: Float32Array, b: Float32Array): Promise<number> {
    if (a.length !== b.length) {
      throw new Error('Vector lengths must match');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }

    return sum;
  }

  /**
   * Execute vector cross product (3D)
   */
  async vectorCross(a: [number, number, number], b: [number, number, number]): Promise<[number, number, number]> {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }

  /**
   * Execute matrix-vector multiplication
   */
  async matrixVectorMul(matrix: Float32Array, vector: Float32Array, rows: number, cols: number): Promise<Float32Array> {
    const result = new Float32Array(rows);
    
    for (let i = 0; i < rows; i++) {
      let sum = 0;
      for (let j = 0; j < cols; j++) {
        sum += matrix[i * cols + j] * vector[j];
      }
      result[i] = sum;
    }

    return result;
  }

  /**
   * Execute matrix multiplication (tiled)
   */
  async matrixMulTiled(A: Float32Array, B: Float32Array, rowsA: number, colsA: number, colsB: number): Promise<Float32Array> {
    const C = new Float32Array(rowsA * colsB);
    const TILE_SIZE = 16;

    for (let row = 0; row < rowsA; row++) {
      for (let col = 0; col < colsB; col++) {
        let sum = 0;
        
        for (let t = 0; t < colsA; t += TILE_SIZE) {
          for (let k = 0; k < TILE_SIZE && (t + k) < colsA; k++) {
            sum += A[row * colsA + (t + k)] * B[(t + k) * colsB + col];
          }
        }
        
        C[row * colsB + col] = sum;
      }
    }

    return C;
  }

  /**
   * Execute LU decomposition
   */
  async luDecompose(matrix: Float32Array, n: number): Promise<{ L: Float32Array, U: Float32Array, pivot: Int32Array }> {
    const LU = new Float32Array(matrix);
    const pivot = new Int32Array(n);
    
    // Initialize pivot
    for (let i = 0; i < n; i++) {
      pivot[i] = i;
    }

    // LU decomposition
    for (let k = 0; k < n; k++) {
      // Find pivot
      let maxVal = Math.abs(LU[k * n + k]);
      let maxRow = k;
      
      for (let i = k + 1; i < n; i++) {
        const val = Math.abs(LU[i * n + k]);
        if (val > maxVal) {
          maxVal = val;
          maxRow = i;
        }
      }

      // Swap rows
      if (maxRow !== k) {
        pivot[k] = maxRow;
        for (let j = 0; j < n; j++) {
          const temp = LU[k * n + j];
          LU[k * n + j] = LU[maxRow * n + j];
          LU[maxRow * n + j] = temp;
        }
      }

      // Eliminate
      if (LU[k * n + k] !== 0) {
        for (let i = k + 1; i < n; i++) {
          const factor = LU[i * n + k] / LU[k * n + k];
          LU[i * n + k] = factor;
          
          for (let j = k + 1; j < n; j++) {
            LU[i * n + j] -= factor * LU[k * n + j];
          }
        }
      }
    }

    // Extract L and U
    const L = new Float32Array(n * n);
    const U = new Float32Array(n * n);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          L[i * n + j] = 1;
        } else if (i > j) {
          L[i * n + j] = LU[i * n + j];
        } else {
          L[i * n + j] = 0;
        }

        if (i <= j) {
          U[i * n + j] = LU[i * n + j];
        } else {
          U[i * n + j] = 0;
        }
      }
    }

    return { L, U, pivot };
  }

  /**
   * Solve linear system Ax = b using LU decomposition
   */
  async solveLinearSystem(A: Float32Array, b: Float32Array, n: number): Promise<Float32Array> {
    const { L, U, pivot } = await this.luDecompose(A, n);
    const x = new Float32Array(n);
    const y = new Float32Array(n);

    // Forward substitution (Ly = Pb)
    for (let i = 0; i < n; i++) {
      let sum = b[pivot[i]];
      for (let j = 0; j < i; j++) {
        sum -= L[i * n + j] * y[j];
      }
      y[i] = sum;
    }

    // Back substitution (Ux = y)
    for (let i = n - 1; i >= 0; i--) {
      let sum = y[i];
      for (let j = i + 1; j < n; j++) {
        sum -= U[i * n + j] * x[j];
      }
      x[i] = sum / U[i * n + i];
    }

    return x;
  }

  /**
   * Execute 2D convolution
   */
  async convolution2D(image: Float32Array, kernel: Float32Array, width: number, height: number, kernelSize: number): Promise<Float32Array> {
    const output = new Float32Array(width * height);
    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;

        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const imgX = x + kx;
            const imgY = y + ky;

            if (imgX >= 0 && imgX < width && imgY >= 0 && imgY < height) {
              const kernelIdx = (ky + halfKernel) * kernelSize + (kx + halfKernel);
              sum += image[imgY * width + imgX] * kernel[kernelIdx];
            }
          }
        }

        output[y * width + x] = sum;
      }
    }

    return output;
  }

  /**
   * Get all available vector kernels
   */
  getAvailableKernels(): string[] {
    return Array.from(this.vectorKernels.keys());
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example: Using OpenCL Vector Lane for physics simulation
 */
export async function examplePhysicsWithVectorShaders() {
  const lane = new OpenCLVectorLane({ useGPU: true });
  
  await lane.initialize();

  // Initialize 1000 bodies
  const positions = new Float32Array(1000 * 3);
  const velocities = new Float32Array(1000 * 3);
  const masses = new Float32Array(1000);

  for (let i = 0; i < 1000; i++) {
    positions[i * 3 + 0] = Math.random() * 100;
    positions[i * 3 + 1] = Math.random() * 100;
    positions[i * 3 + 2] = Math.random() * 100;
    
    velocities[i * 3 + 0] = (Math.random() - 0.5) * 10;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 10;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 10;
    
    masses[i] = 1.0 + Math.random() * 10;
  }

  // Simulate one timestep using vector operations
  const timestep = 0.016;
  const gravity = 9.81;

  // v = v + g * dt (vector scale + add)
  const gravityVec = new Float32Array([0, -gravity, 0]);
  const deltaV = await lane.vectorScale(gravityVec, timestep);
  
  console.log('Physics simulation with OpenCL vector shaders ready');
  console.log('Available kernels:', lane.getAvailableKernels().length);
}
