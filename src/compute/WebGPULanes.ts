/**
 * WebGPU Compute Lanes - WGSL Shaders for Tensor & Physics
 * 
 * Actual GPU compute shaders for high-performance operations
 */

export interface WebGPUComputeConfig {
  device: GPUDevice;
  queue: GPUQueue;
}

// ============================================================================
// TENSOR LANE - Matrix Operations
// ============================================================================

export class TensorLane {
  private device: GPUDevice;
  private queue: GPUQueue;
  private pipeline: GPUComputePipeline | null = null;
  private bindGroupLayout: GPUBindGroupLayout | null = null;

  constructor(config: WebGPUComputeConfig) {
    this.device = config.device;
    this.queue = config.queue;
  }

  /**
   * Initialize matrix multiplication pipeline
   */
  async initialize(): Promise<void> {
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
  async matmul(
    matrixA: Float32Array,
    matrixB: Float32Array,
    rowsA: number,
    colsA: number,
    colsB: number
  ): Promise<Float32Array> {
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
      layout: this.pipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: bufferA } },
        { binding: 1, resource: { buffer: bufferB } },
        { binding: 2, resource: { buffer: bufferResult } }
      ]
    });

    // Encode commands
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(this.pipeline!);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(rowsA / 64), Math.ceil(colsB / 64));
    passEncoder.end();

    commandEncoder.copyBufferToBuffer(
      bufferResult, 0,
      readBuffer, 0,
      bufferSize
    );

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
  private device: GPUDevice;
  private queue: GPUQueue;
  private pipeline: GPUComputePipeline | null = null;

  constructor(config: WebGPUComputeConfig) {
    this.device = config.device;
    this.queue = config.queue;
  }

  /**
   * Initialize N-body physics pipeline
   */
  async initialize(): Promise<void> {
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
  async simulate(
    bodies: Array<{ position: [number, number, number], velocity: [number, number, number], mass: number }>,
    timestep: number,
    gravity: number
  ): Promise<Array<{ position: [number, number, number], velocity: [number, number, number] }>> {
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
      layout: this.pipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: bodyBuffer } },
        { binding: 1, resource: { buffer: uniformBuffer } }
      ]
    });

    // Encode commands
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(this.pipeline!);
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
    const result: Array<{ position: [number, number, number], velocity: [number, number, number] }> = [];
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
  private device: GPUDevice;
  private queue: GPUQueue;
  private transformPipeline: GPUComputePipeline | null = null;

  constructor(config: WebGPUComputeConfig) {
    this.device = config.device;
    this.queue = config.queue;
  }

  /**
   * Initialize mesh transform pipeline
   */
  async initialize(): Promise<void> {
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
  async transformVertices(
    vertices: Array<{ x: number, y: number, z: number }>,
    transform: { scale: number, rotation: number, translation: [number, number, number] }
  ): Promise<Array<{ x: number, y: number, z: number }>> {
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
      layout: this.transformPipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: vertexBuffer } },
        { binding: 1, resource: { buffer: transformBuffer } }
      ]
    });

    // Encode
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(this.transformPipeline!);
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
    const result: Array<{ x: number, y: number, z: number }> = [];
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
