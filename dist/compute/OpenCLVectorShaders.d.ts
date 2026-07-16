/**
 * OpenCL Vector Shaders - Linear Algebra Kernels
 *
 * Khronos OpenCL compute kernels for vector/matrix operations
 * Used by physics, graphics, and ML pipelines
 */
import { OpenCLLane, OpenCLComputeConfig } from './OpenCLLane';
/**
 * Vector Addition Kernel
 * C = A + B
 */
export declare const vectorAddCL = "\n__kernel void vector_add(\n    __global const float* a,\n    __global const float* b,\n    __global float* c,\n    const int n\n) {\n    int i = get_global_id(0);\n    if (i >= n) return;\n    \n    c[i] = a[i] + b[i];\n}\n";
/**
 * Vector Subtraction Kernel
 * C = A - B
 */
export declare const vectorSubCL = "\n__kernel void vector_sub(\n    __global const float* a,\n    __global const float* b,\n    __global float* c,\n    const int n\n) {\n    int i = get_global_id(0);\n    if (i >= n) return;\n    \n    c[i] = a[i] - b[i];\n}\n";
/**
 * Vector Dot Product Kernel
 * Returns scalar = A · B
 */
export declare const vectorDotCL = "\n__kernel void vector_dot(\n    __global const float* a,\n    __global const float* b,\n    __global float* partial_sums,\n    const int n\n) {\n    int i = get_global_id(0);\n    int local_size = get_local_size(0);\n    \n    float sum = 0.0f;\n    \n    // Each work-item computes partial dot product\n    for (int j = i; j < n; j += local_size * 2) {\n        sum += a[j] * b[j];\n        if (j + local_size < n) {\n            sum += a[j + local_size] * b[j + local_size];\n        }\n    }\n    \n    partial_sums[i] = sum;\n}\n";
/**
 * Vector Cross Product Kernel (3D only)
 * C = A × B
 */
export declare const vectorCrossCL = "\n__kernel void vector_cross(\n    __global const float3* a,\n    __global const float3* b,\n    __global float3* c,\n    const int n\n) {\n    int i = get_global_id(0);\n    if (i >= n) return;\n    \n    float3 va = a[i];\n    float3 vb = b[i];\n    \n    c[i] = (float3)(\n        va.y * vb.z - va.z * vb.y,\n        va.z * vb.x - va.x * vb.z,\n        va.x * vb.y - va.y * vb.x\n    );\n}\n";
/**
 * Vector Scale Kernel
 * C = A * scalar
 */
export declare const vectorScaleCL = "\n__kernel void vector_scale(\n    __global const float* a,\n    __global float* c,\n    const float scalar,\n    const int n\n) {\n    int i = get_global_id(0);\n    if (i >= n) return;\n    \n    c[i] = a[i] * scalar;\n}\n";
/**
 * Vector Normalize Kernel
 * C = A / |A|
 */
export declare const vectorNormalizeCL = "\n__kernel void vector_normalize(\n    __global const float* a,\n    __global float* c,\n    const int n,\n    const int vec_size\n) {\n    int i = get_global_id(0);\n    if (i >= n / vec_size) return;\n    \n    int base = i * vec_size;\n    float sum = 0.0f;\n    \n    // Compute magnitude\n    for (int j = 0; j < vec_size; j++) {\n        sum += a[base + j] * a[base + j];\n    }\n    \n    float mag = sqrt(sum);\n    float inv_mag = (mag > 0.0f) ? (1.0f / mag) : 0.0f;\n    \n    // Normalize\n    for (int j = 0; j < vec_size; j++) {\n        c[base + j] = a[base + j] * inv_mag;\n    }\n}\n";
/**
 * Vector Magnitude Kernel
 * |A| = sqrt(A · A)
 */
export declare const vectorMagnitudeCL = "\n__kernel void vector_magnitude(\n    __global const float* a,\n    __global float* mags,\n    const int n,\n    const int vec_size\n) {\n    int i = get_global_id(0);\n    if (i >= n / vec_size) return;\n    \n    int base = i * vec_size;\n    float sum = 0.0f;\n    \n    for (int j = 0; j < vec_size; j++) {\n        sum += a[base + j] * a[base + j];\n    }\n    \n    mags[i] = sqrt(sum);\n}\n";
/**
 * Matrix-Vector Multiplication Kernel
 * y = A * x (where A is M×N, x is N×1, y is M×1)
 */
export declare const matrixVectorMulCL = "\n__kernel void matrix_vector_mul(\n    __global const float* matrix,\n    __global const float* vector,\n    __global float* result,\n    const int rows,\n    const int cols\n) {\n    int row = get_global_id(0);\n    if (row >= rows) return;\n    \n    float sum = 0.0f;\n    \n    for (int col = 0; col < cols; col++) {\n        sum += matrix[row * cols + col] * vector[col];\n    }\n    \n    result[row] = sum;\n}\n";
/**
 * Matrix-Matrix Multiplication Kernel (Naive)
 * C = A × B
 */
export declare const matrixMulNaiveCL = "\n__kernel void matrix_mul_naive(\n    __global const float* A,\n    __global const float* B,\n    __global float* C,\n    const int rowsA,\n    const int colsA,\n    const int colsB\n) {\n    int row = get_global_id(1);\n    int col = get_global_id(0);\n    \n    if (row >= rowsA || col >= colsB) return;\n    \n    float sum = 0.0f;\n    \n    for (int k = 0; k < colsA; k++) {\n        sum += A[row * colsA + k] * B[k * colsB + col];\n    }\n    \n    C[row * colsB + col] = sum;\n}\n";
/**
 * Matrix-Matrix Multiplication Kernel (Tiled/Optimized)
 * Uses shared local memory for better performance
 * C = A × B
 */
export declare const matrixMulTiledCL = "\n__kernel void matrix_mul_tiled(\n    __global const float* A,\n    __global const float* B,\n    __global float* C,\n    const int rowsA,\n    const int colsA,\n    const int colsB\n) {\n    // Tile size (must match work group size)\n    const int TILE_SIZE = 16;\n    \n    __local float tileA[TILE_SIZE][TILE_SIZE];\n    __local float tileB[TILE_SIZE][TILE_SIZE];\n    \n    int row = get_global_id(1);\n    int col = get_global_id(0);\n    int localRow = get_local_id(1);\n    int localCol = get_local_id(0);\n    \n    float sum = 0.0f;\n    \n    // Loop over tiles\n    for (int t = 0; t < (colsA + TILE_SIZE - 1) / TILE_SIZE; t++) {\n        // Load tile A\n        if (row < rowsA && (t * TILE_SIZE + localCol) < colsA) {\n            tileA[localRow][localCol] = A[row * colsA + t * TILE_SIZE + localCol];\n        } else {\n            tileA[localRow][localCol] = 0.0f;\n        }\n        \n        // Load tile B\n        if ((t * TILE_SIZE + localRow) < colsA && col < colsB) {\n            tileB[localRow][localCol] = B[(t * TILE_SIZE + localRow) * colsB + col];\n        } else {\n            tileB[localRow][localCol] = 0.0f;\n        }\n        \n        // Synchronize\n        barrier(CLK_LOCAL_MEM_FENCE);\n        \n        // Multiply tiles\n        for (int k = 0; k < TILE_SIZE; k++) {\n            sum += tileA[localRow][k] * tileB[k][localCol];\n        }\n        \n        // Synchronize\n        barrier(CLK_LOCAL_MEM_FENCE);\n    }\n    \n    // Store result\n    if (row < rowsA && col < colsB) {\n        C[row * colsB + col] = sum;\n    }\n}\n";
/**
 * Matrix Transpose Kernel
 * B = A^T
 */
export declare const matrixTransposeCL = "\n__kernel void matrix_transpose(\n    __global const float* A,\n    __global float* B,\n    const int rows,\n    const int cols\n) {\n    int row = get_global_id(1);\n    int col = get_global_id(0);\n    \n    if (row >= rows || col >= cols) return;\n    \n    B[col * rows + row] = A[row * cols + col];\n}\n";
/**
 * Matrix Addition Kernel
 * C = A + B
 */
export declare const matrixAddCL = "\n__kernel void matrix_add(\n    __global const float* A,\n    __global const float* B,\n    __global float* C,\n    const int rows,\n    const int cols\n) {\n    int row = get_global_id(1);\n    int col = get_global_id(0);\n    \n    if (row >= rows || col >= cols) return;\n    \n    C[row * cols + col] = A[row * cols + col] + B[row * cols + col];\n}\n";
/**
 * Matrix Subtraction Kernel
 * C = A - B
 */
export declare const matrixSubCL = "\n__kernel void matrix_sub(\n    __global const float* A,\n    __global const float* B,\n    __global float* C,\n    const int rows,\n    const int cols\n) {\n    int row = get_global_id(1);\n    int col = get_global_id(0);\n    \n    if (row >= rows || col >= cols) return;\n    \n    C[row * cols + col] = A[row * cols + col] - B[row * cols + col];\n}\n";
/**
 * Matrix Scale Kernel
 * B = A * scalar
 */
export declare const matrixScaleCL = "\n__kernel void matrix_scale(\n    __global const float* A,\n    __global float* B,\n    const float scalar,\n    const int rows,\n    const int cols\n) {\n    int row = get_global_id(1);\n    int col = get_global_id(0);\n    \n    if (row >= rows || col >= cols) return;\n    \n    B[row * cols + col] = A[row * cols + col] * scalar;\n}\n";
/**
 * LU Decomposition Kernel (Partial)
 * For solving linear systems
 */
export declare const luDecompositionCL = "\n__kernel void lu_decompose(\n    __global float* matrix,\n    __global int* pivot,\n    const int n\n) {\n    int row = get_global_id(0);\n    if (row >= n) return;\n    \n    // Initialize pivot\n    pivot[row] = row;\n    \n    // Find pivot for this column\n    float max_val = fabs(matrix[row * n + row]);\n    int max_row = row;\n    \n    for (int i = row + 1; i < n; i++) {\n        float val = fabs(matrix[i * n + row]);\n        if (val > max_val) {\n            max_val = val;\n            max_row = i;\n        }\n    }\n    \n    // Swap rows if needed\n    if (max_row != row) {\n        pivot[row] = max_row;\n        for (int j = 0; j < n; j++) {\n            float temp = matrix[row * n + j];\n            matrix[row * n + j] = matrix[max_row * n + j];\n            matrix[max_row * n + j] = temp;\n        }\n    }\n    \n    // Eliminate column\n    if (matrix[row * n + row] != 0.0f) {\n        for (int i = row + 1; i < n; i++) {\n            float factor = matrix[i * n + row] / matrix[row * n + row];\n            matrix[i * n + row] = factor;\n            \n            for (int j = row + 1; j < n; j++) {\n                matrix[i * n + j] -= factor * matrix[row * n + j];\n            }\n        }\n    }\n}\n";
/**
 * Gaussian Elimination Kernel
 * For solving Ax = b
 */
export declare const gaussianEliminationCL = "\n__kernel void gaussian_elimination(\n    __global float* A,\n    __global float* b,\n    __global float* x,\n    const int n\n) {\n    int row = get_global_id(0);\n    if (row >= n) return;\n    \n    // Forward elimination\n    for (int k = 0; k < n; k++) {\n        if (row > k) {\n            float factor = A[row * n + k] / A[k * n + k];\n            for (int j = k; j < n; j++) {\n                A[row * n + j] -= factor * A[k * n + j];\n            }\n            b[row] -= factor * b[k];\n        }\n    }\n}\n";
/**
 * Back Substitution Kernel
 * Solve upper triangular system
 */
export declare const backSubstitutionCL = "\n__kernel void back_substitution(\n    __global const float* U,\n    __global const float* y,\n    __global float* x,\n    const int n\n) {\n    int row = get_global_id(0);\n    if (row >= n) return;\n    \n    float sum = 0.0f;\n    \n    for (int j = row + 1; j < n; j++) {\n        sum += U[row * n + j] * x[j];\n    }\n    \n    x[row] = (y[row] - sum) / U[row * n + row];\n}\n";
/**
 * Eigenvalue Power Iteration Kernel
 * Find dominant eigenvalue/eigenvector
 */
export declare const eigenvaluePowerIterationCL = "\n__kernel void power_iteration(\n    __global const float* matrix,\n    __global float* vector,\n    __global float* new_vector,\n    __global float* eigenvalue,\n    const int n\n) {\n    int row = get_global_id(0);\n    if (row >= n) return;\n    \n    // Matrix-vector multiply\n    float sum = 0.0f;\n    for (int col = 0; col < n; col++) {\n        sum += matrix[row * n + col] * vector[col];\n    }\n    new_vector[row] = sum;\n}\n";
/**
 * SVD (Singular Value Decomposition) - One Step
 * Simplified for GPU
 */
export declare const svdStepCL = "\n__kernel void svd_step(\n    __global float* matrix,\n    __global float* U,\n    __global float* S,\n    __global float* V,\n    const int rows,\n    const int cols,\n    const float tolerance\n) {\n    int row = get_global_id(0);\n    int col = get_global_id(1);\n    \n    if (row >= rows || col >= cols) return;\n    \n    // Simplified SVD step (Jacobi rotation)\n    // Full SVD would require multiple iterations\n    \n    float val = matrix[row * cols + col];\n    float sigma = fabs(val);\n    \n    if (sigma > tolerance) {\n        // Update singular value\n        S[min(row, col)] += val;\n    }\n}\n";
/**
 * Convolution Kernel (1D)
 * For signal processing
 */
export declare const convolution1DCL = "\n__kernel void convolution_1d(\n    __global const float* signal,\n    __global const float* kernel,\n    __global float* output,\n    const int signal_len,\n    const int kernel_len\n) {\n    int i = get_global_id(0);\n    if (i >= signal_len) return;\n    \n    float sum = 0.0f;\n    int half_kernel = kernel_len / 2;\n    \n    for (int j = 0; j < kernel_len; j++) {\n        int idx = i - half_kernel + j;\n        if (idx >= 0 && idx < signal_len) {\n            sum += signal[idx] * kernel[j];\n        }\n    }\n    \n    output[i] = sum;\n}\n";
/**
 * Convolution Kernel (2D)
 * For image processing
 */
export declare const convolution2DCL = "\n__kernel void convolution_2d(\n    __global const float* image,\n    __global const float* kernel,\n    __global float* output,\n    const int width,\n    const int height,\n    const int kernel_size\n) {\n    int x = get_global_id(0);\n    int y = get_global_id(1);\n    \n    if (x >= width || y >= height) return;\n    \n    float sum = 0.0f;\n    int half_kernel = kernel_size / 2;\n    \n    for (int ky = -half_kernel; ky <= half_kernel; ky++) {\n        for (int kx = -half_kernel; kx <= half_kernel; kx++) {\n            int img_x = x + kx;\n            int img_y = y + ky;\n            \n            if (img_x >= 0 && img_x < width && img_y >= 0 && img_y < height) {\n                int kernel_idx = (ky + half_kernel) * kernel_size + (kx + half_kernel);\n                sum += image[img_y * width + img_x] * kernel[kernel_idx];\n            }\n        }\n    }\n    \n    output[y * width + x] = sum;\n}\n";
export declare class OpenCLVectorLane extends OpenCLLane {
    private vectorKernels;
    constructor(config?: Partial<OpenCLComputeConfig>);
    /**
     * Initialize vector/linear algebra kernels
     */
    private initializeVectorKernels;
    /**
     * Execute vector addition
     */
    vectorAdd(a: Float32Array, b: Float32Array): Promise<Float32Array>;
    /**
     * Execute vector dot product
     */
    vectorDot(a: Float32Array, b: Float32Array): Promise<number>;
    /**
     * Execute vector cross product (3D)
     */
    vectorCross(a: [number, number, number], b: [number, number, number]): Promise<[number, number, number]>;
    /**
     * Execute matrix-vector multiplication
     */
    matrixVectorMul(matrix: Float32Array, vector: Float32Array, rows: number, cols: number): Promise<Float32Array>;
    /**
     * Execute matrix multiplication (tiled)
     */
    matrixMulTiled(A: Float32Array, B: Float32Array, rowsA: number, colsA: number, colsB: number): Promise<Float32Array>;
    /**
     * Execute LU decomposition
     */
    luDecompose(matrix: Float32Array, n: number): Promise<{
        L: Float32Array;
        U: Float32Array;
        pivot: Int32Array;
    }>;
    /**
     * Solve linear system Ax = b using LU decomposition
     */
    solveLinearSystem(A: Float32Array, b: Float32Array, n: number): Promise<Float32Array>;
    /**
     * Execute 2D convolution
     */
    convolution2D(image: Float32Array, kernel: Float32Array, width: number, height: number, kernelSize: number): Promise<Float32Array>;
    /**
     * Get all available vector kernels
     */
    getAvailableKernels(): string[];
}
/**
 * Example: Using OpenCL Vector Lane for physics simulation
 */
export declare function examplePhysicsWithVectorShaders(): Promise<void>;
