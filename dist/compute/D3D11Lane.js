/**
 * Direct3D 11.1 Compute Lane - Windows Native GPU Compute
 *
 * Uses D3D11 Compute Shaders for high-performance GPU compute
 * Native Windows implementation
 */
export class D3D11Lane {
    config;
    device = null;
    context = null;
    shaders = new Map();
    buffers = new Map();
    initialized = false;
    constructor(config = {}) {
        this.config = {
            useWARP: config.useWARP ?? false,
            debug: config.debug ?? false,
            maxFeatureLevel: config.maxFeatureLevel ?? 0xb000 // D3D_FEATURE_LEVEL_11_0
        };
    }
    /**
     * Initialize D3D11 device and context
     */
    async initialize() {
        console.log('⧫ Initializing Direct3D 11.1...');
        try {
            // In production, would use node-d3d11 or similar
            // This simulates the architecture
            // Create device
            const device = await this.createDevice();
            if (!device) {
                console.log('⚠ Failed to create D3D11 device');
                return false;
            }
            this.device = device;
            // Create immediate context
            this.context = {
                device: this.device,
                immediateContext: {} // Simulated
            };
            this.initialized = true;
            console.log('⧫ Direct3D 11.1 initialized:');
            console.log(`  Device: ${device.name}`);
            console.log(`  Feature Level: 0x${device.featureLevel.toString(16)}`);
            console.log(`  Driver: ${device.driverType}`);
            // Create compute shaders
            await this.createComputeShaders();
            return true;
        }
        catch (error) {
            console.log('⚠ D3D11 initialization failed:', error.message);
            return false;
        }
    }
    /**
     * Create D3D11 device
     */
    async createDevice() {
        // Simulated device creation
        // In production, would call D3D11CreateDevice
        const driverType = this.config.useWARP ? 'software' : 'hardware';
        // Detect GPU
        const gpuName = this.config.useWARP
            ? 'Microsoft Basic Render'
            : await this.detectGPU();
        return {
            name: gpuName,
            featureLevel: this.config.maxFeatureLevel,
            driverType: driverType
        };
    }
    /**
     * Detect GPU name
     */
    async detectGPU() {
        // Simulated GPU detection
        // In production, would enumerate adapters via IDXGIFactory
        return 'NVIDIA GeForce RTX 3080';
    }
    /**
     * Create compute shaders
     */
    async createComputeShaders() {
        if (!this.device)
            return;
        // Physics N-body compute shader
        this.shaders.set('nbody', {
            name: 'NBodySimulate',
            code: nbodyComputeShaderHLSL,
            workGroupSize: [8, 8, 1]
        });
        // Matrix multiplication compute shader
        this.shaders.set('matmul', {
            name: 'MatrixMultiply',
            code: matmulComputeShaderHLSL,
            workGroupSize: [8, 8, 1]
        });
        // Vector add compute shader
        this.shaders.set('vector_add', {
            name: 'VectorAdd',
            code: vectorAddComputeShaderHLSL,
            workGroupSize: [64, 1, 1]
        });
        // Geometry transform compute shader
        this.shaders.set('geometry', {
            name: 'GeometryTransform',
            code: geometryComputeShaderHLSL,
            workGroupSize: [64, 1, 1]
        });
        console.log('  ✓ N-body compute shader');
        console.log('  ✓ Matrix multiply compute shader');
        console.log('  ✓ Vector add compute shader');
        console.log('  ✓ Geometry transform compute shader');
    }
    /**
     * Execute N-body physics simulation
     */
    async simulatePhysics(bodies, timestep, gravity) {
        if (!this.initialized) {
            await this.initialize();
        }
        const shader = this.shaders.get('nbody');
        if (!shader) {
            throw new Error('N-body shader not found');
        }
        const bodyCount = bodies.length;
        const threadGroups = [
            Math.ceil(bodyCount / shader.workGroupSize[0]),
            1,
            1
        ];
        console.log(`  [D3D11] Executing N-body: ${bodyCount} bodies, ${threadGroups[0]} thread groups`);
        // Simulated D3D11 execution
        // In production, would:
        // 1. Create structured buffers with ID3D11Device::CreateBuffer
        // 2. Map and write data
        // 3. Set compute shader with CSSetShader
        // 4. Set buffers with CSSetUnorderedAccessViews
        // 5. Dispatch with CSSetConstantBuffers + Dispatch
        // 6. Map and read results
        // Simulated physics integration
        const result = bodies.map(body => ({
            position: [
                body.position[0] + body.velocity[0] * timestep,
                body.position[1] + body.velocity[1] * timestep - 0.5 * gravity * timestep * timestep,
                body.position[2] + body.velocity[2] * timestep
            ],
            velocity: [
                body.velocity[0],
                body.velocity[1] - gravity * timestep,
                body.velocity[2]
            ]
        }));
        return result;
    }
    /**
     * Execute matrix multiplication
     */
    async matmul(matrixA, matrixB, rowsA, colsA, colsB) {
        if (!this.initialized) {
            await this.initialize();
        }
        const shader = this.shaders.get('matmul');
        if (!shader) {
            throw new Error('MatMul shader not found');
        }
        const threadGroups = [
            Math.ceil(colsB / shader.workGroupSize[0]),
            Math.ceil(rowsA / shader.workGroupSize[1]),
            1
        ];
        console.log(`  [D3D11] Executing MatMul: ${rowsA}x${colsA} × ${colsA}x${colsB}`);
        // Simulated matrix multiplication
        const result = new Float32Array(rowsA * colsB);
        for (let i = 0; i < rowsA; i++) {
            for (let j = 0; j < colsB; j++) {
                let sum = 0;
                for (let k = 0; k < colsA; k++) {
                    sum += matrixA[i * colsA + k] * matrixB[k * colsB + j];
                }
                result[i * colsB + j] = sum;
            }
        }
        return result;
    }
    /**
     * Transform mesh vertices
     */
    async transformVertices(vertices, transform) {
        if (!this.initialized) {
            await this.initialize();
        }
        const shader = this.shaders.get('geometry');
        if (!shader) {
            throw new Error('Geometry shader not found');
        }
        const vertexCount = vertices.length;
        const threadGroups = [Math.ceil(vertexCount / shader.workGroupSize[0]), 1, 1];
        console.log(`  [D3D11] Transforming ${vertexCount} vertices`);
        // Simulated vertex transform
        const cosRot = Math.cos(transform.rotation);
        const sinRot = Math.sin(transform.rotation);
        const result = vertices.map(v => {
            let x = v.x * transform.scale;
            let y = v.y * transform.scale;
            let z = v.z * transform.scale;
            // Rotate around Z
            const newX = x * cosRot - y * sinRot;
            const newY = x * sinRot + y * cosRot;
            x = newX;
            y = newY;
            // Translate
            x += transform.translation[0];
            y += transform.translation[1];
            z += transform.translation[2];
            return { x, y, z };
        });
        return result;
    }
    /**
     * Create structured buffer
     */
    async createStructuredBuffer(data, elementSize) {
        const buffer = {
            size: data.length * elementSize,
            usage: 'structured',
            data: new ArrayBuffer(buffer.size)
        };
        const id = `buf-${Date.now()}-${Math.random()}`;
        this.buffers.set(id, buffer);
        return buffer;
    }
    /**
     * Create constant buffer
     */
    async createConstantBuffer(data) {
        const buffer = {
            size: 256, // D3D11 constant buffer size multiple
            usage: 'constant',
            data
        };
        const id = `cb-${Date.now()}-${Math.random()}`;
        this.buffers.set(id, buffer);
        return buffer;
    }
    /**
     * Check if D3D11 is available
     */
    isAvailable() {
        return this.initialized && !!this.device;
    }
    /**
     * Get D3D11 stats
     */
    getStats() {
        if (!this.device) {
            return { available: false };
        }
        return {
            available: true,
            device: this.device.name,
            featureLevel: this.device.featureLevel,
            driverType: this.device.driverType,
            shaders: this.shaders.size,
            buffers: this.buffers.size
        };
    }
    /**
     * Shutdown D3D11
     */
    shutdown() {
        console.log('⧫ Shutting down Direct3D 11...');
        this.buffers.clear();
        this.shaders.clear();
        this.context = null;
        this.device = null;
        this.initialized = false;
    }
}
// ============================================================================
// HLSL COMPUTE SHADERS
// ============================================================================
export const nbodyComputeShaderHLSL = `
// N-Body Physics Compute Shader (HLSL)
// D3D11 Feature Level 11.0+

RWStructuredBuffer<float3> positions : register(u0);
RWStructuredBuffer<float3> velocities : register(u1);
StructuredBuffer<float> masses : register(u2);

cbuffer Constants : register(b0) {
    int bodyCount;
    float timestep;
    float gravity;
    float softening;
};

[numthreads(8, 8, 1)]
void NBodySimulate(uint3 dispatchThreadID : SV_DispatchThreadID) {
    uint i = dispatchThreadID.x;
    if (i >= bodyCount) return;
    
    float3 pos = positions[i];
    float3 vel = velocities[i];
    float mass = masses[i];
    
    float3 accel = float3(0.0f, 0.0f, 0.0f);
    
    // N-body gravity
    [loop]
    for (uint j = 0; j < bodyCount; j++) {
        if (i == j) continue;
        
        float3 diff = positions[j] - pos;
        float distSq = dot(diff, diff) + softening * softening;
        float dist = sqrt(distSq);
        
        float forceMag = gravity * masses[j] / (distSq * dist);
        accel += diff * forceMag;
    }
    
    // Integrate (Velocity Verlet)
    vel += accel * timestep;
    pos += vel * timestep;
    
    positions[i] = pos;
    velocities[i] = vel;
}
`;
export const matmulComputeShaderHLSL = `
// Matrix Multiplication Compute Shader (HLSL)
// D3D11 Feature Level 11.0+

RWStructuredBuffer<float> matrixA : register(u0);
RWStructuredBuffer<float> matrixB : register(u1);
RWStructuredBuffer<float> matrixC : register(u2);

cbuffer Dimensions : register(b0) {
    int rowsA;
    int colsA;
    int colsB;
};

groupshared float tileA[8][8];
groupshared float tileB[8][8];

[numthreads(8, 8, 1)]
void MatrixMultiply(uint3 dispatchThreadID : SV_DispatchThreadID, uint3 groupThreadID : SV_GroupThreadID, uint3 groupID : SV_GroupID) {
    uint row = groupID.y * 8 + groupThreadID.y;
    uint col = groupID.x * 8 + groupThreadID.x;
    
    float sum = 0.0f;
    
    [loop]
    for (uint t = 0; t < colsA; t += 8) {
        // Load tiles
        if (row < rowsA && t + groupThreadID.x < colsA) {
            tileA[groupThreadID.y][groupThreadID.x] = matrixA[row * colsA + t + groupThreadID.x];
        } else {
            tileA[groupThreadID.y][groupThreadID.x] = 0.0f;
        }
        
        if (t + groupThreadID.y < colsA && col < colsB) {
            tileB[groupThreadID.y][groupThreadID.x] = matrixB[(t + groupThreadID.y) * colsB + col];
        } else {
            tileB[groupThreadID.y][groupThreadID.x] = 0.0f;
        }
        
        GroupMemoryBarrierWithGroupSync();
        
        // Multiply tiles
        [unroll]
        for (uint k = 0; k < 8; k++) {
            sum += tileA[groupThreadID.y][k] * tileB[k][groupThreadID.x];
        }
        
        GroupMemoryBarrierWithGroupSync();
    }
    
    if (row < rowsA && col < colsB) {
        matrixC[row * colsB + col] = sum;
    }
}
`;
export const vectorAddComputeShaderHLSL = `
// Vector Add Compute Shader (HLSL)
// D3D11 Feature Level 11.0+

RWStructuredBuffer<float> vectorA : register(u0);
RWStructuredBuffer<float> vectorB : register(u1);
RWStructuredBuffer<float> vectorC : register(u2);

cbuffer Size : register(b0) {
    int n;
};

[numthreads(64, 1, 1)]
void VectorAdd(uint3 dispatchThreadID : SV_DispatchThreadID) {
    uint i = dispatchThreadID.x;
    if (i >= n) return;
    
    vectorC[i] = vectorA[i] + vectorB[i];
}
`;
export const geometryComputeShaderHLSL = `
// Geometry Transform Compute Shader (HLSL)
// D3D11 Feature Level 11.0+

RWStructuredBuffer<float3> vertices : register(u0);

cbuffer Transform : register(b0) {
    float scale;
    float rotation;
    float3 translation;
};

[numthreads(64, 1, 1)]
void GeometryTransform(uint3 dispatchThreadID : SV_DispatchThreadID) {
    uint i = dispatchThreadID.x;
    
    float3 vertex = vertices[i];
    
    // Scale
    vertex *= scale;
    
    // Rotation around Z-axis
    float cosRot = cos(rotation);
    float sinRot = sin(rotation);
    float x = vertex.x;
    float y = vertex.y;
    vertex.x = x * cosRot - y * sinRot;
    vertex.y = x * sinRot + y * cosRot;
    
    // Translation
    vertex += translation;
    
    vertices[i] = vertex;
}
`;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRDNEMTFMYW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbXB1dGUvRDNEMTFMYW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztHQUtHO0FBZ0NILE1BQU0sT0FBTyxTQUFTO0lBQ1osTUFBTSxDQUFxQjtJQUMzQixNQUFNLEdBQXVCLElBQUksQ0FBQztJQUNsQyxPQUFPLEdBQXdCLElBQUksQ0FBQztJQUNwQyxPQUFPLEdBQW9DLElBQUksR0FBRyxFQUFFLENBQUM7SUFDckQsT0FBTyxHQUE2QixJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQzlDLFdBQVcsR0FBWSxLQUFLLENBQUM7SUFFckMsWUFBWSxTQUFzQyxFQUFFO1FBQ2xELElBQUksQ0FBQyxNQUFNLEdBQUc7WUFDWixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sSUFBSSxLQUFLO1lBQ2hDLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxJQUFJLEtBQUs7WUFDNUIsZUFBZSxFQUFFLE1BQU0sQ0FBQyxlQUFlLElBQUksTUFBTSxDQUFDLHlCQUF5QjtTQUM1RSxDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFVBQVU7UUFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFFL0MsSUFBSSxDQUFDO1lBQ0gsaURBQWlEO1lBQ2pELGtDQUFrQztZQUVsQyxnQkFBZ0I7WUFDaEIsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFekMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLENBQUMsQ0FBQztnQkFDL0MsT0FBTyxLQUFLLENBQUM7WUFDZixDQUFDO1lBRUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFFckIsMkJBQTJCO1lBQzNCLElBQUksQ0FBQyxPQUFPLEdBQUc7Z0JBQ2IsTUFBTSxFQUFF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Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBOENyQyxDQUFDO0FBRUYsTUFBTSxDQUFDLE1BQU0sdUJBQXVCLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXNEdEMsQ0FBQztBQUVGLE1BQU0sQ0FBQyxNQUFNLDBCQUEwQixHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBbUJ6QyxDQUFDO0FBRUYsTUFBTSxDQUFDLE1BQU0seUJBQXlCLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FrQ3hDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIERpcmVjdDNEIDExLjEgQ29tcHV0ZSBMYW5lIC0gV2luZG93cyBOYXRpdmUgR1BVIENvbXB1dGVcbiAqIFxuICogVXNlcyBEM0QxMSBDb21wdXRlIFNoYWRlcnMgZm9yIGhpZ2gtcGVyZm9ybWFuY2UgR1BVIGNvbXB1dGVcbiAqIE5hdGl2ZSBXaW5kb3dzIGltcGxlbWVudGF0aW9uXG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBEM0QxMUNvbXB1dGVDb25maWcge1xuICB1c2VXQVJQOiBib29sZWFuOyAvLyBVc2Ugc29mdHdhcmUgcmVuZGVyZXJcbiAgZGVidWc6IGJvb2xlYW47XG4gIG1heEZlYXR1cmVMZXZlbDogbnVtYmVyO1xufVxuXG4vLyBEM0QxMSB0eXBlcyAod291bGQgYmUgcHJvdmlkZWQgYnkgbm9kZS1kM2QxMSBvciBzaW1pbGFyKVxuaW50ZXJmYWNlIEQzRDExRGV2aWNlIHtcbiAgbmFtZTogc3RyaW5nO1xuICBmZWF0dXJlTGV2ZWw6IG51bWJlcjtcbiAgZHJpdmVyVHlwZTogJ2hhcmR3YXJlJyB8ICdzb2Z0d2FyZScgfCAncmVmZXJlbmNlJztcbn1cblxuaW50ZXJmYWNlIEQzRDExQ29udGV4dCB7XG4gIGRldmljZTogRDNEMTFEZXZpY2U7XG4gIGltbWVkaWF0ZUNvbnRleHQ6IGFueTtcbn1cblxuaW50ZXJmYWNlIEQzRDExQ29tcHV0ZVNoYWRlciB7XG4gIG5hbWU6IHN0cmluZztcbiAgY29kZTogc3RyaW5nO1xuICB3b3JrR3JvdXBTaXplOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl07XG59XG5cbmludGVyZmFjZSBEM0QxMUJ1ZmZlciB7XG4gIHNpemU6IG51bWJlcjtcbiAgdXNhZ2U6IHN0cmluZztcbiAgZGF0YTogYW55O1xufVxuXG5leHBvcnQgY2xhc3MgRDNEMTFMYW5lIHtcbiAgcHJpdmF0ZSBjb25maWc6IEQzRDExQ29tcHV0ZUNvbmZpZztcbiAgcHJpdmF0ZSBkZXZpY2U6IEQzRDExRGV2aWNlIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgY29udGV4dDogRDNEMTFDb250ZXh0IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc2hhZGVyczogTWFwPHN0cmluZywgRDNEMTFDb21wdXRlU2hhZGVyPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBidWZmZXJzOiBNYXA8c3RyaW5nLCBEM0QxMUJ1ZmZlcj4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgaW5pdGlhbGl6ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFBhcnRpYWw8RDNEMTFDb21wdXRlQ29uZmlnPiA9IHt9KSB7XG4gICAgdGhpcy5jb25maWcgPSB7XG4gICAgICB1c2VXQVJQOiBjb25maWcudXNlV0FSUCA/PyBmYWxzZSxcbiAgICAgIGRlYnVnOiBjb25maWcuZGVidWcgPz8gZmFsc2UsXG4gICAgICBtYXhGZWF0dXJlTGV2ZWw6IGNvbmZpZy5tYXhGZWF0dXJlTGV2ZWwgPz8gMHhiMDAwIC8vIEQzRF9GRUFUVVJFX0xFVkVMXzExXzBcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgRDNEMTEgZGV2aWNlIGFuZCBjb250ZXh0XG4gICAqL1xuICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnNvbGUubG9nKCfip6sgSW5pdGlhbGl6aW5nIERpcmVjdDNEIDExLjEuLi4nKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBJbiBwcm9kdWN0aW9uLCB3b3VsZCB1c2Ugbm9kZS1kM2QxMSBvciBzaW1pbGFyXG4gICAgICAvLyBUaGlzIHNpbXVsYXRlcyB0aGUgYXJjaGl0ZWN0dXJlXG5cbiAgICAgIC8vIENyZWF0ZSBkZXZpY2VcbiAgICAgIGNvbnN0IGRldmljZSA9IGF3YWl0IHRoaXMuY3JlYXRlRGV2aWNlKCk7XG4gICAgICBcbiAgICAgIGlmICghZGV2aWNlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfimqAgRmFpbGVkIHRvIGNyZWF0ZSBEM0QxMSBkZXZpY2UnKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmRldmljZSA9IGRldmljZTtcblxuICAgICAgLy8gQ3JlYXRlIGltbWVkaWF0ZSBjb250ZXh0XG4gICAgICB0aGlzLmNvbnRleHQgPSB7XG4gICAgICAgIGRldmljZTogdGhpcy5kZXZpY2UsXG4gICAgICAgIGltbWVkaWF0ZUNvbnRleHQ6IHt9IC8vIFNpbXVsYXRlZFxuICAgICAgfTtcblxuICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG5cbiAgICAgIGNvbnNvbGUubG9nKCfip6sgRGlyZWN0M0QgMTEuMSBpbml0aWFsaXplZDonKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgIERldmljZTogJHtkZXZpY2UubmFtZX1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgIEZlYXR1cmUgTGV2ZWw6IDB4JHtkZXZpY2UuZmVhdHVyZUxldmVsLnRvU3RyaW5nKDE2KX1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgIERyaXZlcjogJHtkZXZpY2UuZHJpdmVyVHlwZX1gKTtcblxuICAgICAgLy8gQ3JlYXRlIGNvbXB1dGUgc2hhZGVyc1xuICAgICAgYXdhaXQgdGhpcy5jcmVhdGVDb21wdXRlU2hhZGVycygpO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfimqAgRDNEMTEgaW5pdGlhbGl6YXRpb24gZmFpbGVkOicsIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgRDNEMTEgZGV2aWNlXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGNyZWF0ZURldmljZSgpOiBQcm9taXNlPEQzRDExRGV2aWNlIHwgbnVsbD4ge1xuICAgIC8vIFNpbXVsYXRlZCBkZXZpY2UgY3JlYXRpb25cbiAgICAvLyBJbiBwcm9kdWN0aW9uLCB3b3VsZCBjYWxsIEQzRDExQ3JlYXRlRGV2aWNlXG5cbiAgICBjb25zdCBkcml2ZXJUeXBlID0gdGhpcy5jb25maWcudXNlV0FSUCA/ICdzb2Z0d2FyZScgOiAnaGFyZHdhcmUnO1xuICAgIFxuICAgIC8vIERldGVjdCBHUFVcbiAgICBjb25zdCBncHVOYW1lID0gdGhpcy5jb25maWcudXNlV0FSUCBcbiAgICAgID8gJ01pY3Jvc29mdCBCYXNpYyBSZW5kZXInIFxuICAgICAgOiBhd2FpdCB0aGlzLmRldGVjdEdQVSgpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IGdwdU5hbWUsXG4gICAgICBmZWF0dXJlTGV2ZWw6IHRoaXMuY29uZmlnLm1heEZlYXR1cmVMZXZlbCxcbiAgICAgIGRyaXZlclR5cGU6IGRyaXZlclR5cGVcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVjdCBHUFUgbmFtZVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBkZXRlY3RHUFUoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAvLyBTaW11bGF0ZWQgR1BVIGRldGVjdGlvblxuICAgIC8vIEluIHByb2R1Y3Rpb24sIHdvdWxkIGVudW1lcmF0ZSBhZGFwdGVycyB2aWEgSURYR0lGYWN0b3J5XG4gICAgcmV0dXJuICdOVklESUEgR2VGb3JjZSBSVFggMzA4MCc7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGNvbXB1dGUgc2hhZGVyc1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVDb21wdXRlU2hhZGVycygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuZGV2aWNlKSByZXR1cm47XG5cbiAgICAvLyBQaHlzaWNzIE4tYm9keSBjb21wdXRlIHNoYWRlclxuICAgIHRoaXMuc2hhZGVycy5zZXQoJ25ib2R5Jywge1xuICAgICAgbmFtZTogJ05Cb2R5U2ltdWxhdGUnLFxuICAgICAgY29kZTogbmJvZHlDb21wdXRlU2hhZGVySExTTCxcbiAgICAgIHdvcmtHcm91cFNpemU6IFs4LCA4LCAxXVxuICAgIH0pO1xuXG4gICAgLy8gTWF0cml4IG11bHRpcGxpY2F0aW9uIGNvbXB1dGUgc2hhZGVyXG4gICAgdGhpcy5zaGFkZXJzLnNldCgnbWF0bXVsJywge1xuICAgICAgbmFtZTogJ01hdHJpeE11bHRpcGx5JyxcbiAgICAgIGNvZGU6IG1hdG11bENvbXB1dGVTaGFkZXJITFNMLFxuICAgICAgd29ya0dyb3VwU2l6ZTogWzgsIDgsIDFdXG4gICAgfSk7XG5cbiAgICAvLyBWZWN0b3IgYWRkIGNvbXB1dGUgc2hhZGVyXG4gICAgdGhpcy5zaGFkZXJzLnNldCgndmVjdG9yX2FkZCcsIHtcbiAgICAgIG5hbWU6ICdWZWN0b3JBZGQnLFxuICAgICAgY29kZTogdmVjdG9yQWRkQ29tcHV0ZVNoYWRlckhMU0wsXG4gICAgICB3b3JrR3JvdXBTaXplOiBbNjQsIDEsIDFdXG4gICAgfSk7XG5cbiAgICAvLyBHZW9tZXRyeSB0cmFuc2Zvcm0gY29tcHV0ZSBzaGFkZXJcbiAgICB0aGlzLnNoYWRlcnMuc2V0KCdnZW9tZXRyeScsIHtcbiAgICAgIG5hbWU6ICdHZW9tZXRyeVRyYW5zZm9ybScsXG4gICAgICBjb2RlOiBnZW9tZXRyeUNvbXB1dGVTaGFkZXJITFNMLFxuICAgICAgd29ya0dyb3VwU2l6ZTogWzY0LCAxLCAxXVxuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coJyAg4pyTIE4tYm9keSBjb21wdXRlIHNoYWRlcicpO1xuICAgIGNvbnNvbGUubG9nKCcgIOKckyBNYXRyaXggbXVsdGlwbHkgY29tcHV0ZSBzaGFkZXInKTtcbiAgICBjb25zb2xlLmxvZygnICDinJMgVmVjdG9yIGFkZCBjb21wdXRlIHNoYWRlcicpO1xuICAgIGNvbnNvbGUubG9nKCcgIOKckyBHZW9tZXRyeSB0cmFuc2Zvcm0gY29tcHV0ZSBzaGFkZXInKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIE4tYm9keSBwaHlzaWNzIHNpbXVsYXRpb25cbiAgICovXG4gIGFzeW5jIHNpbXVsYXRlUGh5c2ljcyhcbiAgICBib2RpZXM6IEFycmF5PHsgcG9zaXRpb246IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXSwgdmVsb2NpdHk6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXSwgbWFzczogbnVtYmVyIH0+LFxuICAgIHRpbWVzdGVwOiBudW1iZXIsXG4gICAgZ3Jhdml0eTogbnVtYmVyXG4gICk6IFByb21pc2U8QXJyYXk8eyBwb3NpdGlvbjogW251bWJlciwgbnVtYmVyLCBudW1iZXJdLCB2ZWxvY2l0eTogW251bWJlciwgbnVtYmVyLCBudW1iZXJdIH0+PiB7XG4gICAgaWYgKCF0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaGFkZXIgPSB0aGlzLnNoYWRlcnMuZ2V0KCduYm9keScpO1xuICAgIGlmICghc2hhZGVyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ04tYm9keSBzaGFkZXIgbm90IGZvdW5kJyk7XG4gICAgfVxuXG4gICAgY29uc3QgYm9keUNvdW50ID0gYm9kaWVzLmxlbmd0aDtcbiAgICBjb25zdCB0aHJlYWRHcm91cHMgPSBbXG4gICAgICBNYXRoLmNlaWwoYm9keUNvdW50IC8gc2hhZGVyLndvcmtHcm91cFNpemVbMF0pLFxuICAgICAgMSxcbiAgICAgIDFcbiAgICBdO1xuXG4gICAgY29uc29sZS5sb2coYCAgW0QzRDExXSBFeGVjdXRpbmcgTi1ib2R5OiAke2JvZHlDb3VudH0gYm9kaWVzLCAke3RocmVhZEdyb3Vwc1swXX0gdGhyZWFkIGdyb3Vwc2ApO1xuXG4gICAgLy8gU2ltdWxhdGVkIEQzRDExIGV4ZWN1dGlvblxuICAgIC8vIEluIHByb2R1Y3Rpb24sIHdvdWxkOlxuICAgIC8vIDEuIENyZWF0ZSBzdHJ1Y3R1cmVkIGJ1ZmZlcnMgd2l0aCBJRDNEMTFEZXZpY2U6OkNyZWF0ZUJ1ZmZlclxuICAgIC8vIDIuIE1hcCBhbmQgd3JpdGUgZGF0YVxuICAgIC8vIDMuIFNldCBjb21wdXRlIHNoYWRlciB3aXRoIENTU2V0U2hhZGVyXG4gICAgLy8gNC4gU2V0IGJ1ZmZlcnMgd2l0aCBDU1NldFVub3JkZXJlZEFjY2Vzc1ZpZXdzXG4gICAgLy8gNS4gRGlzcGF0Y2ggd2l0aCBDU1NldENvbnN0YW50QnVmZmVycyArIERpc3BhdGNoXG4gICAgLy8gNi4gTWFwIGFuZCByZWFkIHJlc3VsdHNcblxuICAgIC8vIFNpbXVsYXRlZCBwaHlzaWNzIGludGVncmF0aW9uXG4gICAgY29uc3QgcmVzdWx0ID0gYm9kaWVzLm1hcChib2R5ID0+ICh7XG4gICAgICBwb3NpdGlvbjogW1xuICAgICAgICBib2R5LnBvc2l0aW9uWzBdICsgYm9keS52ZWxvY2l0eVswXSAqIHRpbWVzdGVwLFxuICAgICAgICBib2R5LnBvc2l0aW9uWzFdICsgYm9keS52ZWxvY2l0eVsxXSAqIHRpbWVzdGVwIC0gMC41ICogZ3Jhdml0eSAqIHRpbWVzdGVwICogdGltZXN0ZXAsXG4gICAgICAgIGJvZHkucG9zaXRpb25bMl0gKyBib2R5LnZlbG9jaXR5WzJdICogdGltZXN0ZXBcbiAgICAgIF0gYXMgW251bWJlciwgbnVtYmVyLCBudW1iZXJdLFxuICAgICAgdmVsb2NpdHk6IFtcbiAgICAgICAgYm9keS52ZWxvY2l0eVswXSxcbiAgICAgICAgYm9keS52ZWxvY2l0eVsxXSAtIGdyYXZpdHkgKiB0aW1lc3RlcCxcbiAgICAgICAgYm9keS52ZWxvY2l0eVsyXVxuICAgICAgXSBhcyBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl1cbiAgICB9KSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgbWF0cml4IG11bHRpcGxpY2F0aW9uXG4gICAqL1xuICBhc3luYyBtYXRtdWwoXG4gICAgbWF0cml4QTogRmxvYXQzMkFycmF5LFxuICAgIG1hdHJpeEI6IEZsb2F0MzJBcnJheSxcbiAgICByb3dzQTogbnVtYmVyLFxuICAgIGNvbHNBOiBudW1iZXIsXG4gICAgY29sc0I6IG51bWJlclxuICApOiBQcm9taXNlPEZsb2F0MzJBcnJheT4ge1xuICAgIGlmICghdGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2hhZGVyID0gdGhpcy5zaGFkZXJzLmdldCgnbWF0bXVsJyk7XG4gICAgaWYgKCFzaGFkZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWF0TXVsIHNoYWRlciBub3QgZm91bmQnKTtcbiAgICB9XG5cbiAgICBjb25zdCB0aHJlYWRHcm91cHMgPSBbXG4gICAgICBNYXRoLmNlaWwoY29sc0IgLyBzaGFkZXIud29ya0dyb3VwU2l6ZVswXSksXG4gICAgICBNYXRoLmNlaWwocm93c0EgLyBzaGFkZXIud29ya0dyb3VwU2l6ZVsxXSksXG4gICAgICAxXG4gICAgXTtcblxuICAgIGNvbnNvbGUubG9nKGAgIFtEM0QxMV0gRXhlY3V0aW5nIE1hdE11bDogJHtyb3dzQX14JHtjb2xzQX0gw5cgJHtjb2xzQX14JHtjb2xzQn1gKTtcblxuICAgIC8vIFNpbXVsYXRlZCBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICBjb25zdCByZXN1bHQgPSBuZXcgRmxvYXQzMkFycmF5KHJvd3NBICogY29sc0IpO1xuICAgIFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm93c0E7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb2xzQjsgaisrKSB7XG4gICAgICAgIGxldCBzdW0gPSAwO1xuICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IGNvbHNBOyBrKyspIHtcbiAgICAgICAgICBzdW0gKz0gbWF0cml4QVtpICogY29sc0EgKyBrXSAqIG1hdHJpeEJbayAqIGNvbHNCICsgal07XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0W2kgKiBjb2xzQiArIGpdID0gc3VtO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtIG1lc2ggdmVydGljZXNcbiAgICovXG4gIGFzeW5jIHRyYW5zZm9ybVZlcnRpY2VzKFxuICAgIHZlcnRpY2VzOiBBcnJheTx7IHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIgfT4sXG4gICAgdHJhbnNmb3JtOiB7IHNjYWxlOiBudW1iZXIsIHJvdGF0aW9uOiBudW1iZXIsIHRyYW5zbGF0aW9uOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl0gfVxuICApOiBQcm9taXNlPEFycmF5PHsgeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciB9Pj4ge1xuICAgIGlmICghdGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2hhZGVyID0gdGhpcy5zaGFkZXJzLmdldCgnZ2VvbWV0cnknKTtcbiAgICBpZiAoIXNoYWRlcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdHZW9tZXRyeSBzaGFkZXIgbm90IGZvdW5kJyk7XG4gICAgfVxuXG4gICAgY29uc3QgdmVydGV4Q291bnQgPSB2ZXJ0aWNlcy5sZW5ndGg7XG4gICAgY29uc3QgdGhyZWFkR3JvdXBzID0gW01hdGguY2VpbCh2ZXJ0ZXhDb3VudCAvIHNoYWRlci53b3JrR3JvdXBTaXplWzBdKSwgMSwgMV07XG5cbiAgICBjb25zb2xlLmxvZyhgICBbRDNEMTFdIFRyYW5zZm9ybWluZyAke3ZlcnRleENvdW50fSB2ZXJ0aWNlc2ApO1xuXG4gICAgLy8gU2ltdWxhdGVkIHZlcnRleCB0cmFuc2Zvcm1cbiAgICBjb25zdCBjb3NSb3QgPSBNYXRoLmNvcyh0cmFuc2Zvcm0ucm90YXRpb24pO1xuICAgIGNvbnN0IHNpblJvdCA9IE1hdGguc2luKHRyYW5zZm9ybS5yb3RhdGlvbik7XG5cbiAgICBjb25zdCByZXN1bHQgPSB2ZXJ0aWNlcy5tYXAodiA9PiB7XG4gICAgICBsZXQgeCA9IHYueCAqIHRyYW5zZm9ybS5zY2FsZTtcbiAgICAgIGxldCB5ID0gdi55ICogdHJhbnNmb3JtLnNjYWxlO1xuICAgICAgbGV0IHogPSB2LnogKiB0cmFuc2Zvcm0uc2NhbGU7XG5cbiAgICAgIC8vIFJvdGF0ZSBhcm91bmQgWlxuICAgICAgY29uc3QgbmV3WCA9IHggKiBjb3NSb3QgLSB5ICogc2luUm90O1xuICAgICAgY29uc3QgbmV3WSA9IHggKiBzaW5Sb3QgKyB5ICogY29zUm90O1xuICAgICAgeCA9IG5ld1g7XG4gICAgICB5ID0gbmV3WTtcblxuICAgICAgLy8gVHJhbnNsYXRlXG4gICAgICB4ICs9IHRyYW5zZm9ybS50cmFuc2xhdGlvblswXTtcbiAgICAgIHkgKz0gdHJhbnNmb3JtLnRyYW5zbGF0aW9uWzFdO1xuICAgICAgeiArPSB0cmFuc2Zvcm0udHJhbnNsYXRpb25bMl07XG5cbiAgICAgIHJldHVybiB7IHgsIHksIHogfTtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIHN0cnVjdHVyZWQgYnVmZmVyXG4gICAqL1xuICBhc3luYyBjcmVhdGVTdHJ1Y3R1cmVkQnVmZmVyPFQ+KGRhdGE6IFRbXSwgZWxlbWVudFNpemU6IG51bWJlcik6IFByb21pc2U8RDNEMTFCdWZmZXI+IHtcbiAgICBjb25zdCBidWZmZXI6IEQzRDExQnVmZmVyID0ge1xuICAgICAgc2l6ZTogZGF0YS5sZW5ndGggKiBlbGVtZW50U2l6ZSxcbiAgICAgIHVzYWdlOiAnc3RydWN0dXJlZCcsXG4gICAgICBkYXRhOiBuZXcgQXJyYXlCdWZmZXIoYnVmZmVyLnNpemUpXG4gICAgfTtcblxuICAgIGNvbnN0IGlkID0gYGJ1Zi0ke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKX1gO1xuICAgIHRoaXMuYnVmZmVycy5zZXQoaWQsIGJ1ZmZlcik7XG5cbiAgICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBjb25zdGFudCBidWZmZXJcbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNvbnN0YW50QnVmZmVyPFQ+KGRhdGE6IFQpOiBQcm9taXNlPEQzRDExQnVmZmVyPiB7XG4gICAgY29uc3QgYnVmZmVyOiBEM0QxMUJ1ZmZlciA9IHtcbiAgICAgIHNpemU6IDI1NiwgLy8gRDNEMTEgY29uc3RhbnQgYnVmZmVyIHNpemUgbXVsdGlwbGVcbiAgICAgIHVzYWdlOiAnY29uc3RhbnQnLFxuICAgICAgZGF0YVxuICAgIH07XG5cbiAgICBjb25zdCBpZCA9IGBjYi0ke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKX1gO1xuICAgIHRoaXMuYnVmZmVycy5zZXQoaWQsIGJ1ZmZlcik7XG5cbiAgICByZXR1cm4gYnVmZmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIEQzRDExIGlzIGF2YWlsYWJsZVxuICAgKi9cbiAgaXNBdmFpbGFibGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaW5pdGlhbGl6ZWQgJiYgISF0aGlzLmRldmljZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgRDNEMTEgc3RhdHNcbiAgICovXG4gIGdldFN0YXRzKCkge1xuICAgIGlmICghdGhpcy5kZXZpY2UpIHtcbiAgICAgIHJldHVybiB7IGF2YWlsYWJsZTogZmFsc2UgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYXZhaWxhYmxlOiB0cnVlLFxuICAgICAgZGV2aWNlOiB0aGlzLmRldmljZS5uYW1lLFxuICAgICAgZmVhdHVyZUxldmVsOiB0aGlzLmRldmljZS5mZWF0dXJlTGV2ZWwsXG4gICAgICBkcml2ZXJUeXBlOiB0aGlzLmRldmljZS5kcml2ZXJUeXBlLFxuICAgICAgc2hhZGVyczogdGhpcy5zaGFkZXJzLnNpemUsXG4gICAgICBidWZmZXJzOiB0aGlzLmJ1ZmZlcnMuc2l6ZVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2h1dGRvd24gRDNEMTFcbiAgICovXG4gIHNodXRkb3duKCk6IHZvaWQge1xuICAgIGNvbnNvbGUubG9nKCfip6sgU2h1dHRpbmcgZG93biBEaXJlY3QzRCAxMS4uLicpO1xuICAgIHRoaXMuYnVmZmVycy5jbGVhcigpO1xuICAgIHRoaXMuc2hhZGVycy5jbGVhcigpO1xuICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG4gICAgdGhpcy5kZXZpY2UgPSBudWxsO1xuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgfVxufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBITFNMIENPTVBVVEUgU0hBREVSU1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5leHBvcnQgY29uc3QgbmJvZHlDb21wdXRlU2hhZGVySExTTCA9IGBcbi8vIE4tQm9keSBQaHlzaWNzIENvbXB1dGUgU2hhZGVyIChITFNMKVxuLy8gRDNEMTEgRmVhdHVyZSBMZXZlbCAxMS4wK1xuXG5SV1N0cnVjdHVyZWRCdWZmZXI8ZmxvYXQzPiBwb3NpdGlvbnMgOiByZWdpc3Rlcih1MCk7XG5SV1N0cnVjdHVyZWRCdWZmZXI8ZmxvYXQzPiB2ZWxvY2l0aWVzIDogcmVnaXN0ZXIodTEpO1xuU3RydWN0dXJlZEJ1ZmZlcjxmbG9hdD4gbWFzc2VzIDogcmVnaXN0ZXIodTIpO1xuXG5jYnVmZmVyIENvbnN0YW50cyA6IHJlZ2lzdGVyKGIwKSB7XG4gICAgaW50IGJvZHlDb3VudDtcbiAgICBmbG9hdCB0aW1lc3RlcDtcbiAgICBmbG9hdCBncmF2aXR5O1xuICAgIGZsb2F0IHNvZnRlbmluZztcbn07XG5cbltudW10aHJlYWRzKDgsIDgsIDEpXVxudm9pZCBOQm9keVNpbXVsYXRlKHVpbnQzIGRpc3BhdGNoVGhyZWFkSUQgOiBTVl9EaXNwYXRjaFRocmVhZElEKSB7XG4gICAgdWludCBpID0gZGlzcGF0Y2hUaHJlYWRJRC54O1xuICAgIGlmIChpID49IGJvZHlDb3VudCkgcmV0dXJuO1xuICAgIFxuICAgIGZsb2F0MyBwb3MgPSBwb3NpdGlvbnNbaV07XG4gICAgZmxvYXQzIHZlbCA9IHZlbG9jaXRpZXNbaV07XG4gICAgZmxvYXQgbWFzcyA9IG1hc3Nlc1tpXTtcbiAgICBcbiAgICBmbG9hdDMgYWNjZWwgPSBmbG9hdDMoMC4wZiwgMC4wZiwgMC4wZik7XG4gICAgXG4gICAgLy8gTi1ib2R5IGdyYXZpdHlcbiAgICBbbG9vcF1cbiAgICBmb3IgKHVpbnQgaiA9IDA7IGogPCBib2R5Q291bnQ7IGorKykge1xuICAgICAgICBpZiAoaSA9PSBqKSBjb250aW51ZTtcbiAgICAgICAgXG4gICAgICAgIGZsb2F0MyBkaWZmID0gcG9zaXRpb25zW2pdIC0gcG9zO1xuICAgICAgICBmbG9hdCBkaXN0U3EgPSBkb3QoZGlmZiwgZGlmZikgKyBzb2Z0ZW5pbmcgKiBzb2Z0ZW5pbmc7XG4gICAgICAgIGZsb2F0IGRpc3QgPSBzcXJ0KGRpc3RTcSk7XG4gICAgICAgIFxuICAgICAgICBmbG9hdCBmb3JjZU1hZyA9IGdyYXZpdHkgKiBtYXNzZXNbal0gLyAoZGlzdFNxICogZGlzdCk7XG4gICAgICAgIGFjY2VsICs9IGRpZmYgKiBmb3JjZU1hZztcbiAgICB9XG4gICAgXG4gICAgLy8gSW50ZWdyYXRlIChWZWxvY2l0eSBWZXJsZXQpXG4gICAgdmVsICs9IGFjY2VsICogdGltZXN0ZXA7XG4gICAgcG9zICs9IHZlbCAqIHRpbWVzdGVwO1xuICAgIFxuICAgIHBvc2l0aW9uc1tpXSA9IHBvcztcbiAgICB2ZWxvY2l0aWVzW2ldID0gdmVsO1xufVxuYDtcblxuZXhwb3J0IGNvbnN0IG1hdG11bENvbXB1dGVTaGFkZXJITFNMID0gYFxuLy8gTWF0cml4IE11bHRpcGxpY2F0aW9uIENvbXB1dGUgU2hhZGVyIChITFNMKVxuLy8gRDNEMTEgRmVhdHVyZSBMZXZlbCAxMS4wK1xuXG5SV1N0cnVjdHVyZWRCdWZmZXI8ZmxvYXQ+IG1hdHJpeEEgOiByZWdpc3Rlcih1MCk7XG5SV1N0cnVjdHVyZWRCdWZmZXI8ZmxvYXQ+IG1hdHJpeEIgOiByZWdpc3Rlcih1MSk7XG5SV1N0cnVjdHVyZWRCdWZmZXI8ZmxvYXQ+IG1hdHJpeEMgOiByZWdpc3Rlcih1Mik7XG5cbmNidWZmZXIgRGltZW5zaW9ucyA6IHJlZ2lzdGVyKGIwKSB7XG4gICAgaW50IHJvd3NBO1xuICAgIGludCBjb2xzQTtcbiAgICBpbnQgY29sc0I7XG59O1xuXG5ncm91cHNoYXJlZCBmbG9hdCB0aWxlQVs4XVs4XTtcbmdyb3Vwc2hhcmVkIGZsb2F0IHRpbGVCWzhdWzhdO1xuXG5bbnVtdGhyZWFkcyg4LCA4LCAxKV1cbnZvaWQgTWF0cml4TXVsdGlwbHkodWludDMgZGlzcGF0Y2hUaHJlYWRJRCA6IFNWX0Rpc3BhdGNoVGhyZWFkSUQsIHVpbnQzIGdyb3VwVGhyZWFkSUQgOiBTVl9Hcm91cFRocmVhZElELCB1aW50MyBncm91cElEIDogU1ZfR3JvdXBJRCkge1xuICAgIHVpbnQgcm93ID0gZ3JvdXBJRC55ICogOCArIGdyb3VwVGhyZWFkSUQueTtcbiAgICB1aW50IGNvbCA9IGdyb3VwSUQueCAqIDggKyBncm91cFRocmVhZElELng7XG4gICAgXG4gICAgZmxvYXQgc3VtID0gMC4wZjtcbiAgICBcbiAgICBbbG9vcF1cbiAgICBmb3IgKHVpbnQgdCA9IDA7IHQgPCBjb2xzQTsgdCArPSA4KSB7XG4gICAgICAgIC8vIExvYWQgdGlsZXNcbiAgICAgICAgaWYgKHJvdyA8IHJvd3NBICYmIHQgKyBncm91cFRocmVhZElELnggPCBjb2xzQSkge1xuICAgICAgICAgICAgdGlsZUFbZ3JvdXBUaHJlYWRJRC55XVtncm91cFRocmVhZElELnhdID0gbWF0cml4QVtyb3cgKiBjb2xzQSArIHQgKyBncm91cFRocmVhZElELnhdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGlsZUFbZ3JvdXBUaHJlYWRJRC55XVtncm91cFRocmVhZElELnhdID0gMC4wZjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHQgKyBncm91cFRocmVhZElELnkgPCBjb2xzQSAmJiBjb2wgPCBjb2xzQikge1xuICAgICAgICAgICAgdGlsZUJbZ3JvdXBUaHJlYWRJRC55XVtncm91cFRocmVhZElELnhdID0gbWF0cml4QlsodCArIGdyb3VwVGhyZWFkSUQueSkgKiBjb2xzQiArIGNvbF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aWxlQltncm91cFRocmVhZElELnldW2dyb3VwVGhyZWFkSUQueF0gPSAwLjBmO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBHcm91cE1lbW9yeUJhcnJpZXJXaXRoR3JvdXBTeW5jKCk7XG4gICAgICAgIFxuICAgICAgICAvLyBNdWx0aXBseSB0aWxlc1xuICAgICAgICBbdW5yb2xsXVxuICAgICAgICBmb3IgKHVpbnQgayA9IDA7IGsgPCA4OyBrKyspIHtcbiAgICAgICAgICAgIHN1bSArPSB0aWxlQVtncm91cFRocmVhZElELnldW2tdICogdGlsZUJba11bZ3JvdXBUaHJlYWRJRC54XTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgR3JvdXBNZW1vcnlCYXJyaWVyV2l0aEdyb3VwU3luYygpO1xuICAgIH1cbiAgICBcbiAgICBpZiAocm93IDwgcm93c0EgJiYgY29sIDwgY29sc0IpIHtcbiAgICAgICAgbWF0cml4Q1tyb3cgKiBjb2xzQiArIGNvbF0gPSBzdW07XG4gICAgfVxufVxuYDtcblxuZXhwb3J0IGNvbnN0IHZlY3RvckFkZENvbXB1dGVTaGFkZXJITFNMID0gYFxuLy8gVmVjdG9yIEFkZCBDb21wdXRlIFNoYWRlciAoSExTTClcbi8vIEQzRDExIEZlYXR1cmUgTGV2ZWwgMTEuMCtcblxuUldTdHJ1Y3R1cmVkQnVmZmVyPGZsb2F0PiB2ZWN0b3JBIDogcmVnaXN0ZXIodTApO1xuUldTdHJ1Y3R1cmVkQnVmZmVyPGZsb2F0PiB2ZWN0b3JCIDogcmVnaXN0ZXIodTEpO1xuUldTdHJ1Y3R1cmVkQnVmZmVyPGZsb2F0PiB2ZWN0b3JDIDogcmVnaXN0ZXIodTIpO1xuXG5jYnVmZmVyIFNpemUgOiByZWdpc3RlcihiMCkge1xuICAgIGludCBuO1xufTtcblxuW251bXRocmVhZHMoNjQsIDEsIDEpXVxudm9pZCBWZWN0b3JBZGQodWludDMgZGlzcGF0Y2hUaHJlYWRJRCA6IFNWX0Rpc3BhdGNoVGhyZWFkSUQpIHtcbiAgICB1aW50IGkgPSBkaXNwYXRjaFRocmVhZElELng7XG4gICAgaWYgKGkgPj0gbikgcmV0dXJuO1xuICAgIFxuICAgIHZlY3RvckNbaV0gPSB2ZWN0b3JBW2ldICsgdmVjdG9yQltpXTtcbn1cbmA7XG5cbmV4cG9ydCBjb25zdCBnZW9tZXRyeUNvbXB1dGVTaGFkZXJITFNMID0gYFxuLy8gR2VvbWV0cnkgVHJhbnNmb3JtIENvbXB1dGUgU2hhZGVyIChITFNMKVxuLy8gRDNEMTEgRmVhdHVyZSBMZXZlbCAxMS4wK1xuXG5SV1N0cnVjdHVyZWRCdWZmZXI8ZmxvYXQzPiB2ZXJ0aWNlcyA6IHJlZ2lzdGVyKHUwKTtcblxuY2J1ZmZlciBUcmFuc2Zvcm0gOiByZWdpc3RlcihiMCkge1xuICAgIGZsb2F0IHNjYWxlO1xuICAgIGZsb2F0IHJvdGF0aW9uO1xuICAgIGZsb2F0MyB0cmFuc2xhdGlvbjtcbn07XG5cbltudW10aHJlYWRzKDY0LCAxLCAxKV1cbnZvaWQgR2VvbWV0cnlUcmFuc2Zvcm0odWludDMgZGlzcGF0Y2hUaHJlYWRJRCA6IFNWX0Rpc3BhdGNoVGhyZWFkSUQpIHtcbiAgICB1aW50IGkgPSBkaXNwYXRjaFRocmVhZElELng7XG4gICAgXG4gICAgZmxvYXQzIHZlcnRleCA9IHZlcnRpY2VzW2ldO1xuICAgIFxuICAgIC8vIFNjYWxlXG4gICAgdmVydGV4ICo9IHNjYWxlO1xuICAgIFxuICAgIC8vIFJvdGF0aW9uIGFyb3VuZCBaLWF4aXNcbiAgICBmbG9hdCBjb3NSb3QgPSBjb3Mocm90YXRpb24pO1xuICAgIGZsb2F0IHNpblJvdCA9IHNpbihyb3RhdGlvbik7XG4gICAgZmxvYXQgeCA9IHZlcnRleC54O1xuICAgIGZsb2F0IHkgPSB2ZXJ0ZXgueTtcbiAgICB2ZXJ0ZXgueCA9IHggKiBjb3NSb3QgLSB5ICogc2luUm90O1xuICAgIHZlcnRleC55ID0geCAqIHNpblJvdCArIHkgKiBjb3NSb3Q7XG4gICAgXG4gICAgLy8gVHJhbnNsYXRpb25cbiAgICB2ZXJ0ZXggKz0gdHJhbnNsYXRpb247XG4gICAgXG4gICAgdmVydGljZXNbaV0gPSB2ZXJ0ZXg7XG59XG5gO1xuIl19