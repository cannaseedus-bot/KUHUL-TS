/**
 * Direct3D 11.1 Compute Lane - Windows Native GPU Compute
 *
 * Uses D3D11 Compute Shaders for high-performance GPU compute
 * Native Windows implementation
 */
export interface D3D11ComputeConfig {
    useWARP: boolean;
    debug: boolean;
    maxFeatureLevel: number;
}
interface D3D11Buffer {
    size: number;
    usage: string;
    data: any;
}
export declare class D3D11Lane {
    private config;
    private device;
    private context;
    private shaders;
    private buffers;
    private initialized;
    constructor(config?: Partial<D3D11ComputeConfig>);
    /**
     * Initialize D3D11 device and context
     */
    initialize(): Promise<boolean>;
    /**
     * Create D3D11 device
     */
    private createDevice;
    /**
     * Detect GPU name
     */
    private detectGPU;
    /**
     * Create compute shaders
     */
    private createComputeShaders;
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
    /**
     * Create structured buffer
     */
    createStructuredBuffer<T>(data: T[], elementSize: number): Promise<D3D11Buffer>;
    /**
     * Create constant buffer
     */
    createConstantBuffer<T>(data: T): Promise<D3D11Buffer>;
    /**
     * Check if D3D11 is available
     */
    isAvailable(): boolean;
    /**
     * Get D3D11 stats
     */
    getStats(): {
        available: boolean;
        device?: undefined;
        featureLevel?: undefined;
        driverType?: undefined;
        shaders?: undefined;
        buffers?: undefined;
    } | {
        available: boolean;
        device: string;
        featureLevel: number;
        driverType: "hardware" | "software" | "reference";
        shaders: number;
        buffers: number;
    };
    /**
     * Shutdown D3D11
     */
    shutdown(): void;
}
export declare const nbodyComputeShaderHLSL = "\n// N-Body Physics Compute Shader (HLSL)\n// D3D11 Feature Level 11.0+\n\nRWStructuredBuffer<float3> positions : register(u0);\nRWStructuredBuffer<float3> velocities : register(u1);\nStructuredBuffer<float> masses : register(u2);\n\ncbuffer Constants : register(b0) {\n    int bodyCount;\n    float timestep;\n    float gravity;\n    float softening;\n};\n\n[numthreads(8, 8, 1)]\nvoid NBodySimulate(uint3 dispatchThreadID : SV_DispatchThreadID) {\n    uint i = dispatchThreadID.x;\n    if (i >= bodyCount) return;\n    \n    float3 pos = positions[i];\n    float3 vel = velocities[i];\n    float mass = masses[i];\n    \n    float3 accel = float3(0.0f, 0.0f, 0.0f);\n    \n    // N-body gravity\n    [loop]\n    for (uint j = 0; j < bodyCount; j++) {\n        if (i == j) continue;\n        \n        float3 diff = positions[j] - pos;\n        float distSq = dot(diff, diff) + softening * softening;\n        float dist = sqrt(distSq);\n        \n        float forceMag = gravity * masses[j] / (distSq * dist);\n        accel += diff * forceMag;\n    }\n    \n    // Integrate (Velocity Verlet)\n    vel += accel * timestep;\n    pos += vel * timestep;\n    \n    positions[i] = pos;\n    velocities[i] = vel;\n}\n";
export declare const matmulComputeShaderHLSL = "\n// Matrix Multiplication Compute Shader (HLSL)\n// D3D11 Feature Level 11.0+\n\nRWStructuredBuffer<float> matrixA : register(u0);\nRWStructuredBuffer<float> matrixB : register(u1);\nRWStructuredBuffer<float> matrixC : register(u2);\n\ncbuffer Dimensions : register(b0) {\n    int rowsA;\n    int colsA;\n    int colsB;\n};\n\ngroupshared float tileA[8][8];\ngroupshared float tileB[8][8];\n\n[numthreads(8, 8, 1)]\nvoid MatrixMultiply(uint3 dispatchThreadID : SV_DispatchThreadID, uint3 groupThreadID : SV_GroupThreadID, uint3 groupID : SV_GroupID) {\n    uint row = groupID.y * 8 + groupThreadID.y;\n    uint col = groupID.x * 8 + groupThreadID.x;\n    \n    float sum = 0.0f;\n    \n    [loop]\n    for (uint t = 0; t < colsA; t += 8) {\n        // Load tiles\n        if (row < rowsA && t + groupThreadID.x < colsA) {\n            tileA[groupThreadID.y][groupThreadID.x] = matrixA[row * colsA + t + groupThreadID.x];\n        } else {\n            tileA[groupThreadID.y][groupThreadID.x] = 0.0f;\n        }\n        \n        if (t + groupThreadID.y < colsA && col < colsB) {\n            tileB[groupThreadID.y][groupThreadID.x] = matrixB[(t + groupThreadID.y) * colsB + col];\n        } else {\n            tileB[groupThreadID.y][groupThreadID.x] = 0.0f;\n        }\n        \n        GroupMemoryBarrierWithGroupSync();\n        \n        // Multiply tiles\n        [unroll]\n        for (uint k = 0; k < 8; k++) {\n            sum += tileA[groupThreadID.y][k] * tileB[k][groupThreadID.x];\n        }\n        \n        GroupMemoryBarrierWithGroupSync();\n    }\n    \n    if (row < rowsA && col < colsB) {\n        matrixC[row * colsB + col] = sum;\n    }\n}\n";
export declare const vectorAddComputeShaderHLSL = "\n// Vector Add Compute Shader (HLSL)\n// D3D11 Feature Level 11.0+\n\nRWStructuredBuffer<float> vectorA : register(u0);\nRWStructuredBuffer<float> vectorB : register(u1);\nRWStructuredBuffer<float> vectorC : register(u2);\n\ncbuffer Size : register(b0) {\n    int n;\n};\n\n[numthreads(64, 1, 1)]\nvoid VectorAdd(uint3 dispatchThreadID : SV_DispatchThreadID) {\n    uint i = dispatchThreadID.x;\n    if (i >= n) return;\n    \n    vectorC[i] = vectorA[i] + vectorB[i];\n}\n";
export declare const geometryComputeShaderHLSL = "\n// Geometry Transform Compute Shader (HLSL)\n// D3D11 Feature Level 11.0+\n\nRWStructuredBuffer<float3> vertices : register(u0);\n\ncbuffer Transform : register(b0) {\n    float scale;\n    float rotation;\n    float3 translation;\n};\n\n[numthreads(64, 1, 1)]\nvoid GeometryTransform(uint3 dispatchThreadID : SV_DispatchThreadID) {\n    uint i = dispatchThreadID.x;\n    \n    float3 vertex = vertices[i];\n    \n    // Scale\n    vertex *= scale;\n    \n    // Rotation around Z-axis\n    float cosRot = cos(rotation);\n    float sinRot = sin(rotation);\n    float x = vertex.x;\n    float y = vertex.y;\n    vertex.x = x * cosRot - y * sinRot;\n    vertex.y = x * sinRot + y * cosRot;\n    \n    // Translation\n    vertex += translation;\n    \n    vertices[i] = vertex;\n}\n";
export {};
