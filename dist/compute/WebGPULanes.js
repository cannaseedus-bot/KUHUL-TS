/**
 * WebGPU Compute Lanes - WGSL Shaders for Tensor & Physics
 *
 * Actual GPU compute shaders for high-performance operations
 */
// ============================================================================
// TENSOR LANE - Matrix Operations
// ============================================================================
export class TensorLane {
    device;
    queue;
    pipeline = null;
    bindGroupLayout = null;
    constructor(config) {
        this.device = config.device;
        this.queue = config.queue;
    }
    /**
     * Initialize matrix multiplication pipeline
     */
    async initialize() {
        const shaderModule = this.device.createShaderModule({
            label: 'Tensor MatMul Shader',
            code: tensorMatMulWGSL
        });
        this.bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage' }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'read-only-storage' }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'storage' }
                }
            ]
        });
        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.bindGroupLayout]
        });
        this.pipeline = this.device.createComputePipeline({
            label: 'Tensor MatMul Pipeline',
            layout: pipelineLayout,
            compute: {
                module: shaderModule,
                entryPoint: 'matmul'
            }
        });
    }
    /**
     * Execute matrix multiplication on GPU
     */
    async matmul(matrixA, matrixB, rowsA, colsA, colsB) {
        if (!this.pipeline) {
            await this.initialize();
        }
        // Create buffers
        const bufferA = this.device.createBuffer({
            size: matrixA.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: false
        });
        this.queue.writeBuffer(bufferA, 0, matrixA);
        const bufferB = this.device.createBuffer({
            size: matrixB.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: false
        });
        this.queue.writeBuffer(bufferB, 0, matrixB);
        const bufferSize = rowsA * colsB * 4; // Float32
        const bufferResult = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });
        const readBuffer = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        });
        // Create bind group
        const bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: bufferA } },
                { binding: 1, resource: { buffer: bufferB } },
                { binding: 2, resource: { buffer: bufferResult } }
            ]
        });
        // Encode commands
        const commandEncoder = this.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.dispatchWorkgroups(Math.ceil(rowsA / 64), Math.ceil(colsB / 64));
        passEncoder.end();
        commandEncoder.copyBufferToBuffer(bufferResult, 0, readBuffer, 0, bufferSize);
        // Submit and read
        this.queue.submit([commandEncoder.finish()]);
        await readBuffer.mapAsync(GPUMapMode.READ);
        const result = new Float32Array(readBuffer.getMappedRange().slice(0));
        readBuffer.unmap();
        // Cleanup
        bufferA.destroy();
        bufferB.destroy();
        bufferResult.destroy();
        readBuffer.destroy();
        return result;
    }
}
// ============================================================================
// PHYSICS LANE - N-Body Simulation
// ============================================================================
export class PhysicsLane {
    device;
    queue;
    pipeline = null;
    constructor(config) {
        this.device = config.device;
        this.queue = config.queue;
    }
    /**
     * Initialize N-body physics pipeline
     */
    async initialize() {
        const shaderModule = this.device.createShaderModule({
            label: 'Physics N-Body Shader',
            code: nbodyPhysicsWGSL
        });
        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [
                this.device.createBindGroupLayout({
                    entries: [
                        {
                            binding: 0,
                            visibility: GPUShaderStage.COMPUTE,
                            buffer: { type: 'storage' }
                        },
                        {
                            binding: 1,
                            visibility: GPUShaderStage.COMPUTE,
                            buffer: { type: 'uniform' }
                        }
                    ]
                })
            ]
        });
        this.pipeline = this.device.createComputePipeline({
            label: 'Physics N-Body Pipeline',
            layout: pipelineLayout,
            compute: {
                module: shaderModule,
                entryPoint: 'simulate'
            }
        });
    }
    /**
     * Execute one physics step
     */
    async simulate(bodies, timestep, gravity) {
        if (!this.pipeline) {
            await this.initialize();
        }
        const bodyCount = bodies.length;
        const bodyStride = 7 * 4; // 3 pos + 3 vel + 1 mass = 7 floats
        const bufferSize = bodyCount * bodyStride;
        // Pack bodies into buffer
        const bodyData = new Float32Array(bodyCount * 7);
        for (let i = 0; i < bodyCount; i++) {
            const offset = i * 7;
            bodyData[offset + 0] = bodies[i].position[0];
            bodyData[offset + 1] = bodies[i].position[1];
            bodyData[offset + 2] = bodies[i].position[2];
            bodyData[offset + 3] = bodies[i].velocity[0];
            bodyData[offset + 4] = bodies[i].velocity[1];
            bodyData[offset + 5] = bodies[i].velocity[2];
            bodyData[offset + 6] = bodies[i].mass;
        }
        const bodyBuffer = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
            mappedAtCreation: false
        });
        this.queue.writeBuffer(bodyBuffer, 0, bodyData);
        // Uniform buffer for timestep and gravity
        const uniformData = new Float32Array([timestep, gravity, 0, 0]);
        const uniformBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.queue.writeBuffer(uniformBuffer, 0, uniformData);
        // Create bind group
        const bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: bodyBuffer } },
                { binding: 1, resource: { buffer: uniformBuffer } }
            ]
        });
        // Encode commands
        const commandEncoder = this.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.dispatchWorkgroups(Math.ceil(bodyCount / 64));
        passEncoder.end();
        // Copy result back
        const readBuffer = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        });
        commandEncoder.copyBufferToBuffer(bodyBuffer, 0, readBuffer, 0, bufferSize);
        // Submit
        this.queue.submit([commandEncoder.finish()]);
        // Read results
        await readBuffer.mapAsync(GPUMapMode.READ);
        const resultData = new Float32Array(readBuffer.getMappedRange().slice(0));
        readBuffer.unmap();
        // Unpack bodies
        const result = [];
        for (let i = 0; i < bodyCount; i++) {
            const offset = i * 7;
            result.push({
                position: [resultData[offset + 0], resultData[offset + 1], resultData[offset + 2]],
                velocity: [resultData[offset + 3], resultData[offset + 4], resultData[offset + 5]]
            });
        }
        // Cleanup
        bodyBuffer.destroy();
        uniformBuffer.destroy();
        readBuffer.destroy();
        return result;
    }
}
// ============================================================================
// GEOMETRY LANE - Mesh Processing
// ============================================================================
export class GeometryLane {
    device;
    queue;
    transformPipeline = null;
    constructor(config) {
        this.device = config.device;
        this.queue = config.queue;
    }
    /**
     * Initialize mesh transform pipeline
     */
    async initialize() {
        const shaderModule = this.device.createShaderModule({
            label: 'Geometry Transform Shader',
            code: meshTransformWGSL
        });
        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [
                this.device.createBindGroupLayout({
                    entries: [
                        {
                            binding: 0,
                            visibility: GPUShaderStage.COMPUTE,
                            buffer: { type: 'storage' }
                        },
                        {
                            binding: 1,
                            visibility: GPUShaderStage.COMPUTE,
                            buffer: { type: 'uniform' }
                        }
                    ]
                })
            ]
        });
        this.transformPipeline = this.device.createComputePipeline({
            label: 'Geometry Transform Pipeline',
            layout: pipelineLayout,
            compute: {
                module: shaderModule,
                entryPoint: 'transform'
            }
        });
    }
    /**
     * Transform mesh vertices
     */
    async transformVertices(vertices, transform) {
        if (!this.transformPipeline) {
            await this.initialize();
        }
        const vertexCount = vertices.length;
        const vertexStride = 3 * 4; // 3 floats
        const bufferSize = vertexCount * vertexStride;
        // Pack vertices
        const vertexData = new Float32Array(vertexCount * 3);
        for (let i = 0; i < vertexCount; i++) {
            vertexData[i * 3 + 0] = vertices[i].x;
            vertexData[i * 3 + 1] = vertices[i].y;
            vertexData[i * 3 + 2] = vertices[i].z;
        }
        const vertexBuffer = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });
        this.queue.writeBuffer(vertexBuffer, 0, vertexData);
        // Transform uniform
        const transformData = new Float32Array([
            transform.scale,
            transform.rotation,
            transform.translation[0],
            transform.translation[1],
            transform.translation[2],
            0, 0, 0
        ]);
        const transformBuffer = this.device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.queue.writeBuffer(transformBuffer, 0, transformData);
        // Bind group
        const bindGroup = this.device.createBindGroup({
            layout: this.transformPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: vertexBuffer } },
                { binding: 1, resource: { buffer: transformBuffer } }
            ]
        });
        // Encode
        const commandEncoder = this.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.transformPipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.dispatchWorkgroups(Math.ceil(vertexCount / 64));
        passEncoder.end();
        // Read back
        const readBuffer = this.device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
        });
        commandEncoder.copyBufferToBuffer(vertexBuffer, 0, readBuffer, 0, bufferSize);
        this.queue.submit([commandEncoder.finish()]);
        await readBuffer.mapAsync(GPUMapMode.READ);
        const resultData = new Float32Array(readBuffer.getMappedRange().slice(0));
        readBuffer.unmap();
        // Unpack
        const result = [];
        for (let i = 0; i < vertexCount; i++) {
            result.push({
                x: resultData[i * 3 + 0],
                y: resultData[i * 3 + 1],
                z: resultData[i * 3 + 2]
            });
        }
        // Cleanup
        vertexBuffer.destroy();
        transformBuffer.destroy();
        readBuffer.destroy();
        return result;
    }
}
// ============================================================================
// WGSL SHADERS
// ============================================================================
/**
 * Tensor Matrix Multiplication Shader
 */
const tensorMatMulWGSL = `
@group(0) @binding(0)
var<storage, read> matrixA: array<f32>;

@group(0) @binding(1)
var<storage, read> matrixB: array<f32>;

@group(0) @binding(2)
var<storage, read_write> matrixC: array<f32>;

const ROWS_A: u32 = 64u;
const COLS_A: u32 = 64u;
const COLS_B: u32 = 64u;

@compute @workgroup_size(8, 8)
fn matmul(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let row = global_id.x;
    let col = global_id.y;
    
    if (row >= ROWS_A || col >= COLS_B) {
        return;
    }
    
    var sum: f32 = 0.0;
    
    for (var k: u32 = 0u; k < COLS_A; k = k + 1u) {
        let a_val = matrixA[row * COLS_A + k];
        let b_val = matrixB[k * COLS_B + col];
        sum = sum + a_val * b_val;
    }
    
    matrixC[row * COLS_B + col] = sum;
}
`;
/**
 * N-Body Physics Simulation Shader
 */
const nbodyPhysicsWGSL = `
struct Body {
    pos: vec3<f32>,
    vel: vec3<f32>,
    mass: f32,
};

struct Params {
    timestep: f32,
    gravity: f32,
    _pad0: f32,
    _pad1: f32,
};

@group(0) @binding(0)
var<storage, read_write> bodies: array<Body>;

@group(0) @binding(1)
var<uniform> params: Params;

const SOFTENING: f32 = 0.01;
const MAX_BODIES: u32 = 1024u;

@compute @workgroup_size(64)
fn simulate(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let i = global_id.x;
    if (i >= arrayLength(&bodies)) {
        return;
    }
    
    var body = bodies[i];
    var accel: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
    
    // N-body gravity
    for (var j: u32 = 0u; j < arrayLength(&bodies) && j < MAX_BODIES; j = j + 1u) {
        if (i == j) {
            continue;
        }
        
        let other = bodies[j];
        let diff = other.pos - body.pos;
        let distSq = dot(diff, diff) + SOFTENING * SOFTENING;
        let dist = sqrt(distSq);
        
        // F = G * m1 * m2 / r^2
        let forceMag = params.gravity * other.mass / (distSq * dist);
        accel = accel + diff * forceMag;
    }
    
    // Integrate velocity
    body.vel = body.vel + accel * params.timestep;
    
    // Integrate position
    body.pos = body.pos + body.vel * params.timestep;
    
    bodies[i] = body;
}
`;
/**
 * Mesh Transform Shader
 */
const meshTransformWGSL = `
struct Vertex {
    pos: vec3<f32>,
};

struct Transform {
    scale: f32,
    rotation: f32,
    translation: vec3<f32>,
    _pad: vec3<f32>,
};

@group(0) @binding(0)
var<storage, read_write> vertices: array<Vertex>;

@group(0) @binding(1)
var<uniform> transform: Transform;

@compute @workgroup_size(64)
fn transform(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let i = global_id.x;
    if (i >= arrayLength(&vertices)) {
        return;
    }
    
    var vertex = vertices[i];
    
    // Scale
    vertex.pos = vertex.pos * transform.scale;
    
    // Rotation around Z-axis
    let cosRot = cos(transform.rotation);
    let sinRot = sin(transform.rotation);
    let x = vertex.pos.x;
    let y = vertex.pos.y;
    vertex.pos.x = x * cosRot - y * sinRot;
    vertex.pos.y = x * sinRot + y * cosRot;
    
    // Translation
    vertex.pos = vertex.pos + transform.translation;
    
    vertices[i] = vertex;
}
`;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2ViR1BVTGFuZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tcHV0ZS9XZWJHUFVMYW5lcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztHQUlHO0FBT0gsK0VBQStFO0FBQy9FLGtDQUFrQztBQUNsQywrRUFBK0U7QUFFL0UsTUFBTSxPQUFPLFVBQVU7SUFDYixNQUFNLENBQVk7SUFDbEIsS0FBSyxDQUFXO0lBQ2hCLFFBQVEsR0FBOEIsSUFBSSxDQUFDO0lBQzNDLGVBQWUsR0FBOEIsSUFBSSxDQUFDO0lBRTFELFlBQVksTUFBMkI7UUFDckMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzVCLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUM1QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsVUFBVTtRQUNkLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUM7WUFDbEQsS0FBSyxFQUFFLHNCQUFzQjtZQUM3QixJQUFJLEVBQUUsZ0JBQWdCO1NBQ3ZCLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQztZQUN2RCxPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsT0FBTyxFQUFFLENBQUM7b0JBQ1YsVUFBVSxFQUFFLGNBQWMsQ0FBQyxPQUFPO29CQUNsQyxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7aUJBQ3RDO2dCQUNEO29CQUNFLE9BQU8sRUFBRSxDQUFDO29CQUNWLFVBQVUsRUFBRSxjQUFjLENBQUMsT0FBTztvQkFDbEMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFO2lCQUN0QztnQkFDRDtvQkFDRSxPQUFPLEVBQUUsQ0FBQztvQkFDVixVQUFVLEVBQUUsY0FBYyxDQUFDLE9BQU87b0JBQ2xD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VTtRQUNWLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDMUIsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXJCLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7Q0FDRjtBQUVELCtFQUErRTtBQUMvRSxlQUFlO0FBQ2YsK0VBQStFO0FBRS9FOztHQUVHO0FBQ0gsTUFBTSxnQkFBZ0IsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBaUN4QixDQUFDO0FBRUY7O0dBRUc7QUFDSCxNQUFNLGdCQUFnQixHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F5RHhCLENBQUM7QUFFRjs7R0FFRztBQUNILE1BQU0saUJBQWlCLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EyQ3pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFdlYkdQVSBDb21wdXRlIExhbmVzIC0gV0dTTCBTaGFkZXJzIGZvciBUZW5zb3IgJiBQaHlzaWNzXG4gKiBcbiAqIEFjdHVhbCBHUFUgY29tcHV0ZSBzaGFkZXJzIGZvciBoaWdoLXBlcmZvcm1hbmNlIG9wZXJhdGlvbnNcbiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIFdlYkdQVUNvbXB1dGVDb25maWcge1xuICBkZXZpY2U6IEdQVURldmljZTtcbiAgcXVldWU6IEdQVVF1ZXVlO1xufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBURU5TT1IgTEFORSAtIE1hdHJpeCBPcGVyYXRpb25zXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmV4cG9ydCBjbGFzcyBUZW5zb3JMYW5lIHtcbiAgcHJpdmF0ZSBkZXZpY2U6IEdQVURldmljZTtcbiAgcHJpdmF0ZSBxdWV1ZTogR1BVUXVldWU7XG4gIHByaXZhdGUgcGlwZWxpbmU6IEdQVUNvbXB1dGVQaXBlbGluZSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGJpbmRHcm91cExheW91dDogR1BVQmluZEdyb3VwTGF5b3V0IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBXZWJHUFVDb21wdXRlQ29uZmlnKSB7XG4gICAgdGhpcy5kZXZpY2UgPSBjb25maWcuZGV2aWNlO1xuICAgIHRoaXMucXVldWUgPSBjb25maWcucXVldWU7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBtYXRyaXggbXVsdGlwbGljYXRpb24gcGlwZWxpbmVcbiAgICovXG4gIGFzeW5jIGluaXRpYWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc2hhZGVyTW9kdWxlID0gdGhpcy5kZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcbiAgICAgIGxhYmVsOiAnVGVuc29yIE1hdE11bCBTaGFkZXInLFxuICAgICAgY29kZTogdGVuc29yTWF0TXVsV0dTTFxuICAgIH0pO1xuXG4gICAgdGhpcy5iaW5kR3JvdXBMYXlvdXQgPSB0aGlzLmRldmljZS5jcmVhdGVCaW5kR3JvdXBMYXlvdXQoe1xuICAgICAgZW50cmllczogW1xuICAgICAgICB7XG4gICAgICAgICAgYmluZGluZzogMCxcbiAgICAgICAgICB2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuICAgICAgICAgIGJ1ZmZlcjogeyB0eXBlOiAncmVhZC1vbmx5LXN0b3JhZ2UnIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGJpbmRpbmc6IDEsXG4gICAgICAgICAgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcbiAgICAgICAgICBidWZmZXI6IHsgdHlwZTogJ3JlYWQtb25seS1zdG9yYWdlJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBiaW5kaW5nOiAyLFxuICAgICAgICAgIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG4gICAgICAgICAgYnVmZmVyOiB7IHR5cGU6ICdzdG9yYWdlJyB9XG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9KTtcblxuICAgIGNvbnN0IHBpcGVsaW5lTGF5b3V0ID0gdGhpcy5kZXZpY2UuY3JlYXRlUGlwZWxpbmVMYXlvdXQoe1xuICAgICAgYmluZEdyb3VwTGF5b3V0czogW3RoaXMuYmluZEdyb3VwTGF5b3V0XVxuICAgIH0pO1xuXG4gICAgdGhpcy5waXBlbGluZSA9IHRoaXMuZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG4gICAgICBsYWJlbDogJ1RlbnNvciBNYXRNdWwgUGlwZWxpbmUnLFxuICAgICAgbGF5b3V0OiBwaXBlbGluZUxheW91dCxcbiAgICAgIGNvbXB1dGU6IHtcbiAgICAgICAgbW9kdWxlOiBzaGFkZXJNb2R1bGUsXG4gICAgICAgIGVudHJ5UG9pbnQ6ICdtYXRtdWwnXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBtYXRyaXggbXVsdGlwbGljYXRpb24gb24gR1BVXG4gICAqL1xuICBhc3luYyBtYXRtdWwoXG4gICAgbWF0cml4QTogRmxvYXQzMkFycmF5LFxuICAgIG1hdHJpeEI6IEZsb2F0MzJBcnJheSxcbiAgICByb3dzQTogbnVtYmVyLFxuICAgIGNvbHNBOiBudW1iZXIsXG4gICAgY29sc0I6IG51bWJlclxuICApOiBQcm9taXNlPEZsb2F0MzJBcnJheT4ge1xuICAgIGlmICghdGhpcy5waXBlbGluZSkge1xuICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGJ1ZmZlcnNcbiAgICBjb25zdCBidWZmZXJBID0gdGhpcy5kZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICAgIHNpemU6IG1hdHJpeEEuYnl0ZUxlbmd0aCxcbiAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG4gICAgICBtYXBwZWRBdENyZWF0aW9uOiBmYWxzZVxuICAgIH0pO1xuICAgIHRoaXMucXVldWUud3JpdGVCdWZmZXIoYnVmZmVyQSwgMCwgbWF0cml4QSk7XG5cbiAgICBjb25zdCBidWZmZXJCID0gdGhpcy5kZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICAgIHNpemU6IG1hdHJpeEIuYnl0ZUxlbmd0aCxcbiAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QsXG4gICAgICBtYXBwZWRBdENyZWF0aW9uOiBmYWxzZVxuICAgIH0pO1xuICAgIHRoaXMucXVldWUud3JpdGVCdWZmZXIoYnVmZmVyQiwgMCwgbWF0cml4Qik7XG5cbiAgICBjb25zdCBidWZmZXJTaXplID0gcm93c0EgKiBjb2xzQiAqIDQ7IC8vIEZsb2F0MzJcbiAgICBjb25zdCBidWZmZXJSZXN1bHQgPSB0aGlzLmRldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgICAgc2l6ZTogYnVmZmVyU2l6ZSxcbiAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5TVE9SQUdFIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9TUkNcbiAgICB9KTtcblxuICAgIGNvbnN0IHJlYWRCdWZmZXIgPSB0aGlzLmRldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgICAgc2l6ZTogYnVmZmVyU2l6ZSxcbiAgICAgIHVzYWdlOiBHUFVCdWZmZXJVc2FnZS5NQVBfUkVBRCB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNUXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgYmluZCBncm91cFxuICAgIGNvbnN0IGJpbmRHcm91cCA9IHRoaXMuZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG4gICAgICBsYXlvdXQ6IHRoaXMucGlwZWxpbmUhLmdldEJpbmRHcm91cExheW91dCgwKSxcbiAgICAgIGVudHJpZXM6IFtcbiAgICAgICAgeyBiaW5kaW5nOiAwLCByZXNvdXJjZTogeyBidWZmZXI6IGJ1ZmZlckEgfSB9LFxuICAgICAgICB7IGJpbmRpbmc6IDEsIHJlc291cmNlOiB7IGJ1ZmZlcjogYnVmZmVyQiB9IH0sXG4gICAgICAgIHsgYmluZGluZzogMiwgcmVzb3VyY2U6IHsgYnVmZmVyOiBidWZmZXJSZXN1bHQgfSB9XG4gICAgICBdXG4gICAgfSk7XG5cbiAgICAvLyBFbmNvZGUgY29tbWFuZHNcbiAgICBjb25zdCBjb21tYW5kRW5jb2RlciA9IHRoaXMuZGV2aWNlLmNyZWF0ZUNvbW1hbmRFbmNvZGVyKCk7XG4gICAgY29uc3QgcGFzc0VuY29kZXIgPSBjb21tYW5kRW5jb2Rlci5iZWdpbkNvbXB1dGVQYXNzKCk7XG4gICAgcGFzc0VuY29kZXIuc2V0UGlwZWxpbmUodGhpcy5waXBlbGluZSEpO1xuICAgIHBhc3NFbmNvZGVyLnNldEJpbmRHcm91cCgwLCBiaW5kR3JvdXApO1xuICAgIHBhc3NFbmNvZGVyLmRpc3BhdGNoV29ya2dyb3VwcyhNYXRoLmNlaWwocm93c0EgLyA2NCksIE1hdGguY2VpbChjb2xzQiAvIDY0KSk7XG4gICAgcGFzc0VuY29kZXIuZW5kKCk7XG5cbiAgICBjb21tYW5kRW5jb2Rlci5jb3B5QnVmZmVyVG9CdWZmZXIoXG4gICAgICBidWZmZXJSZXN1bHQsIDAsXG4gICAgICByZWFkQnVmZmVyLCAwLFxuICAgICAgYnVmZmVyU2l6ZVxuICAgICk7XG5cbiAgICAvLyBTdWJtaXQgYW5kIHJlYWRcbiAgICB0aGlzLnF1ZXVlLnN1Ym1pdChbY29tbWFuZEVuY29kZXIuZmluaXNoKCldKTtcblxuICAgIGF3YWl0IHJlYWRCdWZmZXIubWFwQXN5bmMoR1BVTWFwTW9kZS5SRUFEKTtcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgRmxvYXQzMkFycmF5KHJlYWRCdWZmZXIuZ2V0TWFwcGVkUmFuZ2UoKS5zbGljZSgwKSk7XG4gICAgcmVhZEJ1ZmZlci51bm1hcCgpO1xuXG4gICAgLy8gQ2xlYW51cFxuICAgIGJ1ZmZlckEuZGVzdHJveSgpO1xuICAgIGJ1ZmZlckIuZGVzdHJveSgpO1xuICAgIGJ1ZmZlclJlc3VsdC5kZXN0cm95KCk7XG4gICAgcmVhZEJ1ZmZlci5kZXN0cm95KCk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFBIWVNJQ1MgTEFORSAtIE4tQm9keSBTaW11bGF0aW9uXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmV4cG9ydCBjbGFzcyBQaHlzaWNzTGFuZSB7XG4gIHByaXZhdGUgZGV2aWNlOiBHUFVEZXZpY2U7XG4gIHByaXZhdGUgcXVldWU6IEdQVVF1ZXVlO1xuICBwcml2YXRlIHBpcGVsaW5lOiBHUFVDb21wdXRlUGlwZWxpbmUgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFdlYkdQVUNvbXB1dGVDb25maWcpIHtcbiAgICB0aGlzLmRldmljZSA9IGNvbmZpZy5kZXZpY2U7XG4gICAgdGhpcy5xdWV1ZSA9IGNvbmZpZy5xdWV1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIE4tYm9keSBwaHlzaWNzIHBpcGVsaW5lXG4gICAqL1xuICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNoYWRlck1vZHVsZSA9IHRoaXMuZGV2aWNlLmNyZWF0ZVNoYWRlck1vZHVsZSh7XG4gICAgICBsYWJlbDogJ1BoeXNpY3MgTi1Cb2R5IFNoYWRlcicsXG4gICAgICBjb2RlOiBuYm9keVBoeXNpY3NXR1NMXG4gICAgfSk7XG5cbiAgICBjb25zdCBwaXBlbGluZUxheW91dCA9IHRoaXMuZGV2aWNlLmNyZWF0ZVBpcGVsaW5lTGF5b3V0KHtcbiAgICAgIGJpbmRHcm91cExheW91dHM6IFtcbiAgICAgICAgdGhpcy5kZXZpY2UuY3JlYXRlQmluZEdyb3VwTGF5b3V0KHtcbiAgICAgICAgICBlbnRyaWVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGJpbmRpbmc6IDAsXG4gICAgICAgICAgICAgIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG4gICAgICAgICAgICAgIGJ1ZmZlcjogeyB0eXBlOiAnc3RvcmFnZScgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgYmluZGluZzogMSxcbiAgICAgICAgICAgICAgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcbiAgICAgICAgICAgICAgYnVmZmVyOiB7IHR5cGU6ICd1bmlmb3JtJyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9KVxuICAgICAgXVxuICAgIH0pO1xuXG4gICAgdGhpcy5waXBlbGluZSA9IHRoaXMuZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XG4gICAgICBsYWJlbDogJ1BoeXNpY3MgTi1Cb2R5IFBpcGVsaW5lJyxcbiAgICAgIGxheW91dDogcGlwZWxpbmVMYXlvdXQsXG4gICAgICBjb21wdXRlOiB7XG4gICAgICAgIG1vZHVsZTogc2hhZGVyTW9kdWxlLFxuICAgICAgICBlbnRyeVBvaW50OiAnc2ltdWxhdGUnXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBvbmUgcGh5c2ljcyBzdGVwXG4gICAqL1xuICBhc3luYyBzaW11bGF0ZShcbiAgICBib2RpZXM6IEFycmF5PHsgcG9zaXRpb246IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXSwgdmVsb2NpdHk6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXSwgbWFzczogbnVtYmVyIH0+LFxuICAgIHRpbWVzdGVwOiBudW1iZXIsXG4gICAgZ3Jhdml0eTogbnVtYmVyXG4gICk6IFByb21pc2U8QXJyYXk8eyBwb3NpdGlvbjogW251bWJlciwgbnVtYmVyLCBudW1iZXJdLCB2ZWxvY2l0eTogW251bWJlciwgbnVtYmVyLCBudW1iZXJdIH0+PiB7XG4gICAgaWYgKCF0aGlzLnBpcGVsaW5lKSB7XG4gICAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBib2R5Q291bnQgPSBib2RpZXMubGVuZ3RoO1xuICAgIGNvbnN0IGJvZHlTdHJpZGUgPSA3ICogNDsgLy8gMyBwb3MgKyAzIHZlbCArIDEgbWFzcyA9IDcgZmxvYXRzXG4gICAgY29uc3QgYnVmZmVyU2l6ZSA9IGJvZHlDb3VudCAqIGJvZHlTdHJpZGU7XG5cbiAgICAvLyBQYWNrIGJvZGllcyBpbnRvIGJ1ZmZlclxuICAgIGNvbnN0IGJvZHlEYXRhID0gbmV3IEZsb2F0MzJBcnJheShib2R5Q291bnQgKiA3KTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJvZHlDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSBpICogNztcbiAgICAgIGJvZHlEYXRhW29mZnNldCArIDBdID0gYm9kaWVzW2ldLnBvc2l0aW9uWzBdO1xuICAgICAgYm9keURhdGFbb2Zmc2V0ICsgMV0gPSBib2RpZXNbaV0ucG9zaXRpb25bMV07XG4gICAgICBib2R5RGF0YVtvZmZzZXQgKyAyXSA9IGJvZGllc1tpXS5wb3NpdGlvblsyXTtcbiAgICAgIGJvZHlEYXRhW29mZnNldCArIDNdID0gYm9kaWVzW2ldLnZlbG9jaXR5WzBdO1xuICAgICAgYm9keURhdGFbb2Zmc2V0ICsgNF0gPSBib2RpZXNbaV0udmVsb2NpdHlbMV07XG4gICAgICBib2R5RGF0YVtvZmZzZXQgKyA1XSA9IGJvZGllc1tpXS52ZWxvY2l0eVsyXTtcbiAgICAgIGJvZHlEYXRhW29mZnNldCArIDZdID0gYm9kaWVzW2ldLm1hc3M7XG4gICAgfVxuXG4gICAgY29uc3QgYm9keUJ1ZmZlciA9IHRoaXMuZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgICBzaXplOiBidWZmZXJTaXplLFxuICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlNUT1JBR0UgfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVCB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfU1JDLFxuICAgICAgbWFwcGVkQXRDcmVhdGlvbjogZmFsc2VcbiAgICB9KTtcbiAgICB0aGlzLnF1ZXVlLndyaXRlQnVmZmVyKGJvZHlCdWZmZXIsIDAsIGJvZHlEYXRhKTtcblxuICAgIC8vIFVuaWZvcm0gYnVmZmVyIGZvciB0aW1lc3RlcCBhbmQgZ3Jhdml0eVxuICAgIGNvbnN0IHVuaWZvcm1EYXRhID0gbmV3IEZsb2F0MzJBcnJheShbdGltZXN0ZXAsIGdyYXZpdHksIDAsIDBdKTtcbiAgICBjb25zdCB1bmlmb3JtQnVmZmVyID0gdGhpcy5kZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICAgIHNpemU6IDE2LFxuICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0gfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVFxuICAgIH0pO1xuICAgIHRoaXMucXVldWUud3JpdGVCdWZmZXIodW5pZm9ybUJ1ZmZlciwgMCwgdW5pZm9ybURhdGEpO1xuXG4gICAgLy8gQ3JlYXRlIGJpbmQgZ3JvdXBcbiAgICBjb25zdCBiaW5kR3JvdXAgPSB0aGlzLmRldmljZS5jcmVhdGVCaW5kR3JvdXAoe1xuICAgICAgbGF5b3V0OiB0aGlzLnBpcGVsaW5lIS5nZXRCaW5kR3JvdXBMYXlvdXQoMCksXG4gICAgICBlbnRyaWVzOiBbXG4gICAgICAgIHsgYmluZGluZzogMCwgcmVzb3VyY2U6IHsgYnVmZmVyOiBib2R5QnVmZmVyIH0gfSxcbiAgICAgICAgeyBiaW5kaW5nOiAxLCByZXNvdXJjZTogeyBidWZmZXI6IHVuaWZvcm1CdWZmZXIgfSB9XG4gICAgICBdXG4gICAgfSk7XG5cbiAgICAvLyBFbmNvZGUgY29tbWFuZHNcbiAgICBjb25zdCBjb21tYW5kRW5jb2RlciA9IHRoaXMuZGV2aWNlLmNyZWF0ZUNvbW1hbmRFbmNvZGVyKCk7XG4gICAgY29uc3QgcGFzc0VuY29kZXIgPSBjb21tYW5kRW5jb2Rlci5iZWdpbkNvbXB1dGVQYXNzKCk7XG4gICAgcGFzc0VuY29kZXIuc2V0UGlwZWxpbmUodGhpcy5waXBlbGluZSEpO1xuICAgIHBhc3NFbmNvZGVyLnNldEJpbmRHcm91cCgwLCBiaW5kR3JvdXApO1xuICAgIHBhc3NFbmNvZGVyLmRpc3BhdGNoV29ya2dyb3VwcyhNYXRoLmNlaWwoYm9keUNvdW50IC8gNjQpKTtcbiAgICBwYXNzRW5jb2Rlci5lbmQoKTtcblxuICAgIC8vIENvcHkgcmVzdWx0IGJhY2tcbiAgICBjb25zdCByZWFkQnVmZmVyID0gdGhpcy5kZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICAgIHNpemU6IGJ1ZmZlclNpemUsXG4gICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuTUFQX1JFQUQgfCBHUFVCdWZmZXJVc2FnZS5DT1BZX0RTVFxuICAgIH0pO1xuICAgIGNvbW1hbmRFbmNvZGVyLmNvcHlCdWZmZXJUb0J1ZmZlcihib2R5QnVmZmVyLCAwLCByZWFkQnVmZmVyLCAwLCBidWZmZXJTaXplKTtcblxuICAgIC8vIFN1Ym1pdFxuICAgIHRoaXMucXVldWUuc3VibWl0KFtjb21tYW5kRW5jb2Rlci5maW5pc2goKV0pO1xuXG4gICAgLy8gUmVhZCByZXN1bHRzXG4gICAgYXdhaXQgcmVhZEJ1ZmZlci5tYXBBc3luYyhHUFVNYXBNb2RlLlJFQUQpO1xuICAgIGNvbnN0IHJlc3VsdERhdGEgPSBuZXcgRmxvYXQzMkFycmF5KHJlYWRCdWZmZXIuZ2V0TWFwcGVkUmFuZ2UoKS5zbGljZSgwKSk7XG4gICAgcmVhZEJ1ZmZlci51bm1hcCgpO1xuXG4gICAgLy8gVW5wYWNrIGJvZGllc1xuICAgIGNvbnN0IHJlc3VsdDogQXJyYXk8eyBwb3NpdGlvbjogW251bWJlciwgbnVtYmVyLCBudW1iZXJdLCB2ZWxvY2l0eTogW251bWJlciwgbnVtYmVyLCBudW1iZXJdIH0+ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBib2R5Q291bnQ7IGkrKykge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gaSAqIDc7XG4gICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgIHBvc2l0aW9uOiBbcmVzdWx0RGF0YVtvZmZzZXQgKyAwXSwgcmVzdWx0RGF0YVtvZmZzZXQgKyAxXSwgcmVzdWx0RGF0YVtvZmZzZXQgKyAyXV0sXG4gICAgICAgIHZlbG9jaXR5OiBbcmVzdWx0RGF0YVtvZmZzZXQgKyAzXSwgcmVzdWx0RGF0YVtvZmZzZXQgKyA0XSwgcmVzdWx0RGF0YVtvZmZzZXQgKyA1XV1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIENsZWFudXBcbiAgICBib2R5QnVmZmVyLmRlc3Ryb3koKTtcbiAgICB1bmlmb3JtQnVmZmVyLmRlc3Ryb3koKTtcbiAgICByZWFkQnVmZmVyLmRlc3Ryb3koKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gR0VPTUVUUlkgTEFORSAtIE1lc2ggUHJvY2Vzc2luZ1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5leHBvcnQgY2xhc3MgR2VvbWV0cnlMYW5lIHtcbiAgcHJpdmF0ZSBkZXZpY2U6IEdQVURldmljZTtcbiAgcHJpdmF0ZSBxdWV1ZTogR1BVUXVldWU7XG4gIHByaXZhdGUgdHJhbnNmb3JtUGlwZWxpbmU6IEdQVUNvbXB1dGVQaXBlbGluZSB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogV2ViR1BVQ29tcHV0ZUNvbmZpZykge1xuICAgIHRoaXMuZGV2aWNlID0gY29uZmlnLmRldmljZTtcbiAgICB0aGlzLnF1ZXVlID0gY29uZmlnLnF1ZXVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgbWVzaCB0cmFuc2Zvcm0gcGlwZWxpbmVcbiAgICovXG4gIGFzeW5jIGluaXRpYWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc2hhZGVyTW9kdWxlID0gdGhpcy5kZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcbiAgICAgIGxhYmVsOiAnR2VvbWV0cnkgVHJhbnNmb3JtIFNoYWRlcicsXG4gICAgICBjb2RlOiBtZXNoVHJhbnNmb3JtV0dTTFxuICAgIH0pO1xuXG4gICAgY29uc3QgcGlwZWxpbmVMYXlvdXQgPSB0aGlzLmRldmljZS5jcmVhdGVQaXBlbGluZUxheW91dCh7XG4gICAgICBiaW5kR3JvdXBMYXlvdXRzOiBbXG4gICAgICAgIHRoaXMuZGV2aWNlLmNyZWF0ZUJpbmRHcm91cExheW91dCh7XG4gICAgICAgICAgZW50cmllczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBiaW5kaW5nOiAwLFxuICAgICAgICAgICAgICB2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxuICAgICAgICAgICAgICBidWZmZXI6IHsgdHlwZTogJ3N0b3JhZ2UnIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGJpbmRpbmc6IDEsXG4gICAgICAgICAgICAgIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXG4gICAgICAgICAgICAgIGJ1ZmZlcjogeyB0eXBlOiAndW5pZm9ybScgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSlcbiAgICAgIF1cbiAgICB9KTtcblxuICAgIHRoaXMudHJhbnNmb3JtUGlwZWxpbmUgPSB0aGlzLmRldmljZS5jcmVhdGVDb21wdXRlUGlwZWxpbmUoe1xuICAgICAgbGFiZWw6ICdHZW9tZXRyeSBUcmFuc2Zvcm0gUGlwZWxpbmUnLFxuICAgICAgbGF5b3V0OiBwaXBlbGluZUxheW91dCxcbiAgICAgIGNvbXB1dGU6IHtcbiAgICAgICAgbW9kdWxlOiBzaGFkZXJNb2R1bGUsXG4gICAgICAgIGVudHJ5UG9pbnQ6ICd0cmFuc2Zvcm0nXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtIG1lc2ggdmVydGljZXNcbiAgICovXG4gIGFzeW5jIHRyYW5zZm9ybVZlcnRpY2VzKFxuICAgIHZlcnRpY2VzOiBBcnJheTx7IHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIgfT4sXG4gICAgdHJhbnNmb3JtOiB7IHNjYWxlOiBudW1iZXIsIHJvdGF0aW9uOiBudW1iZXIsIHRyYW5zbGF0aW9uOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl0gfVxuICApOiBQcm9taXNlPEFycmF5PHsgeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciB9Pj4ge1xuICAgIGlmICghdGhpcy50cmFuc2Zvcm1QaXBlbGluZSkge1xuICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplKCk7XG4gICAgfVxuXG4gICAgY29uc3QgdmVydGV4Q291bnQgPSB2ZXJ0aWNlcy5sZW5ndGg7XG4gICAgY29uc3QgdmVydGV4U3RyaWRlID0gMyAqIDQ7IC8vIDMgZmxvYXRzXG4gICAgY29uc3QgYnVmZmVyU2l6ZSA9IHZlcnRleENvdW50ICogdmVydGV4U3RyaWRlO1xuXG4gICAgLy8gUGFjayB2ZXJ0aWNlc1xuICAgIGNvbnN0IHZlcnRleERhdGEgPSBuZXcgRmxvYXQzMkFycmF5KHZlcnRleENvdW50ICogMyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2ZXJ0ZXhDb3VudDsgaSsrKSB7XG4gICAgICB2ZXJ0ZXhEYXRhW2kgKiAzICsgMF0gPSB2ZXJ0aWNlc1tpXS54O1xuICAgICAgdmVydGV4RGF0YVtpICogMyArIDFdID0gdmVydGljZXNbaV0ueTtcbiAgICAgIHZlcnRleERhdGFbaSAqIDMgKyAyXSA9IHZlcnRpY2VzW2ldLno7XG4gICAgfVxuXG4gICAgY29uc3QgdmVydGV4QnVmZmVyID0gdGhpcy5kZXZpY2UuY3JlYXRlQnVmZmVyKHtcbiAgICAgIHNpemU6IGJ1ZmZlclNpemUsXG4gICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuU1RPUkFHRSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNUIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9TUkNcbiAgICB9KTtcbiAgICB0aGlzLnF1ZXVlLndyaXRlQnVmZmVyKHZlcnRleEJ1ZmZlciwgMCwgdmVydGV4RGF0YSk7XG5cbiAgICAvLyBUcmFuc2Zvcm0gdW5pZm9ybVxuICAgIGNvbnN0IHRyYW5zZm9ybURhdGEgPSBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgIHRyYW5zZm9ybS5zY2FsZSxcbiAgICAgIHRyYW5zZm9ybS5yb3RhdGlvbixcbiAgICAgIHRyYW5zZm9ybS50cmFuc2xhdGlvblswXSxcbiAgICAgIHRyYW5zZm9ybS50cmFuc2xhdGlvblsxXSxcbiAgICAgIHRyYW5zZm9ybS50cmFuc2xhdGlvblsyXSxcbiAgICAgIDAsIDAsIDBcbiAgICBdKTtcbiAgICBjb25zdCB0cmFuc2Zvcm1CdWZmZXIgPSB0aGlzLmRldmljZS5jcmVhdGVCdWZmZXIoe1xuICAgICAgc2l6ZTogMzIsXG4gICAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNUXG4gICAgfSk7XG4gICAgdGhpcy5xdWV1ZS53cml0ZUJ1ZmZlcih0cmFuc2Zvcm1CdWZmZXIsIDAsIHRyYW5zZm9ybURhdGEpO1xuXG4gICAgLy8gQmluZCBncm91cFxuICAgIGNvbnN0IGJpbmRHcm91cCA9IHRoaXMuZGV2aWNlLmNyZWF0ZUJpbmRHcm91cCh7XG4gICAgICBsYXlvdXQ6IHRoaXMudHJhbnNmb3JtUGlwZWxpbmUhLmdldEJpbmRHcm91cExheW91dCgwKSxcbiAgICAgIGVudHJpZXM6IFtcbiAgICAgICAgeyBiaW5kaW5nOiAwLCByZXNvdXJjZTogeyBidWZmZXI6IHZlcnRleEJ1ZmZlciB9IH0sXG4gICAgICAgIHsgYmluZGluZzogMSwgcmVzb3VyY2U6IHsgYnVmZmVyOiB0cmFuc2Zvcm1CdWZmZXIgfSB9XG4gICAgICBdXG4gICAgfSk7XG5cbiAgICAvLyBFbmNvZGVcbiAgICBjb25zdCBjb21tYW5kRW5jb2RlciA9IHRoaXMuZGV2aWNlLmNyZWF0ZUNvbW1hbmRFbmNvZGVyKCk7XG4gICAgY29uc3QgcGFzc0VuY29kZXIgPSBjb21tYW5kRW5jb2Rlci5iZWdpbkNvbXB1dGVQYXNzKCk7XG4gICAgcGFzc0VuY29kZXIuc2V0UGlwZWxpbmUodGhpcy50cmFuc2Zvcm1QaXBlbGluZSEpO1xuICAgIHBhc3NFbmNvZGVyLnNldEJpbmRHcm91cCgwLCBiaW5kR3JvdXApO1xuICAgIHBhc3NFbmNvZGVyLmRpc3BhdGNoV29ya2dyb3VwcyhNYXRoLmNlaWwodmVydGV4Q291bnQgLyA2NCkpO1xuICAgIHBhc3NFbmNvZGVyLmVuZCgpO1xuXG4gICAgLy8gUmVhZCBiYWNrXG4gICAgY29uc3QgcmVhZEJ1ZmZlciA9IHRoaXMuZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XG4gICAgICBzaXplOiBidWZmZXJTaXplLFxuICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLk1BUF9SRUFEIHwgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1RcbiAgICB9KTtcbiAgICBjb21tYW5kRW5jb2Rlci5jb3B5QnVmZmVyVG9CdWZmZXIodmVydGV4QnVmZmVyLCAwLCByZWFkQnVmZmVyLCAwLCBidWZmZXJTaXplKTtcbiAgICB0aGlzLnF1ZXVlLnN1Ym1pdChbY29tbWFuZEVuY29kZXIuZmluaXNoKCldKTtcblxuICAgIGF3YWl0IHJlYWRCdWZmZXIubWFwQXN5bmMoR1BVTWFwTW9kZS5SRUFEKTtcbiAgICBjb25zdCByZXN1bHREYXRhID0gbmV3IEZsb2F0MzJBcnJheShyZWFkQnVmZmVyLmdldE1hcHBlZFJhbmdlKCkuc2xpY2UoMCkpO1xuICAgIHJlYWRCdWZmZXIudW5tYXAoKTtcblxuICAgIC8vIFVucGFja1xuICAgIGNvbnN0IHJlc3VsdDogQXJyYXk8eyB4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyIH0+ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2ZXJ0ZXhDb3VudDsgaSsrKSB7XG4gICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgIHg6IHJlc3VsdERhdGFbaSAqIDMgKyAwXSxcbiAgICAgICAgeTogcmVzdWx0RGF0YVtpICogMyArIDFdLFxuICAgICAgICB6OiByZXN1bHREYXRhW2kgKiAzICsgMl1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIENsZWFudXBcbiAgICB2ZXJ0ZXhCdWZmZXIuZGVzdHJveSgpO1xuICAgIHRyYW5zZm9ybUJ1ZmZlci5kZXN0cm95KCk7XG4gICAgcmVhZEJ1ZmZlci5kZXN0cm95KCk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFdHU0wgU0hBREVSU1xuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4vKipcbiAqIFRlbnNvciBNYXRyaXggTXVsdGlwbGljYXRpb24gU2hhZGVyXG4gKi9cbmNvbnN0IHRlbnNvck1hdE11bFdHU0wgPSBgXG5AZ3JvdXAoMCkgQGJpbmRpbmcoMClcbnZhcjxzdG9yYWdlLCByZWFkPiBtYXRyaXhBOiBhcnJheTxmMzI+O1xuXG5AZ3JvdXAoMCkgQGJpbmRpbmcoMSlcbnZhcjxzdG9yYWdlLCByZWFkPiBtYXRyaXhCOiBhcnJheTxmMzI+O1xuXG5AZ3JvdXAoMCkgQGJpbmRpbmcoMilcbnZhcjxzdG9yYWdlLCByZWFkX3dyaXRlPiBtYXRyaXhDOiBhcnJheTxmMzI+O1xuXG5jb25zdCBST1dTX0E6IHUzMiA9IDY0dTtcbmNvbnN0IENPTFNfQTogdTMyID0gNjR1O1xuY29uc3QgQ09MU19COiB1MzIgPSA2NHU7XG5cbkBjb21wdXRlIEB3b3JrZ3JvdXBfc2l6ZSg4LCA4KVxuZm4gbWF0bXVsKEBidWlsdGluKGdsb2JhbF9pbnZvY2F0aW9uX2lkKSBnbG9iYWxfaWQ6IHZlYzM8dTMyPikge1xuICAgIGxldCByb3cgPSBnbG9iYWxfaWQueDtcbiAgICBsZXQgY29sID0gZ2xvYmFsX2lkLnk7XG4gICAgXG4gICAgaWYgKHJvdyA+PSBST1dTX0EgfHwgY29sID49IENPTFNfQikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIHZhciBzdW06IGYzMiA9IDAuMDtcbiAgICBcbiAgICBmb3IgKHZhciBrOiB1MzIgPSAwdTsgayA8IENPTFNfQTsgayA9IGsgKyAxdSkge1xuICAgICAgICBsZXQgYV92YWwgPSBtYXRyaXhBW3JvdyAqIENPTFNfQSArIGtdO1xuICAgICAgICBsZXQgYl92YWwgPSBtYXRyaXhCW2sgKiBDT0xTX0IgKyBjb2xdO1xuICAgICAgICBzdW0gPSBzdW0gKyBhX3ZhbCAqIGJfdmFsO1xuICAgIH1cbiAgICBcbiAgICBtYXRyaXhDW3JvdyAqIENPTFNfQiArIGNvbF0gPSBzdW07XG59XG5gO1xuXG4vKipcbiAqIE4tQm9keSBQaHlzaWNzIFNpbXVsYXRpb24gU2hhZGVyXG4gKi9cbmNvbnN0IG5ib2R5UGh5c2ljc1dHU0wgPSBgXG5zdHJ1Y3QgQm9keSB7XG4gICAgcG9zOiB2ZWMzPGYzMj4sXG4gICAgdmVsOiB2ZWMzPGYzMj4sXG4gICAgbWFzczogZjMyLFxufTtcblxuc3RydWN0IFBhcmFtcyB7XG4gICAgdGltZXN0ZXA6IGYzMixcbiAgICBncmF2aXR5OiBmMzIsXG4gICAgX3BhZDA6IGYzMixcbiAgICBfcGFkMTogZjMyLFxufTtcblxuQGdyb3VwKDApIEBiaW5kaW5nKDApXG52YXI8c3RvcmFnZSwgcmVhZF93cml0ZT4gYm9kaWVzOiBhcnJheTxCb2R5PjtcblxuQGdyb3VwKDApIEBiaW5kaW5nKDEpXG52YXI8dW5pZm9ybT4gcGFyYW1zOiBQYXJhbXM7XG5cbmNvbnN0IFNPRlRFTklORzogZjMyID0gMC4wMTtcbmNvbnN0IE1BWF9CT0RJRVM6IHUzMiA9IDEwMjR1O1xuXG5AY29tcHV0ZSBAd29ya2dyb3VwX3NpemUoNjQpXG5mbiBzaW11bGF0ZShAYnVpbHRpbihnbG9iYWxfaW52b2NhdGlvbl9pZCkgZ2xvYmFsX2lkOiB2ZWMzPHUzMj4pIHtcbiAgICBsZXQgaSA9IGdsb2JhbF9pZC54O1xuICAgIGlmIChpID49IGFycmF5TGVuZ3RoKCZib2RpZXMpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgXG4gICAgdmFyIGJvZHkgPSBib2RpZXNbaV07XG4gICAgdmFyIGFjY2VsOiB2ZWMzPGYzMj4gPSB2ZWMzPGYzMj4oMC4wLCAwLjAsIDAuMCk7XG4gICAgXG4gICAgLy8gTi1ib2R5IGdyYXZpdHlcbiAgICBmb3IgKHZhciBqOiB1MzIgPSAwdTsgaiA8IGFycmF5TGVuZ3RoKCZib2RpZXMpICYmIGogPCBNQVhfQk9ESUVTOyBqID0gaiArIDF1KSB7XG4gICAgICAgIGlmIChpID09IGopIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBsZXQgb3RoZXIgPSBib2RpZXNbal07XG4gICAgICAgIGxldCBkaWZmID0gb3RoZXIucG9zIC0gYm9keS5wb3M7XG4gICAgICAgIGxldCBkaXN0U3EgPSBkb3QoZGlmZiwgZGlmZikgKyBTT0ZURU5JTkcgKiBTT0ZURU5JTkc7XG4gICAgICAgIGxldCBkaXN0ID0gc3FydChkaXN0U3EpO1xuICAgICAgICBcbiAgICAgICAgLy8gRiA9IEcgKiBtMSAqIG0yIC8gcl4yXG4gICAgICAgIGxldCBmb3JjZU1hZyA9IHBhcmFtcy5ncmF2aXR5ICogb3RoZXIubWFzcyAvIChkaXN0U3EgKiBkaXN0KTtcbiAgICAgICAgYWNjZWwgPSBhY2NlbCArIGRpZmYgKiBmb3JjZU1hZztcbiAgICB9XG4gICAgXG4gICAgLy8gSW50ZWdyYXRlIHZlbG9jaXR5XG4gICAgYm9keS52ZWwgPSBib2R5LnZlbCArIGFjY2VsICogcGFyYW1zLnRpbWVzdGVwO1xuICAgIFxuICAgIC8vIEludGVncmF0ZSBwb3NpdGlvblxuICAgIGJvZHkucG9zID0gYm9keS5wb3MgKyBib2R5LnZlbCAqIHBhcmFtcy50aW1lc3RlcDtcbiAgICBcbiAgICBib2RpZXNbaV0gPSBib2R5O1xufVxuYDtcblxuLyoqXG4gKiBNZXNoIFRyYW5zZm9ybSBTaGFkZXJcbiAqL1xuY29uc3QgbWVzaFRyYW5zZm9ybVdHU0wgPSBgXG5zdHJ1Y3QgVmVydGV4IHtcbiAgICBwb3M6IHZlYzM8ZjMyPixcbn07XG5cbnN0cnVjdCBUcmFuc2Zvcm0ge1xuICAgIHNjYWxlOiBmMzIsXG4gICAgcm90YXRpb246IGYzMixcbiAgICB0cmFuc2xhdGlvbjogdmVjMzxmMzI+LFxuICAgIF9wYWQ6IHZlYzM8ZjMyPixcbn07XG5cbkBncm91cCgwKSBAYmluZGluZygwKVxudmFyPHN0b3JhZ2UsIHJlYWRfd3JpdGU+IHZlcnRpY2VzOiBhcnJheTxWZXJ0ZXg+O1xuXG5AZ3JvdXAoMCkgQGJpbmRpbmcoMSlcbnZhcjx1bmlmb3JtPiB0cmFuc2Zvcm06IFRyYW5zZm9ybTtcblxuQGNvbXB1dGUgQHdvcmtncm91cF9zaXplKDY0KVxuZm4gdHJhbnNmb3JtKEBidWlsdGluKGdsb2JhbF9pbnZvY2F0aW9uX2lkKSBnbG9iYWxfaWQ6IHZlYzM8dTMyPikge1xuICAgIGxldCBpID0gZ2xvYmFsX2lkLng7XG4gICAgaWYgKGkgPj0gYXJyYXlMZW5ndGgoJnZlcnRpY2VzKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIHZhciB2ZXJ0ZXggPSB2ZXJ0aWNlc1tpXTtcbiAgICBcbiAgICAvLyBTY2FsZVxuICAgIHZlcnRleC5wb3MgPSB2ZXJ0ZXgucG9zICogdHJhbnNmb3JtLnNjYWxlO1xuICAgIFxuICAgIC8vIFJvdGF0aW9uIGFyb3VuZCBaLWF4aXNcbiAgICBsZXQgY29zUm90ID0gY29zKHRyYW5zZm9ybS5yb3RhdGlvbik7XG4gICAgbGV0IHNpblJvdCA9IHNpbih0cmFuc2Zvcm0ucm90YXRpb24pO1xuICAgIGxldCB4ID0gdmVydGV4LnBvcy54O1xuICAgIGxldCB5ID0gdmVydGV4LnBvcy55O1xuICAgIHZlcnRleC5wb3MueCA9IHggKiBjb3NSb3QgLSB5ICogc2luUm90O1xuICAgIHZlcnRleC5wb3MueSA9IHggKiBzaW5Sb3QgKyB5ICogY29zUm90O1xuICAgIFxuICAgIC8vIFRyYW5zbGF0aW9uXG4gICAgdmVydGV4LnBvcyA9IHZlcnRleC5wb3MgKyB0cmFuc2Zvcm0udHJhbnNsYXRpb247XG4gICAgXG4gICAgdmVydGljZXNbaV0gPSB2ZXJ0ZXg7XG59XG5gO1xuIl19