/**
 * OpenCL Vector Shaders - Linear Algebra Kernels
 *
 * Khronos OpenCL compute kernels for vector/matrix operations
 * Used by physics, graphics, and ML pipelines
 */
import { OpenCLLane } from './OpenCLLane';
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
    vectorKernels = new Map();
    constructor(config = {}) {
        super(config);
        this.initializeVectorKernels();
    }
    /**
     * Initialize vector/linear algebra kernels
     */
    initializeVectorKernels() {
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
    async vectorAdd(a, b) {
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
    async vectorDot(a, b) {
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
    async vectorCross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }
    /**
     * Execute matrix-vector multiplication
     */
    async matrixVectorMul(matrix, vector, rows, cols) {
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
    async matrixMulTiled(A, B, rowsA, colsA, colsB) {
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
    async luDecompose(matrix, n) {
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
                }
                else if (i > j) {
                    L[i * n + j] = LU[i * n + j];
                }
                else {
                    L[i * n + j] = 0;
                }
                if (i <= j) {
                    U[i * n + j] = LU[i * n + j];
                }
                else {
                    U[i * n + j] = 0;
                }
            }
        }
        return { L, U, pivot };
    }
    /**
     * Solve linear system Ax = b using LU decomposition
     */
    async solveLinearSystem(A, b, n) {
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
    async convolution2D(image, kernel, width, height, kernelSize) {
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
    getAvailableKernels() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT3BlbkNMVmVjdG9yU2hhZGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21wdXRlL09wZW5DTFZlY3RvclNoYWRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0dBS0c7QUFFSCxPQUFPLEVBQUUsVUFBVSxFQUF1QixNQUFNLGNBQWMsQ0FBQztBQUUvRCwrRUFBK0U7QUFDL0UseUNBQXlDO0FBQ3pDLCtFQUErRTtBQUUvRTs7O0dBR0c7QUFDSCxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQUc7Ozs7Ozs7Ozs7OztDQVkxQixDQUFDO0FBRUY7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sV0FBVyxHQUFHOzs7Ozs7Ozs7Ozs7Q0FZMUIsQ0FBQztBQUVGOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxNQUFNLFdBQVcsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXNCMUIsQ0FBQztBQUVGOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1CNUIsQ0FBQztBQUVGOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRzs7Ozs7Ozs7Ozs7O0NBWTVCLENBQUM7QUFFRjs7O0dBR0c7QUFDSCxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EwQmhDLENBQUM7QUFFRjs7O0dBR0c7QUFDSCxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1CaEMsQ0FBQztBQUVGOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUJoQyxDQUFDO0FBRUY7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FzQi9CLENBQUM7QUFFRjs7OztHQUlHO0FBQ0gsTUFB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QyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDbkQsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ25ELFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUVuRCxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUVELGdEQUFnRDtJQUNoRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUM7SUFDdkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDO0lBRXJCLHNDQUFzQztJQUN0QyxNQUFNLFVBQVUsR0FBRyxJQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFNUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxREFBcUQsQ0FBQyxDQUFDO0lBQ25FLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdkUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogT3BlbkNMIFZlY3RvciBTaGFkZXJzIC0gTGluZWFyIEFsZ2VicmEgS2VybmVsc1xuICogXG4gKiBLaHJvbm9zIE9wZW5DTCBjb21wdXRlIGtlcm5lbHMgZm9yIHZlY3Rvci9tYXRyaXggb3BlcmF0aW9uc1xuICogVXNlZCBieSBwaHlzaWNzLCBncmFwaGljcywgYW5kIE1MIHBpcGVsaW5lc1xuICovXG5cbmltcG9ydCB7IE9wZW5DTExhbmUsIE9wZW5DTENvbXB1dGVDb25maWcgfSBmcm9tICcuL09wZW5DTExhbmUnO1xuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBPUEVOQ0wgS0VSTkVMIFNPVVJDRVMgLSBMSU5FQVIgQUxHRUJSQVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4vKipcbiAqIFZlY3RvciBBZGRpdGlvbiBLZXJuZWxcbiAqIEMgPSBBICsgQlxuICovXG5leHBvcnQgY29uc3QgdmVjdG9yQWRkQ0wgPSBgXG5fX2tlcm5lbCB2b2lkIHZlY3Rvcl9hZGQoXG4gICAgX19nbG9iYWwgY29uc3QgZmxvYXQqIGEsXG4gICAgX19nbG9iYWwgY29uc3QgZmxvYXQqIGIsXG4gICAgX19nbG9iYWwgZmxvYXQqIGMsXG4gICAgY29uc3QgaW50IG5cbikge1xuICAgIGludCBpID0gZ2V0X2dsb2JhbF9pZCgwKTtcbiAgICBpZiAoaSA+PSBuKSByZXR1cm47XG4gICAgXG4gICAgY1tpXSA9IGFbaV0gKyBiW2ldO1xufVxuYDtcblxuLyoqXG4gKiBWZWN0b3IgU3VidHJhY3Rpb24gS2VybmVsXG4gKiBDID0gQSAtIEJcbiAqL1xuZXhwb3J0IGNvbnN0IHZlY3RvclN1YkNMID0gYFxuX19rZXJuZWwgdm9pZCB2ZWN0b3Jfc3ViKFxuICAgIF9fZ2xvYmFsIGNvbnN0IGZsb2F0KiBhLFxuICAgIF9fZ2xvYmFsIGNvbnN0IGZsb2F0KiBiLFxuICAgIF9fZ2xvYmFsIGZsb2F0KiBjLFxuICAgIGNvbnN0IGludCBuXG4pIHtcbiAgICBpbnQgaSA9IGdldF9nbG9iYWxfaWQoMCk7XG4gICAgaWYgKGkgPj0gbikgcmV0dXJuO1xuICAgIFxuICAgIGNbaV0gPSBhW2ldIC0gYltpXTtcbn1cbmA7XG5cbi8qKlxuICogVmVjdG9yIERvdCBQcm9kdWN0IEtlcm5lbFxuICogUmV0dXJucyBzY2FsYXIgPSBBIMK3IEJcbiAqL1xuZXhwb3J0IGNvbnN0IHZlY3RvckRvdENMID0gYFxuX19rZXJuZWwgdm9pZCB2ZWN0b3JfZG90KFxuICAgIF9fZ2xvYmFsIGNvbnN0IGZsb2F0KiBhLFxuICAgIF9fZ2xvYmFsIGNvbnN0IGZsb2F0KiBiLFxuICAgIF9fZ2xvYmFsIGZsb2F0KiBwYXJ0aWFsX3N1bXMsXG4gICAgY29uc3QgaW50IG5cbikge1xuICAgIGludCBpID0gZ2V0X2dsb2JhbF9pZCgwKTtcbiAgICBpbnQgbG9jYWxfc2l6ZSA9IGdldF9sb2NhbF9zaXplKDApO1xuICAgIFxuICAgIGZsb2F0IHN1bSA9IDAuMGY7XG4gICAgXG4gICAgLy8gRWFjaCB3b3JrLWl0ZW0gY29tcHV0ZXMgcGFydGlhbCBkb3QgcHJvZHVjdFxuICAgIGZvciAoaW50IGogPSBpOyBqIDwgbjsgaiArPSBsb2NhbF9zaXplICogMikge1xuICAgICAgICBzdW0gKz0gYVtqXSAqIGJbal07XG4gICAgICAgIGlmIChqICsgbG9jYWxfc2l6ZSA8IG4pIHtcbiAgICAgICAgICAgIHN1bSArPSBhW2ogKyBsb2NhbF9zaXplXSAqIGJbaiArIGxvY2FsX3NpemVdO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHBhcnRpYWxfc3Vtc1tpXSA9IHN1bTtcbn1cbmA7XG5cbi8qKlxuICogVmVjdG9yIENyb3NzIFByb2R1Y3QgS2VybmVsICgzRCBvbmx5KVxuICogQyA9IEEgw5cgQlxuICovXG5leHBvcnQgY29uc3QgdmVjdG9yQ3Jvc3NDTCA9IGBcbl9fa2VybmVsIHZvaWQgdmVjdG9yX2Nyb3NzKFxuICAgIF9fZ2xvYmFsIGNvbnN0IGZsb2F0MyogYSxcbiAgICBfX2dsb2JhbCBjb25zdCBmbG9hdDMqIGIsXG4gICAgX19nbG9iYWwgZmxvYXQzKiBjLFxuICAgIGNvbnN0IGludCBuXG4pIHtcbiAgICBpbnQgaSA9IGdldF9nbG9iYWxfaWQoMCk7XG4gICAgaWYgKGkgPj0gbikgcmV0dXJuO1xuICAgIFxuICAgIGZsb2F0MyB2YSA9IGFbaV07XG4gICAgZmxvYXQzIHZiID0gYltpXTtcbiAgICBcbiAgICBjW2ldID0gKGZsb2F0MykoXG4gICAgICAgIHZhLnkgKiB2Yi56IC0gdmEueiAqIHZiLnksXG4gICAgICAgIHZhLnogKiB2Yi54IC0gdmEueCAqIHZiLnosXG4gICAgICAgIHZhLnggKiB2Yi55IC0gdmEueSAqIHZiLnhcbiAgICApO1xufVxuYDtcblxuLyoqXG4gKiBWZWN0b3IgU2NhbGUgS2VybmVsXG4gKiBDID0gQSAqIHNjYWxhclxuICovXG5leHBvcnQgY29uc3QgdmVjdG9yU2NhbGVDTCA9IGBcbl9fa2VybmVsIHZvaWQgdmVjdG9yX3NjYWxlKFxuICAgIF9fZ2xvYmFsIGNvbnN0IGZsb2F0KiBhLFxuICAgIF9fZ2xvYmFsIGZsb2F0KiBjLFxuICAgIGNvbnN0IGZsb2F0IHNjYWxhcixcbiAgICBjb25zdCBpbnQgblxuKSB7XG4gICAgaW50IGkgPSBnZXRfZ2xvYmFsX2lkKDApO1xuICAgIGlmIChpID49IG4pIHJldHVybjtcbiAgICBcbiAgICBjW2ldID0gYVtpXSAqIHNjYWxhcjtcbn1cbmA7XG5cbi8qKlxuICogVmVjdG9yIE5vcm1hbGl6ZSBLZXJuZWxcbiAqIEMgPSBBIC8gfEF8XG4gKi9cbmV4cG9ydCBjb25zdCB2ZWN0b3JOb3JtYWxpemVDTCA9IGBcbl9fa2VybmVsIHZvaWQgdmVjdG9yX25vcm1hbGl6ZShcbiAgICBfX2dsb2JhbCBjb25zdCBmbG9hdCogYSxcbiAgICBfX2dsb2JhbCBmbG9hdCogYyxcbiAgICBjb25zdCBpbnQgbixcbiAgICBjb25zdCBpbnQgdmVjX3NpemVcbikge1xuICAgIGludCBpID0gZ2V0X2dsb2JhbF9pZCgwKTtcbiAgICBpZiAoaSA+PSBuIC8gdmVjX3NpemUpIHJldHVybjtcbiAgICBcbiAgICBpbnQgYmFzZSA9IGkgKiB2ZWNfc2l6ZTtcbiAgICBmbG9hdCBzdW0gPSAwLjBmO1xuICAgIFxuICAgIC8vIENvbXB1dGUgbWFnbml0dWRlXG4gICAgZm9yIChpbnQgaiA9IDA7IGogPCB2ZWNfc2l6ZTsgaisrKSB7XG4gICAgICAgIHN1bSArPSBhW2Jhc2UgKyBqXSAqIGFbYmFzZSArIGpdO1xuICAgIH1cbiAgICBcbiAgICBmbG9hdCBtYWcgPSBzcXJ0KHN1bSk7XG4gICAgZmxvYXQgaW52X21hZyA9IChtYWcgPiAwLjBmKSA/ICgxLjBmIC8gbWFnKSA6IDAuMGY7XG4gICAgXG4gICAgLy8gTm9ybWFsaXplXG4gICAgZm9yIChpbnQgaiA9IDA7IGogPCB2ZWNfc2l6ZTsgaisrKSB7XG4gICAgICAgIGNbYmFzZSArIGpdID0gYVtiYXNlICsgal0gKiBpbnZfbWFnO1xuICAgIH1cbn1cbmA7XG5cbi8qKlxuICogVmVjdG9yIE1hZ25pdHVkZSBLZXJuZWxcbiAqIHxBfCA9IHNxcnQoQSDCtyBBKVxuICovXG5leHBvcnQgY29uc3QgdmVjdG9yTWFnbml0dWRlQ0wgPSBgXG5fX2tlcm5lbCB2b2lkIHZlY3Rvcl9tYWduaXR1ZGUoXG4gICAgX19nbG9iYWwgY29uc3QgZmxvYXQqIGEsXG4gICAgX19nbG9iYWwgZmxvYXQqIG1hZ3MsXG4gICAgY29uc3QgaW50IG4sXG4gICAgY29uc3QgaW50IHZlY19zaXplXG4pIHtcbiAgICBpbnQgaSA9IGdldF9nbG9iYWxfaWQoMCk7XG4gICAgaWYgKGkgPj0gbiAvIHZlY19zaXplKSByZXR1cm47XG4gICAgXG4gICAgaW50IGJhc2UgPSBpICogdmVjX3NpemU7XG4gICAgZmxvYXQgc3VtID0gMC4wZjtcbiAgICBcbiAgICBmb3IgKGludCBqID0gMDsgaiA8IHZlY19zaXplOyBqKyspIHtcbiAgICAgICAgc3VtICs9IGFbYmFzZSArIGpdICogYVtiYXNlICsgal07XG4gICAgfVxuICAgIFxuICAgIG1hZ3NbaV0gPSBzcXJ0KHN1bSk7XG59XG5gO1xuXG4vKipcbiAqIE1hdHJpeC1WZWN0b3IgTXVsdGlwbGljYXRpb24gS2VybmVsXG4gKiB5ID0gQSAqIHggKHdoZXJlIEEgaXMgTcOXTiwgeCBpcyBOw5cxLCB5IGlzIE3DlzEpXG4gKi9cbmV4cG9ydCBjb25zdCBtYXRyaXhWZWN0b3JNdWxDTCA9IGBcbl9fa2VybmVsIHZvaWQgbWF0cml4X3ZlY3Rvcl9tdWwoXG4gICAgX19nbG9iYWwgY29uc3QgZmxvYXQqIG1hdHJpeCxcbiAgICBfX2dsb2JhbCBjb25zdCBmbG9hdCogdmVjdG9yLFxuICAgIF9fZ2xvYmFsIGZsb2F0KiByZXN1bHQsXG4gICAgY29uc3QgaW50IHJvd3MsXG4gICAgY29uc3QgaW50IGNvbHNcbikge1xuICAgIGludCByb3cgPSBnZXRfZ2xvYmFsX2lkKDApO1xuICAgIGlmIChyb3cgPj0gcm93cykgcmV0dXJuO1xuICAgIFxuICAgIGZsb2F0IHN1bSA9IDAuMGY7XG4gICAgXG4gICAgZm9yIChpbnQgY29sID0gMDsgY29sIDwgY29sczsgY29sKyspIHtcbiAgICAgICAgc3VtICs9IG1hdHJpeFtyb3cgKiBjb2xzICsgY29sXSAqIHZlY3Rvcltjb2xdO1xuICAgIH1cbiAgICBcbiAgICByZXN1bHRbcm93XSA9IHN1bTtcbn1cbmA7XG5cbi8qKlxuICogTWF0cml4LU1hdHJpeCBNdWx0aXBsaWNhdGlvbiBLZXJuZWwgKE5haXZlKVxuICogQyA9IEEgw5cgQlxuICovXG5leHBvcnQgY29uc3QgbWF0cml4TXVsTmFpdmVDTCA9IGBcbl9fa2VybmVsIHZvaWQgbWF0cml4X211bF9uYWl2ZShcbiAgICBfX2dsb2JhbCBjb25zdCBmbG9hdCogQSxcbiAgICBfX2dsb2JhbCBjb25zdCBmbG9hdCogQixcbiAgICBfX2dsb2JhbCBmbG9hdCogQyxcbiAgICBjb25zdCBpbnQgcm93c0EsXG4gICAgY29uc3QgaW50IGNvbHNBLFxuICAgIGNvbnN0IGludCBjb2xzQlxuKSB7XG4gICAgaW50IHJvdyA9IGdldF9nbG9iYWxfaWQoMSk7XG4gICAgaW50IGNvbCA9IGdldF9nbG9iYWxfaWQoMCk7XG4gICAgXG4gICAgaWYgKHJvdyA+PSByb3dzQSB8fCBjb2wgPj0gY29sc0IpIHJldHVybjtcbiAgICBcbiAgICBmbG9hdCBzdW0gPSAwLjBmO1xuICAgIFxuICAgIGZvciAoaW50IGsgPSAwOyBrIDwgY29sc0E7IGsrKykge1xuICAgICAgICBzdW0gKz0gQVtyb3cgKiBjb2xzQSArIGtdICogQltrICogY29sc0IgKyBjb2xdO1xuICAgIH1cbiAgICBcbiAgICBDW3JvdyAqIGNvbHNCICsgY29sXSA9IHN1bTtcbn1cbmA7XG5cbi8qKlxuICogTWF0cml4LU1hdHJpeCBNdWx0aXBsaWNhdGlvbiBLZXJuZWwgKFRpbGVkL09wdGltaXplZClcbiAqIFVzZXMgc2hhcmVkIGxvY2FsIG1lbW9yeSBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlXG4gKiBDID0gQSDDlyBCXG4gKi9cbmV4cG9ydCBjb25zdCBtYXRyaXhNdWxUaWxlZENMID0gYFxuX19rZXJuZWwgdm9pZCBtYXRyaXhfbXVsX3RpbGVkKFxuICAgIF9fZ2xvYmFsIGNvbnN0IGZsb2F0KiBBLFxuICAgIF9fZ2xvYmFsIGNvbnN0IGZsb2F0KiBCLFxuICAgIF9fZ2xvYmFsIGZsb2F0KiBDLFxuICAgIGNvbnN0IGludCByb3dzQSxcbiAgICBjb25zdCBpbnQgY29sc0EsXG4gICAgY29uc3QgaW50IGNvbHNCXG4pIHtcbiAgICAvLyBUaWxlIHNpemUgKG11c3QgbWF0Y2ggd29yayBncm91cCBzaXplKVxuICAgIGNvbnN0IGludCBUSUxFX1NJWkUgPSAxNjtcbiAgICBcbiAgICBfX2xvY2FsIGZsb2F0IHRpbGVBW1RJTEVfU0laRV1bVElMRV9TSVpFXTtcbiAgICBfX2xvY2FsIGZsb2F0IHRpbGVCW1RJTEVfU0laRV1bVElMRV9TSVpFXTtcbiAgICBcbiAgICBpbnQgcm93ID0gZ2V0X2dsb2JhbF9pZCgxKTtcbiAgICBpbnQgY29sID0gZ2V0X2dsb2JhbF9pZCgwKTtcbiAgICBpbnQgbG9jYWxSb3cgPSBnZXRfbG9jYWxfaWQoMSk7XG4gICAgaW50IGxvY2FsQ29sID0gZ2V0X2xvY2FsX2lkKDApO1xuICAgIFxuICAgIGZsb2F0IHN1bSA9IDAuMGY7XG4gICAgXG4gICAgLy8gTG9vcCBvdmVyIHRpbGVzXG4gICAgZm9yIChpbnQgdCA9IDA7IHQgPCAoY29sc0EgKyBUSUxFX1NJWkUgLSAxKSAvIFRJTEVfU0laRTsgdCsrKSB7XG4gICAgICAgIC8vIExvYWQgdGlsZSBBXG4gICAgICAgIGlmIChyb3cgPCByb3dzQSAmJiAodCAqIFRJTEVfU0laRSArIGxvY2FsQ29sKSA8IGNvbHNBKSB7XG4gICAgICAgICAgICB0aWxlQVtsb2NhbFJvd11bbG9jYWxDb2xdID0gQVtyb3cgKiBjb2xzQSArIHQgKiBUSUxFX1NJWkUgKyBsb2NhbENvbF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aWxlQVtsb2NhbFJvd11bbG9jYWxDb2xdID0gMC4wZjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gTG9hZCB0aWxlIEJcbiAgICAgICAgaWYgKCh0ICogVElMRV9TSVpFICsgbG9jYWxSb3cpIDwgY29sc0EgJiYgY29sIDwgY29sc0IpIHtcbiAgICAgICAgICAgIHRpbGVCW2xvY2FsUm93XVtsb2NhbENvbF0gPSBCWyh0ICogVElMRV9TSVpFICsgbG9jYWxSb3cpICogY29sc0IgKyBjb2xdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGlsZUJbbG9jYWxSb3ddW2xvY2FsQ29sXSA9IDAuMGY7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFN5bmNocm9uaXplXG4gICAgICAgIGJhcnJpZXIoQ0xLX0xPQ0FMX01FTV9GRU5DRSk7XG4gICAgICAgIFxuICAgICAgICAvLyBNdWx0aXBseSB0aWxlc1xuICAgICAgICBmb3IgKGludCBrID0gMDsgayA8IFRJTEVfU0laRTsgaysrKSB7XG4gICAgICAgICAgICBzdW0gKz0gdGlsZUFbbG9jYWxSb3ddW2tdICogdGlsZUJba11bbG9jYWxDb2xdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBTeW5jaHJvbml6ZVxuICAgICAgICBiYXJyaWVyKENMS19MT0NBTF9NRU1fRkVOQ0UpO1xuICAgIH1cbiAgICBcbiAgICAvLyBTdG9yZSByZXN1bHRcbiAgICBpZiAocm93IDwgcm93c0EgJiYgY29sIDwgY29sc0IpIHtcbiAgICAgICAgQ1tyb3cgKiBjb2xzQiArIGNvbF0gPSBzdW07XG4gICAgfVxufVxuYDtcblxuLyoqXG4gKiBNYXRyaXggVHJhbnNwb3NlIEtlcm5lbFxuICogQiA9IEFeVFxuICovXG5leHBvcnQgY29uc3QgbWF0cml4VHJhbnNwb3NlQ0wgPSBgXG5fX2tlcm5lbCB2b2lkIG1hdHJpeF90cmFuc3Bvc2UoXG4gICAgX19nbG9iYWwgY29uc3QgZmxvYXQqIEEsXG4gICAgX19nbG9iYWwgZmxvYXQqIEIsXG4gICAgY29uc3QgaW50IHJvd3MsXG4gICAgY29uc3QgaW50IGNvbHNcbikge1xuICAgIGludCByb3cgPSBnZXRfZ2xvYmFsX2lkKDEpO1xuICAgIGludCBjb2wgPSBnZXRfZ2xvYmFsX2lkKDApO1xuICAgIFxuICAgIGlmIChyb3cgPj0gcm93cyB8fCBjb2wgPj0gY29scykgcmV0dXJuO1xuICAgIFxuICAgIEJbY29sICogcm93cyArIHJvd10gPSBBW3JvdyAqIGNvbHMgKyBjb2xdO1xufVxuYDtcblxuLyoqXG4gKiBNYXRyaXggQWRkaXRpb24gS2VybmVsXG4gKiBDID0gQSArIEJcbiAqL1xuZXhwb3J0IGNvbnN0IG1hdHJpeEFkZENMID0gYFxuX19rZXJuZWwgdm9pZCBtYXRyaXhfYWRkKFxuICAgIF9fZ2xvYmFsIGNvbnN0IGZsb2F0KiBBLFxuICAgIF9fZ2xvYmFsIGNvbnN0IGZsb2F0KiBCLFxuICAgIF9fZ2xvYmFsIGZsb2F0KiBDLFxuICAgIGNvbnN0IGludCByb3dzLFxuICAgIGNvbnN0IGludCBjb2xzXG4pIHtcbiAgICBpbnQgcm93ID0gZ2V0X2dsb2JhbF9pZCgxKTtcbiAgICBpbnQgY29sID0gZ2V0X2dsb2JhbF9pZCgwKTtcbiAgICBcbiAgICBpZiAocm93ID49IHJvd3MgfHwgY29sID49IGNvbHMpIHJldHVybjtcbiAgICBcbiAgICBDW3JvdyAqIGNvbHMgKyBjb2xdID0gQVtyb3cgKiBjb2xzICsgY29sXSArIEJbcm93ICogY29scyArIGNvbF07XG59XG5gO1xuXG4vKipcbiAqIE1hdHJpeCBTdWJ0cmFjdGlvbiBLZXJuZWxcbiAqIEMgPSBBIC0gQlxuICovXG5leHBvcnQgY29uc3QgbWF0cml4U3ViQ0wgPSBgXG5fX2tlcm5lbCB2b2lkIG1hdHJpeF9zdWIoXG4gICAgX19nbG9iYWwgY29uc3QgZmxvYXQqIEEsXG4gICAgX19nbG9iYWwgY29uc3QgZmxvYXQqIEIsXG4gICAgX19nbG9iYWwgZmxvYXQqIEMsXG4gICAgY29uc3QgaW50IHJvd3MsXG4gICAgY29uc3QgaW50IGNvbHNcbikge1xuICAgIGludCByb3cgPSBnZXRfZ2xvYmFsX2lkKDEpO1xuICAgIGludCBjb2wgPSBnZXRfZ2xvYmFsX2lkKDApO1xuICAgIFxuICAgIGlmIChyb3cgPj0gcm93cyB8fCBjb2wgPj0gY29scykgcmV0dXJuO1xuICAgIFxuICAgIENbcm93ICogY29scyArIGNvbF0gPSBBW3JvdyAqIGNvbHMgKyBjb2xdIC0gQltyb3cgKiBjb2xzICsgY29sXTtcbn1cbmA7XG5cbi8qKlxuICogTWF0cml4IFNjYWxlIEtlcm5lbFxuICogQiA9IEEgKiBzY2FsYXJcbiAqL1xuZXhwb3J0IGNvbnN0IG1hdHJpeFNjYWxlQ0wgPSBgXG5fX2tlcm5lbCB2b2lkIG1hdHJpeF9zY2FsZShcbiAgICBfX2dsb2JhbCBjb25zdCBmbG9hdCogQSxcbiAgICBfX2dsb2JhbCBmbG9hdCogQixcbiAgICBjb25zdCBmbG9hdCBzY2FsYXIsXG4gICAgY29uc3QgaW50IHJvd3MsXG4gICAgY29uc3QgaW50IGNvbHNcbikge1xuICAgIGludCByb3cgPSBnZXRfZ2xvYmFsX2lkKDEpO1xuICAgIGludCBjb2wgPSBnZXRfZ2xvYmFsX2lkKDApO1xuICAgIFxuICAgIGlmIChyb3cgPj0gcm93cyB8fCBjb2wgPj0gY29scykgcmV0dXJuO1xuICAgIFxuICAgIEJbcm93ICogY29scyArIGNvbF0gPSBBW3JvdyAqIGNvbHMgKyBjb2xdICogc2NhbGFyO1xufVxuYDtcblxuLyoqXG4gKiBMVSBEZWNvbXBvc2l0aW9uIEtlcm5lbCAoUGFydGlhbClcbiAqIEZvciBzb2x2aW5nIGxpbmVhciBzeXN0ZW1zXG4gKi9cbmV4cG9ydCBjb25zdCBsdURlY29tcG9zaXRpb25DTCA9IGBcbl9fa2VybmVsIHZvaWQgbHVfZGVjb21wb3NlKFxuICAgIF9fZ2xvYmFsIGZsb2F0KiBtYXRyaXgsXG4gICAgX19nbG9iYWwgaW50KiBwaXZvdCxcbiAgICBjb25zdCBpbnQgblxuKSB7XG4gICAgaW50IHJvdyA9IGdldF9nbG9iYWxfaWQoMCk7XG4gICAgaWYgKHJvdyA+PSBuKSByZXR1cm47XG4gICAgXG4gICAgLy8gSW5pdGlhbGl6ZSBwaXZvdFxuICAgIHBpdm90W3Jvd10gPSByb3c7XG4gICAgXG4gICAgLy8gRmluZCBwaXZvdCBmb3IgdGhpcyBjb2x1bW5cbiAgICBmbG9hdCBtYXhfdmFsID0gZmFicyhtYXRyaXhbcm93ICogbiArIHJvd10pO1xuICAgIGludCBtYXhfcm93ID0gcm93O1xuICAgIFxuICAgIGZvciAoaW50IGkgPSByb3cgKyAxOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIGZsb2F0IHZhbCA9IGZhYnMobWF0cml4W2kgKiBuICsgcm93XSk7XG4gICAgICAgIGlmICh2YWwgPiBtYXhfdmFsKSB7XG4gICAgICAgICAgICBtYXhfdmFsID0gdmFsO1xuICAgICAgICAgICAgbWF4X3JvdyA9IGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gU3dhcCByb3dzIGlmIG5lZWRlZFxuICAgIGlmIChtYXhfcm93ICE9IHJvdykge1xuICAgICAgICBwaXZvdFtyb3ddID0gbWF4X3JvdztcbiAgICAgICAgZm9yIChpbnQgaiA9IDA7IGogPCBuOyBqKyspIHtcbiAgICAgICAgICAgIGZsb2F0IHRlbXAgPSBtYXRyaXhbcm93ICogbiArIGpdO1xuICAgICAgICAgICAgbWF0cml4W3JvdyAqIG4gKyBqXSA9IG1hdHJpeFttYXhfcm93ICogbiArIGpdO1xuICAgICAgICAgICAgbWF0cml4W21heF9yb3cgKiBuICsgal0gPSB0ZW1wO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIEVsaW1pbmF0ZSBjb2x1bW5cbiAgICBpZiAobWF0cml4W3JvdyAqIG4gKyByb3ddICE9IDAuMGYpIHtcbiAgICAgICAgZm9yIChpbnQgaSA9IHJvdyArIDE7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIGZsb2F0IGZhY3RvciA9IG1hdHJpeFtpICogbiArIHJvd10gLyBtYXRyaXhbcm93ICogbiArIHJvd107XG4gICAgICAgICAgICBtYXRyaXhbaSAqIG4gKyByb3ddID0gZmFjdG9yO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgKGludCBqID0gcm93ICsgMTsgaiA8IG47IGorKykge1xuICAgICAgICAgICAgICAgIG1hdHJpeFtpICogbiArIGpdIC09IGZhY3RvciAqIG1hdHJpeFtyb3cgKiBuICsgal07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5gO1xuXG4vKipcbiAqIEdhdXNzaWFuIEVsaW1pbmF0aW9uIEtlcm5lbFxuICogRm9yIHNvbHZpbmcgQXggPSBiXG4gKi9cbmV4cG9ydCBjb25zdCBnYXVzc2lhbkVsaW1pbmF0aW9uQ0wgPSBgXG5fX2tlcm5lbCB2b2lkIGdhdXNzaWFuX2VsaW1pbmF0aW9uKFxuICAgIF9fZ2xvYmFsIGZsb2F0KiBBLFxuICAgIF9fZ2xvYmFsIGZsb2F0KiBiLFxuICAgIF9fZ2xvYmFsIGZsb2F0KiB4LFxuICAgIGNvbnN0IGludCBuXG4pIHtcbiAgICBpbnQgcm93ID0gZ2V0X2dsb2JhbF9pZCgwKTtcbiAgICBpZiAocm93ID49IG4pIHJldHVybjtcbiAgICBcbiAgICAvLyBGb3J3YXJkIGVsaW1pbmF0aW9uXG4gICAgZm9yIChpbnQgayA9IDA7IGsgPCBuOyBrKyspIHtcbiAgICAgICAgaWYgKHJvdyA+IGspIHtcbiAgICAgICAgICAgIGZsb2F0IGZhY3RvciA9IEFbcm93ICogbiArIGtdIC8gQVtrICogbiArIGtdO1xuICAgICAgICAgICAgZm9yIChpbnQgaiA9IGs7IGogPCBuOyBqKyspIHtcbiAgICAgICAgICAgICAgICBBW3JvdyAqIG4gKyBqXSAtPSBmYWN0b3IgKiBBW2sgKiBuICsgal07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBiW3Jvd10gLT0gZmFjdG9yICogYltrXTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmA7XG5cbi8qKlxuICogQmFjayBTdWJzdGl0dXRpb24gS2VybmVsXG4gKiBTb2x2ZSB1cHBlciB0cmlhbmd1bGFyIHN5c3RlbVxuICovXG5leHBvcnQgY29uc3QgYmFja1N1YnN0aXR1dGlvbkNMID0gYFxuX19rZXJuZWwgdm9pZCBiYWNrX3N1YnN0aXR1dGlvbihcbiAgICBfX2dsb2JhbCBjb25zdCBmbG9hdCogVSxcbiAgICBfX2dsb2JhbCBjb25zdCBmbG9hdCogeSxcbiAgICBfX2dsb2JhbCBmbG9hdCogeCxcbiAgICBjb25zdCBpbnQgblxuKSB7XG4gICAgaW50IHJvdyA9IGdldF9nbG9iYWxfaWQoMCk7XG4gICAgaWYgKHJvdyA+PSBuKSByZXR1cm47XG4gICAgXG4gICAgZmxvYXQgc3VtID0gMC4wZjtcbiAgICBcbiAgICBmb3IgKGludCBqID0gcm93ICsgMTsgaiA8IG47IGorKykge1xuICAgICAgICBzdW0gKz0gVVtyb3cgKiBuICsgal0gKiB4W2pdO1xuICAgIH1cbiAgICBcbiAgICB4W3Jvd10gPSAoeVtyb3ddIC0gc3VtKSAvIFVbcm93ICogbiArIHJvd107XG59XG5gO1xuXG4vKipcbiAqIEVpZ2VudmFsdWUgUG93ZXIgSXRlcmF0aW9uIEtlcm5lbFxuICogRmluZCBkb21pbmFudCBlaWdlbnZhbHVlL2VpZ2VudmVjdG9yXG4gKi9cbmV4cG9ydCBjb25zdCBlaWdlbnZhbHVlUG93ZXJJdGVyYXRpb25DTCA9IGBcbl9fa2VybmVsIHZvaWQgcG93ZXJfaXRlcmF0aW9uKFxuICAgIF9fZ2xvYmFsIGNvbnN0IGZsb2F0KiBtYXRyaXgsXG4gICAgX19nbG9iYWwgZmxvYXQqIHZlY3RvcixcbiAgICBfX2dsb2JhbCBmbG9hdCogbmV3X3ZlY3RvcixcbiAgICBfX2dsb2JhbCBmbG9hdCogZWlnZW52YWx1ZSxcbiAgICBjb25zdCBpbnQgblxuKSB7XG4gICAgaW50IHJvdyA9IGdldF9nbG9iYWxfaWQoMCk7XG4gICAgaWYgKHJvdyA+PSBuKSByZXR1cm47XG4gICAgXG4gICAgLy8gTWF0cml4LXZlY3RvciBtdWx0aXBseVxuICAgIGZsb2F0IHN1bSA9IDAuMGY7XG4gICAgZm9yIChpbnQgY29sID0gMDsgY29sIDwgbjsgY29sKyspIHtcbiAgICAgICAgc3VtICs9IG1hdHJpeFtyb3cgKiBuICsgY29sXSAqIHZlY3Rvcltjb2xdO1xuICAgIH1cbiAgICBuZXdfdmVjdG9yW3Jvd10gPSBzdW07XG59XG5gO1xuXG4vKipcbiAqIFNWRCAoU2luZ3VsYXIgVmFsdWUgRGVjb21wb3NpdGlvbikgLSBPbmUgU3RlcFxuICogU2ltcGxpZmllZCBmb3IgR1BVXG4gKi9cbmV4cG9ydCBjb25zdCBzdmRTdGVwQ0wgPSBgXG5fX2tlcm5lbCB2b2lkIHN2ZF9zdGVwKFxuICAgIF9fZ2xvYmFsIGZsb2F0KiBtYXRyaXgsXG4gICAgX19nbG9iYWwgZmxvYXQqIFUsXG4gICAgX19nbG9iYWwgZmxvYXQqIFMsXG4gICAgX19nbG9iYWwgZmxvYXQqIFYsXG4gICAgY29uc3QgaW50IHJvd3MsXG4gICAgY29uc3QgaW50IGNvbHMsXG4gICAgY29uc3QgZmxvYXQgdG9sZXJhbmNlXG4pIHtcbiAgICBpbnQgcm93ID0gZ2V0X2dsb2JhbF9pZCgwKTtcbiAgICBpbnQgY29sID0gZ2V0X2dsb2JhbF9pZCgxKTtcbiAgICBcbiAgICBpZiAocm93ID49IHJvd3MgfHwgY29sID49IGNvbHMpIHJldHVybjtcbiAgICBcbiAgICAvLyBTaW1wbGlmaWVkIFNWRCBzdGVwIChKYWNvYmkgcm90YXRpb24pXG4gICAgLy8gRnVsbCBTVkQgd291bGQgcmVxdWlyZSBtdWx0aXBsZSBpdGVyYXRpb25zXG4gICAgXG4gICAgZmxvYXQgdmFsID0gbWF0cml4W3JvdyAqIGNvbHMgKyBjb2xdO1xuICAgIGZsb2F0IHNpZ21hID0gZmFicyh2YWwpO1xuICAgIFxuICAgIGlmIChzaWdtYSA+IHRvbGVyYW5jZSkge1xuICAgICAgICAvLyBVcGRhdGUgc2luZ3VsYXIgdmFsdWVcbiAgICAgICAgU1ttaW4ocm93LCBjb2wpXSArPSB2YWw7XG4gICAgfVxufVxuYDtcblxuLyoqXG4gKiBDb252b2x1dGlvbiBLZXJuZWwgKDFEKVxuICogRm9yIHNpZ25hbCBwcm9jZXNzaW5nXG4gKi9cbmV4cG9ydCBjb25zdCBjb252b2x1dGlvbjFEQ0wgPSBgXG5fX2tlcm5lbCB2b2lkIGNvbnZvbHV0aW9uXzFkKFxuICAgIF9fZ2xvYmFsIGNvbnN0IGZsb2F0KiBzaWduYWwsXG4gICAgX19nbG9iYWwgY29uc3QgZmxvYXQqIGtlcm5lbCxcbiAgICBfX2dsb2JhbCBmbG9hdCogb3V0cHV0LFxuICAgIGNvbnN0IGludCBzaWduYWxfbGVuLFxuICAgIGNvbnN0IGludCBrZXJuZWxfbGVuXG4pIHtcbiAgICBpbnQgaSA9IGdldF9nbG9iYWxfaWQoMCk7XG4gICAgaWYgKGkgPj0gc2lnbmFsX2xlbikgcmV0dXJuO1xuICAgIFxuICAgIGZsb2F0IHN1bSA9IDAuMGY7XG4gICAgaW50IGhhbGZfa2VybmVsID0ga2VybmVsX2xlbiAvIDI7XG4gICAgXG4gICAgZm9yIChpbnQgaiA9IDA7IGogPCBrZXJuZWxfbGVuOyBqKyspIHtcbiAgICAgICAgaW50IGlkeCA9IGkgLSBoYWxmX2tlcm5lbCArIGo7XG4gICAgICAgIGlmIChpZHggPj0gMCAmJiBpZHggPCBzaWduYWxfbGVuKSB7XG4gICAgICAgICAgICBzdW0gKz0gc2lnbmFsW2lkeF0gKiBrZXJuZWxbal07XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgb3V0cHV0W2ldID0gc3VtO1xufVxuYDtcblxuLyoqXG4gKiBDb252b2x1dGlvbiBLZXJuZWwgKDJEKVxuICogRm9yIGltYWdlIHByb2Nlc3NpbmdcbiAqL1xuZXhwb3J0IGNvbnN0IGNvbnZvbHV0aW9uMkRDTCA9IGBcbl9fa2VybmVsIHZvaWQgY29udm9sdXRpb25fMmQoXG4gICAgX19nbG9iYWwgY29uc3QgZmxvYXQqIGltYWdlLFxuICAgIF9fZ2xvYmFsIGNvbnN0IGZsb2F0KiBrZXJuZWwsXG4gICAgX19nbG9iYWwgZmxvYXQqIG91dHB1dCxcbiAgICBjb25zdCBpbnQgd2lkdGgsXG4gICAgY29uc3QgaW50IGhlaWdodCxcbiAgICBjb25zdCBpbnQga2VybmVsX3NpemVcbikge1xuICAgIGludCB4ID0gZ2V0X2dsb2JhbF9pZCgwKTtcbiAgICBpbnQgeSA9IGdldF9nbG9iYWxfaWQoMSk7XG4gICAgXG4gICAgaWYgKHggPj0gd2lkdGggfHwgeSA+PSBoZWlnaHQpIHJldHVybjtcbiAgICBcbiAgICBmbG9hdCBzdW0gPSAwLjBmO1xuICAgIGludCBoYWxmX2tlcm5lbCA9IGtlcm5lbF9zaXplIC8gMjtcbiAgICBcbiAgICBmb3IgKGludCBreSA9IC1oYWxmX2tlcm5lbDsga3kgPD0gaGFsZl9rZXJuZWw7IGt5KyspIHtcbiAgICAgICAgZm9yIChpbnQga3ggPSAtaGFsZl9rZXJuZWw7IGt4IDw9IGhhbGZfa2VybmVsOyBreCsrKSB7XG4gICAgICAgICAgICBpbnQgaW1nX3ggPSB4ICsga3g7XG4gICAgICAgICAgICBpbnQgaW1nX3kgPSB5ICsga3k7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChpbWdfeCA+PSAwICYmIGltZ194IDwgd2lkdGggJiYgaW1nX3kgPj0gMCAmJiBpbWdfeSA8IGhlaWdodCkge1xuICAgICAgICAgICAgICAgIGludCBrZXJuZWxfaWR4ID0gKGt5ICsgaGFsZl9rZXJuZWwpICoga2VybmVsX3NpemUgKyAoa3ggKyBoYWxmX2tlcm5lbCk7XG4gICAgICAgICAgICAgICAgc3VtICs9IGltYWdlW2ltZ195ICogd2lkdGggKyBpbWdfeF0gKiBrZXJuZWxba2VybmVsX2lkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgb3V0cHV0W3kgKiB3aWR0aCArIHhdID0gc3VtO1xufVxuYDtcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gT1BFTkNMIFZFQ1RPUiBMQU5FIENMQVNTXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmV4cG9ydCBjbGFzcyBPcGVuQ0xWZWN0b3JMYW5lIGV4dGVuZHMgT3BlbkNMTGFuZSB7XG4gIHByaXZhdGUgdmVjdG9yS2VybmVsczogTWFwPHN0cmluZywgc3RyaW5nPiA9IG5ldyBNYXAoKTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFBhcnRpYWw8T3BlbkNMQ29tcHV0ZUNvbmZpZz4gPSB7fSkge1xuICAgIHN1cGVyKGNvbmZpZyk7XG4gICAgdGhpcy5pbml0aWFsaXplVmVjdG9yS2VybmVscygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdmVjdG9yL2xpbmVhciBhbGdlYnJhIGtlcm5lbHNcbiAgICovXG4gIHByaXZhdGUgaW5pdGlhbGl6ZVZlY3Rvcktlcm5lbHMoKTogdm9pZCB7XG4gICAgdGhpcy52ZWN0b3JLZXJuZWxzLnNldCgndmVjdG9yX2FkZCcsIHZlY3RvckFkZENMKTtcbiAgICB0aGlzLnZlY3Rvcktlcm5lbHMuc2V0KCd2ZWN0b3Jfc3ViJywgdmVjdG9yU3ViQ0wpO1xuICAgIHRoaXMudmVjdG9yS2VybmVscy5zZXQoJ3ZlY3Rvcl9kb3QnLCB2ZWN0b3JEb3RDTCk7XG4gICAgdGhpcy52ZWN0b3JLZXJuZWxzLnNldCgndmVjdG9yX2Nyb3NzJywgdmVjdG9yQ3Jvc3NDTCk7XG4gICAgdGhpcy52ZWN0b3JLZXJuZWxzLnNldCgndmVjdG9yX3NjYWxlJywgdmVjdG9yU2NhbGVDTCk7XG4gICAgdGhpcy52ZWN0b3JLZXJuZWxzLnNldCgndmVjdG9yX25vcm1hbGl6ZScsIHZlY3Rvck5vcm1hbGl6ZUNMKTtcbiAgICB0aGlzLnZlY3Rvcktlcm5lbHMuc2V0KCd2ZWN0b3JfbWFnbml0dWRlJywgdmVjdG9yTWFnbml0dWRlQ0wpO1xuICAgIHRoaXMudmVjdG9yS2VybmVscy5zZXQoJ21hdHJpeF92ZWN0b3JfbXVsJywgbWF0cml4VmVjdG9yTXVsQ0wpO1xuICAgIHRoaXMudmVjdG9yS2VybmVscy5zZXQoJ21hdHJpeF9tdWxfbmFpdmUnLCBtYXRyaXhNdWxOYWl2ZUNMKTtcbiAgICB0aGlzLnZlY3Rvcktlcm5lbHMuc2V0KCdtYXRyaXhfbXVsX3RpbGVkJywgbWF0cml4TXVsVGlsZWRDTCk7XG4gICAgdGhpcy52ZWN0b3JLZXJuZWxzLnNldCgnbWF0cml4X3RyYW5zcG9zZScsIG1hdHJpeFRyYW5zcG9zZUNMKTtcbiAgICB0aGlzLnZlY3Rvcktlcm5lbHMuc2V0KCdtYXRyaXhfYWRkJywgbWF0cml4QWRkQ0wpO1xuICAgIHRoaXMudmVjdG9yS2VybmVscy5zZXQoJ21hdHJpeF9zdWInLCBtYXRyaXhTdWJDTCk7XG4gICAgdGhpcy52ZWN0b3JLZXJuZWxzLnNldCgnbWF0cml4X3NjYWxlJywgbWF0cml4U2NhbGVDTCk7XG4gICAgdGhpcy52ZWN0b3JLZXJuZWxzLnNldCgnbHVfZGVjb21wb3NlJywgbHVEZWNvbXBvc2l0aW9uQ0wpO1xuICAgIHRoaXMudmVjdG9yS2VybmVscy5zZXQoJ2dhdXNzaWFuX2VsaW1pbmF0aW9uJywgZ2F1c3NpYW5FbGltaW5hdGlvbkNMKTtcbiAgICB0aGlzLnZlY3Rvcktlcm5lbHMuc2V0KCdiYWNrX3N1YnN0aXR1dGlvbicsIGJhY2tTdWJzdGl0dXRpb25DTCk7XG4gICAgdGhpcy52ZWN0b3JLZXJuZWxzLnNldCgnZWlnZW52YWx1ZV9wb3dlcl9pdGVyYXRpb24nLCBlaWdlbnZhbHVlUG93ZXJJdGVyYXRpb25DTCk7XG4gICAgdGhpcy52ZWN0b3JLZXJuZWxzLnNldCgnc3ZkX3N0ZXAnLCBzdmRTdGVwQ0wpO1xuICAgIHRoaXMudmVjdG9yS2VybmVscy5zZXQoJ2NvbnZvbHV0aW9uXzFkJywgY29udm9sdXRpb24xRENMKTtcbiAgICB0aGlzLnZlY3Rvcktlcm5lbHMuc2V0KCdjb252b2x1dGlvbl8yZCcsIGNvbnZvbHV0aW9uMkRDTCk7XG5cbiAgICBjb25zb2xlLmxvZygnICDinJMgVmVjdG9yIGtlcm5lbHMgcmVnaXN0ZXJlZDogJyArIHRoaXMudmVjdG9yS2VybmVscy5zaXplKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIHZlY3RvciBhZGRpdGlvblxuICAgKi9cbiAgYXN5bmMgdmVjdG9yQWRkKGE6IEZsb2F0MzJBcnJheSwgYjogRmxvYXQzMkFycmF5KTogUHJvbWlzZTxGbG9hdDMyQXJyYXk+IHtcbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZlY3RvciBsZW5ndGhzIG11c3QgbWF0Y2gnKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSBuZXcgRmxvYXQzMkFycmF5KGEubGVuZ3RoKTtcbiAgICBcbiAgICAvLyBTaW11bGF0ZWQgT3BlbkNMIGV4ZWN1dGlvblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0W2ldID0gYVtpXSArIGJbaV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIHZlY3RvciBkb3QgcHJvZHVjdFxuICAgKi9cbiAgYXN5bmMgdmVjdG9yRG90KGE6IEZsb2F0MzJBcnJheSwgYjogRmxvYXQzMkFycmF5KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1ZlY3RvciBsZW5ndGhzIG11c3QgbWF0Y2gnKTtcbiAgICB9XG5cbiAgICBsZXQgc3VtID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIHN1bSArPSBhW2ldICogYltpXTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3VtO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgdmVjdG9yIGNyb3NzIHByb2R1Y3QgKDNEKVxuICAgKi9cbiAgYXN5bmMgdmVjdG9yQ3Jvc3MoYTogW251bWJlciwgbnVtYmVyLCBudW1iZXJdLCBiOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl0pOiBQcm9taXNlPFtudW1iZXIsIG51bWJlciwgbnVtYmVyXT4ge1xuICAgIHJldHVybiBbXG4gICAgICBhWzFdICogYlsyXSAtIGFbMl0gKiBiWzFdLFxuICAgICAgYVsyXSAqIGJbMF0gLSBhWzBdICogYlsyXSxcbiAgICAgIGFbMF0gKiBiWzFdIC0gYVsxXSAqIGJbMF1cbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgbWF0cml4LXZlY3RvciBtdWx0aXBsaWNhdGlvblxuICAgKi9cbiAgYXN5bmMgbWF0cml4VmVjdG9yTXVsKG1hdHJpeDogRmxvYXQzMkFycmF5LCB2ZWN0b3I6IEZsb2F0MzJBcnJheSwgcm93czogbnVtYmVyLCBjb2xzOiBudW1iZXIpOiBQcm9taXNlPEZsb2F0MzJBcnJheT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBGbG9hdDMyQXJyYXkocm93cyk7XG4gICAgXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb3dzOyBpKyspIHtcbiAgICAgIGxldCBzdW0gPSAwO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb2xzOyBqKyspIHtcbiAgICAgICAgc3VtICs9IG1hdHJpeFtpICogY29scyArIGpdICogdmVjdG9yW2pdO1xuICAgICAgfVxuICAgICAgcmVzdWx0W2ldID0gc3VtO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBtYXRyaXggbXVsdGlwbGljYXRpb24gKHRpbGVkKVxuICAgKi9cbiAgYXN5bmMgbWF0cml4TXVsVGlsZWQoQTogRmxvYXQzMkFycmF5LCBCOiBGbG9hdDMyQXJyYXksIHJvd3NBOiBudW1iZXIsIGNvbHNBOiBudW1iZXIsIGNvbHNCOiBudW1iZXIpOiBQcm9taXNlPEZsb2F0MzJBcnJheT4ge1xuICAgIGNvbnN0IEMgPSBuZXcgRmxvYXQzMkFycmF5KHJvd3NBICogY29sc0IpO1xuICAgIGNvbnN0IFRJTEVfU0laRSA9IDE2O1xuXG4gICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgcm93c0E7IHJvdysrKSB7XG4gICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCBjb2xzQjsgY29sKyspIHtcbiAgICAgICAgbGV0IHN1bSA9IDA7XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCB0ID0gMDsgdCA8IGNvbHNBOyB0ICs9IFRJTEVfU0laRSkge1xuICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgVElMRV9TSVpFICYmICh0ICsgaykgPCBjb2xzQTsgaysrKSB7XG4gICAgICAgICAgICBzdW0gKz0gQVtyb3cgKiBjb2xzQSArICh0ICsgayldICogQlsodCArIGspICogY29sc0IgKyBjb2xdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgQ1tyb3cgKiBjb2xzQiArIGNvbF0gPSBzdW07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEM7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBMVSBkZWNvbXBvc2l0aW9uXG4gICAqL1xuICBhc3luYyBsdURlY29tcG9zZShtYXRyaXg6IEZsb2F0MzJBcnJheSwgbjogbnVtYmVyKTogUHJvbWlzZTx7IEw6IEZsb2F0MzJBcnJheSwgVTogRmxvYXQzMkFycmF5LCBwaXZvdDogSW50MzJBcnJheSB9PiB7XG4gICAgY29uc3QgTFUgPSBuZXcgRmxvYXQzMkFycmF5KG1hdHJpeCk7XG4gICAgY29uc3QgcGl2b3QgPSBuZXcgSW50MzJBcnJheShuKTtcbiAgICBcbiAgICAvLyBJbml0aWFsaXplIHBpdm90XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgIHBpdm90W2ldID0gaTtcbiAgICB9XG5cbiAgICAvLyBMVSBkZWNvbXBvc2l0aW9uXG4gICAgZm9yIChsZXQgayA9IDA7IGsgPCBuOyBrKyspIHtcbiAgICAgIC8vIEZpbmQgcGl2b3RcbiAgICAgIGxldCBtYXhWYWwgPSBNYXRoLmFicyhMVVtrICogbiArIGtdKTtcbiAgICAgIGxldCBtYXhSb3cgPSBrO1xuICAgICAgXG4gICAgICBmb3IgKGxldCBpID0gayArIDE7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgY29uc3QgdmFsID0gTWF0aC5hYnMoTFVbaSAqIG4gKyBrXSk7XG4gICAgICAgIGlmICh2YWwgPiBtYXhWYWwpIHtcbiAgICAgICAgICBtYXhWYWwgPSB2YWw7XG4gICAgICAgICAgbWF4Um93ID0gaTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBTd2FwIHJvd3NcbiAgICAgIGlmIChtYXhSb3cgIT09IGspIHtcbiAgICAgICAgcGl2b3Rba10gPSBtYXhSb3c7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbjsgaisrKSB7XG4gICAgICAgICAgY29uc3QgdGVtcCA9IExVW2sgKiBuICsgal07XG4gICAgICAgICAgTFVbayAqIG4gKyBqXSA9IExVW21heFJvdyAqIG4gKyBqXTtcbiAgICAgICAgICBMVVttYXhSb3cgKiBuICsgal0gPSB0ZW1wO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEVsaW1pbmF0ZVxuICAgICAgaWYgKExVW2sgKiBuICsga10gIT09IDApIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IGsgKyAxOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgZmFjdG9yID0gTFVbaSAqIG4gKyBrXSAvIExVW2sgKiBuICsga107XG4gICAgICAgICAgTFVbaSAqIG4gKyBrXSA9IGZhY3RvcjtcbiAgICAgICAgICBcbiAgICAgICAgICBmb3IgKGxldCBqID0gayArIDE7IGogPCBuOyBqKyspIHtcbiAgICAgICAgICAgIExVW2kgKiBuICsgal0gLT0gZmFjdG9yICogTFVbayAqIG4gKyBqXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBFeHRyYWN0IEwgYW5kIFVcbiAgICBjb25zdCBMID0gbmV3IEZsb2F0MzJBcnJheShuICogbik7XG4gICAgY29uc3QgVSA9IG5ldyBGbG9hdDMyQXJyYXkobiAqIG4pO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgbjsgaisrKSB7XG4gICAgICAgIGlmIChpID09PSBqKSB7XG4gICAgICAgICAgTFtpICogbiArIGpdID0gMTtcbiAgICAgICAgfSBlbHNlIGlmIChpID4gaikge1xuICAgICAgICAgIExbaSAqIG4gKyBqXSA9IExVW2kgKiBuICsgal07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgTFtpICogbiArIGpdID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpIDw9IGopIHtcbiAgICAgICAgICBVW2kgKiBuICsgal0gPSBMVVtpICogbiArIGpdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIFVbaSAqIG4gKyBqXSA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4geyBMLCBVLCBwaXZvdCB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNvbHZlIGxpbmVhciBzeXN0ZW0gQXggPSBiIHVzaW5nIExVIGRlY29tcG9zaXRpb25cbiAgICovXG4gIGFzeW5jIHNvbHZlTGluZWFyU3lzdGVtKEE6IEZsb2F0MzJBcnJheSwgYjogRmxvYXQzMkFycmF5LCBuOiBudW1iZXIpOiBQcm9taXNlPEZsb2F0MzJBcnJheT4ge1xuICAgIGNvbnN0IHsgTCwgVSwgcGl2b3QgfSA9IGF3YWl0IHRoaXMubHVEZWNvbXBvc2UoQSwgbik7XG4gICAgY29uc3QgeCA9IG5ldyBGbG9hdDMyQXJyYXkobik7XG4gICAgY29uc3QgeSA9IG5ldyBGbG9hdDMyQXJyYXkobik7XG5cbiAgICAvLyBGb3J3YXJkIHN1YnN0aXR1dGlvbiAoTHkgPSBQYilcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgbGV0IHN1bSA9IGJbcGl2b3RbaV1dO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBpOyBqKyspIHtcbiAgICAgICAgc3VtIC09IExbaSAqIG4gKyBqXSAqIHlbal07XG4gICAgICB9XG4gICAgICB5W2ldID0gc3VtO1xuICAgIH1cblxuICAgIC8vIEJhY2sgc3Vic3RpdHV0aW9uIChVeCA9IHkpXG4gICAgZm9yIChsZXQgaSA9IG4gLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgbGV0IHN1bSA9IHlbaV07XG4gICAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPCBuOyBqKyspIHtcbiAgICAgICAgc3VtIC09IFVbaSAqIG4gKyBqXSAqIHhbal07XG4gICAgICB9XG4gICAgICB4W2ldID0gc3VtIC8gVVtpICogbiArIGldO1xuICAgIH1cblxuICAgIHJldHVybiB4O1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgMkQgY29udm9sdXRpb25cbiAgICovXG4gIGFzeW5jIGNvbnZvbHV0aW9uMkQoaW1hZ2U6IEZsb2F0MzJBcnJheSwga2VybmVsOiBGbG9hdDMyQXJyYXksIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBrZXJuZWxTaXplOiBudW1iZXIpOiBQcm9taXNlPEZsb2F0MzJBcnJheT4ge1xuICAgIGNvbnN0IG91dHB1dCA9IG5ldyBGbG9hdDMyQXJyYXkod2lkdGggKiBoZWlnaHQpO1xuICAgIGNvbnN0IGhhbGZLZXJuZWwgPSBNYXRoLmZsb29yKGtlcm5lbFNpemUgLyAyKTtcblxuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xuICAgICAgICBsZXQgc3VtID0gMDtcblxuICAgICAgICBmb3IgKGxldCBreSA9IC1oYWxmS2VybmVsOyBreSA8PSBoYWxmS2VybmVsOyBreSsrKSB7XG4gICAgICAgICAgZm9yIChsZXQga3ggPSAtaGFsZktlcm5lbDsga3ggPD0gaGFsZktlcm5lbDsga3grKykge1xuICAgICAgICAgICAgY29uc3QgaW1nWCA9IHggKyBreDtcbiAgICAgICAgICAgIGNvbnN0IGltZ1kgPSB5ICsga3k7XG5cbiAgICAgICAgICAgIGlmIChpbWdYID49IDAgJiYgaW1nWCA8IHdpZHRoICYmIGltZ1kgPj0gMCAmJiBpbWdZIDwgaGVpZ2h0KSB7XG4gICAgICAgICAgICAgIGNvbnN0IGtlcm5lbElkeCA9IChreSArIGhhbGZLZXJuZWwpICoga2VybmVsU2l6ZSArIChreCArIGhhbGZLZXJuZWwpO1xuICAgICAgICAgICAgICBzdW0gKz0gaW1hZ2VbaW1nWSAqIHdpZHRoICsgaW1nWF0gKiBrZXJuZWxba2VybmVsSWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBvdXRwdXRbeSAqIHdpZHRoICsgeF0gPSBzdW07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIGF2YWlsYWJsZSB2ZWN0b3Iga2VybmVsc1xuICAgKi9cbiAgZ2V0QXZhaWxhYmxlS2VybmVscygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy52ZWN0b3JLZXJuZWxzLmtleXMoKSk7XG4gIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gVVNBR0UgRVhBTVBMRVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4vKipcbiAqIEV4YW1wbGU6IFVzaW5nIE9wZW5DTCBWZWN0b3IgTGFuZSBmb3IgcGh5c2ljcyBzaW11bGF0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleGFtcGxlUGh5c2ljc1dpdGhWZWN0b3JTaGFkZXJzKCkge1xuICBjb25zdCBsYW5lID0gbmV3IE9wZW5DTFZlY3RvckxhbmUoeyB1c2VHUFU6IHRydWUgfSk7XG4gIFxuICBhd2FpdCBsYW5lLmluaXRpYWxpemUoKTtcblxuICAvLyBJbml0aWFsaXplIDEwMDAgYm9kaWVzXG4gIGNvbnN0IHBvc2l0aW9ucyA9IG5ldyBGbG9hdDMyQXJyYXkoMTAwMCAqIDMpO1xuICBjb25zdCB2ZWxvY2l0aWVzID0gbmV3IEZsb2F0MzJBcnJheSgxMDAwICogMyk7XG4gIGNvbnN0IG1hc3NlcyA9IG5ldyBGbG9hdDMyQXJyYXkoMTAwMCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDAwOyBpKyspIHtcbiAgICBwb3NpdGlvbnNbaSAqIDMgKyAwXSA9IE1hdGgucmFuZG9tKCkgKiAxMDA7XG4gICAgcG9zaXRpb25zW2kgKiAzICsgMV0gPSBNYXRoLnJhbmRvbSgpICogMTAwO1xuICAgIHBvc2l0aW9uc1tpICogMyArIDJdID0gTWF0aC5yYW5kb20oKSAqIDEwMDtcbiAgICBcbiAgICB2ZWxvY2l0aWVzW2kgKiAzICsgMF0gPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiAxMDtcbiAgICB2ZWxvY2l0aWVzW2kgKiAzICsgMV0gPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiAxMDtcbiAgICB2ZWxvY2l0aWVzW2kgKiAzICsgMl0gPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiAxMDtcbiAgICBcbiAgICBtYXNzZXNbaV0gPSAxLjAgKyBNYXRoLnJhbmRvbSgpICogMTA7XG4gIH1cblxuICAvLyBTaW11bGF0ZSBvbmUgdGltZXN0ZXAgdXNpbmcgdmVjdG9yIG9wZXJhdGlvbnNcbiAgY29uc3QgdGltZXN0ZXAgPSAwLjAxNjtcbiAgY29uc3QgZ3Jhdml0eSA9IDkuODE7XG5cbiAgLy8gdiA9IHYgKyBnICogZHQgKHZlY3RvciBzY2FsZSArIGFkZClcbiAgY29uc3QgZ3Jhdml0eVZlYyA9IG5ldyBGbG9hdDMyQXJyYXkoWzAsIC1ncmF2aXR5LCAwXSk7XG4gIGNvbnN0IGRlbHRhViA9IGF3YWl0IGxhbmUudmVjdG9yU2NhbGUoZ3Jhdml0eVZlYywgdGltZXN0ZXApO1xuICBcbiAgY29uc29sZS5sb2coJ1BoeXNpY3Mgc2ltdWxhdGlvbiB3aXRoIE9wZW5DTCB2ZWN0b3Igc2hhZGVycyByZWFkeScpO1xuICBjb25zb2xlLmxvZygnQXZhaWxhYmxlIGtlcm5lbHM6JywgbGFuZS5nZXRBdmFpbGFibGVLZXJuZWxzKCkubGVuZ3RoKTtcbn1cbiJdfQ==