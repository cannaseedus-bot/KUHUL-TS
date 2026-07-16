/**
 * OpenCL Compute Lane - Cross-Platform GPU Compute
 *
 * Uses OpenCL for GPU acceleration on AMD/Intel/NVIDIA
 * Falls back to CPU if no GPU available
 */
export interface OpenCLComputeConfig {
    platform?: string;
    device?: string;
    useGPU: boolean;
    maxWorkGroupSize: number;
}
interface CLBuffer {
    size: number;
    data: any;
}
export declare class OpenCLLane {
    private config;
    private context;
    private kernels;
    private buffers;
    private initialized;
    constructor(config?: Partial<OpenCLComputeConfig>);
    /**
     * Initialize OpenCL context
     */
    initialize(): Promise<boolean>;
    /**
     * Detect OpenCL platforms
     */
    private detectPlatforms;
    /**
     * Detect devices on platform
     */
    private detectDevices;
    /**
     * Create OpenCL kernels
     */
    private createKernels;
    /**
     * Execute N-body physics simulation
     */
    simulatePhysics(bodies: Array<{
        position: [number, number, number];
        velocity: [number, number, number];
        mass: number;
    }>, timestep: number, gravity: number): Promise<Array<{
        position: [number, number, number];
        velocity: [number, number, number];
    }>>;
    /**
     * Execute matrix multiplication
     */
    matmul(matrixA: Float32Array, matrixB: Float32Array, rowsA: number, colsA: number, colsB: number): Promise<Float32Array>;
    /**
     * Execute vector addition
     */
    vectorAdd(a: Float32Array, b: Float32Array): Promise<Float32Array>;
    /**
     * Create buffer on device
     */
    createBuffer(size: number, data?: any): Promise<CLBuffer>;
    /**
     * Check if OpenCL is available
     */
    isAvailable(): boolean;
    /**
     * Get OpenCL stats
     */
    getStats(): {
        available: boolean;
        platform?: undefined;
        device?: undefined;
        deviceType?: undefined;
        memory?: undefined;
        maxWorkGroupSize?: undefined;
        kernels?: undefined;
        buffers?: undefined;
    } | {
        available: boolean;
        platform: string;
        device: string;
        deviceType: "gpu" | "cpu";
        memory: number;
        maxWorkGroupSize: number;
        kernels: number;
        buffers: number;
    };
    /**
     * Shutdown OpenCL
     */
    shutdown(): void;
}
export declare const nbodyKernelCL = "\n__kernel void nbody_simulate(\n    __global float4* positions,\n    __global float4* velocities,\n    __global float* masses,\n    __global float4* outPositions,\n    __global float4* outVelocities,\n    const int bodyCount,\n    const float timestep,\n    const float gravity\n) {\n    int i = get_global_id(0);\n    if (i >= bodyCount) return;\n    \n    float4 pos = positions[i];\n    float4 vel = velocities[i];\n    float mass = masses[i];\n    \n    float3 accel = (float3)(0.0f, 0.0f, 0.0f);\n    \n    // N-body gravity\n    for (int j = 0; j < bodyCount; j++) {\n        if (i == j) continue;\n        \n        float3 diff = positions[j].xyz - pos.xyz;\n        float distSq = dot(diff, diff) + 0.0001f;\n        float dist = sqrt(distSq);\n        \n        float forceMag = gravity * masses[j] / (distSq * dist);\n        accel += diff * forceMag;\n    }\n    \n    // Integrate\n    vel.xyz += accel * timestep;\n    pos.xyz += vel.xyz * timestep;\n    \n    outPositions[i] = pos;\n    outVelocities[i] = vel;\n}\n";
export declare const matmulKernelCL = "\n__kernel void matrix_multiply(\n    __global const float* matrixA,\n    __global const float* matrixB,\n    __global float* matrixC,\n    const int rowsA,\n    const int colsA,\n    const int colsB\n) {\n    int row = get_global_id(1);\n    int col = get_global_id(0);\n    \n    if (row >= rowsA || col >= colsB) return;\n    \n    float sum = 0.0f;\n    \n    for (int k = 0; k < colsA; k++) {\n        sum += matrixA[row * colsA + k] * matrixB[k * colsB + col];\n    }\n    \n    matrixC[row * colsB + col] = sum;\n}\n";
export declare const vectorAddKernelCL = "\n__kernel void vector_add(\n    __global const float* a,\n    __global const float* b,\n    __global float* c,\n    const int n\n) {\n    int i = get_global_id(0);\n    if (i >= n) return;\n    \n    c[i] = a[i] + b[i];\n}\n";
export {};
