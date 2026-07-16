/**
 * WebGPU Compute Lanes - WGSL Shaders for Tensor & Physics
 *
 * Actual GPU compute shaders for high-performance operations
 */
export interface WebGPUComputeConfig {
    device: GPUDevice;
    queue: GPUQueue;
}
export declare class TensorLane {
    private device;
    private queue;
    private pipeline;
    private bindGroupLayout;
    constructor(config: WebGPUComputeConfig);
    /**
     * Initialize matrix multiplication pipeline
     */
    initialize(): Promise<void>;
    /**
     * Execute matrix multiplication on GPU
     */
    matmul(matrixA: Float32Array, matrixB: Float32Array, rowsA: number, colsA: number, colsB: number): Promise<Float32Array>;
}
export declare class PhysicsLane {
    private device;
    private queue;
    private pipeline;
    constructor(config: WebGPUComputeConfig);
    /**
     * Initialize N-body physics pipeline
     */
    initialize(): Promise<void>;
    /**
     * Execute one physics step
     */
    simulate(bodies: Array<{
        position: [number, number, number];
        velocity: [number, number, number];
        mass: number;
    }>, timestep: number, gravity: number): Promise<Array<{
        position: [number, number, number];
        velocity: [number, number, number];
    }>>;
}
export declare class GeometryLane {
    private device;
    private queue;
    private transformPipeline;
    constructor(config: WebGPUComputeConfig);
    /**
     * Initialize mesh transform pipeline
     */
    initialize(): Promise<void>;
    /**
     * Transform mesh vertices
     */
    transformVertices(vertices: Array<{
        x: number;
        y: number;
        z: number;
    }>, transform: {
        scale: number;
        rotation: number;
        translation: [number, number, number];
    }): Promise<Array<{
        x: number;
        y: number;
        z: number;
    }>>;
}
