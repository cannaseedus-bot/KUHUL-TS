/**
 * WebGL2 Compute Lane - Transform Feedback & Compute via Frag Shaders
 *
 * Uses WebGL2 transform feedback for GPU compute operations
 * More widely supported than WebGPU
 */
export interface WebGL2ComputeConfig {
    canvas?: HTMLCanvasElement;
    preferHighPerformance?: boolean;
}
export declare class WebGL2Lane {
    private config;
    private gl;
    private programs;
    private buffers;
    private vaos;
    constructor(config?: WebGL2ComputeConfig);
    /**
     * Initialize WebGL2 context
     */
    initialize(): Promise<boolean>;
    /**
     * Create compute shader programs
     */
    private createPrograms;
    /**
     * Create WebGL program with transform feedback
     */
    private createProgram;
    /**
     * Compile shader
     */
    private compileShader;
    /**
     * Execute physics simulation via transform feedback
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
     * Create texture from float array
     */
    private createTexture;
    /**
     * Check if WebGL2 is available
     */
    isAvailable(): boolean;
    /**
     * Get WebGL2 stats
     */
    getStats(): {
        available: boolean;
        renderer?: undefined;
        maxTextureSize?: undefined;
        maxVertexAttribs?: undefined;
        programs?: undefined;
    } | {
        available: boolean;
        renderer: any;
        maxTextureSize: any;
        maxVertexAttribs: any;
        programs: number;
    };
}
