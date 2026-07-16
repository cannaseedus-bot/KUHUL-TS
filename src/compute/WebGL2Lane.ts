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

export class WebGL2Lane {
  private gl: WebGL2RenderingContext | null = null;
  private programs: Map<string, WebGLProgram> = new Map();
  private buffers: Map<string, WebGLBuffer> = new Map();
  private vaos: Map<string, WebGLVertexArrayObject> = new Map();

  constructor(private config: WebGL2ComputeConfig = {}) {}

  /**
   * Initialize WebGL2 context
   */
  async initialize(): Promise<boolean> {
    const canvas = this.config.canvas || document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    const glOptions: WebGLContextAttributes = {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      powerPreference: this.config.preferHighPerformance ? 'high-performance' : 'default'
    };

    this.gl = canvas.getContext('webgl2', glOptions);

    if (!this.gl) {
      console.log('⚠ WebGL2 not available');
      return false;
    }

    console.log('⧫ WebGL2 initialized:');
    console.log(`  Renderer: ${this.gl.getParameter(this.gl.RENDERER)}`);
    console.log(`  Vendor: ${this.gl.getParameter(this.gl.VENDOR)}`);
    console.log(`  Version: ${this.gl.getParameter(this.gl.VERSION)}`);
    console.log(`  GLSL: ${this.gl.getParameter(this.gl.SHADING_LANGUAGE_VERSION)}`);

    // Create compute programs
    await this.createPrograms();

    return true;
  }

  /**
   * Create compute shader programs
   */
  private async createPrograms(): Promise<void> {
    // Physics compute program (via transform feedback)
    const physicsProgram = this.createProgram(
      'physics_compute',
      physicsVertexShaderGLSL,
      physicsFragmentShaderGLSL,
      ['outPosition', 'outVelocity']
    );

    if (physicsProgram) {
      this.programs.set('physics', physicsProgram);
    }

    // Tensor compute program
    const tensorProgram = this.createProgram(
      'tensor_compute',
      tensorVertexShaderGLSL,
      tensorFragmentShaderGLSL,
      ['outMatrix']
    );

    if (tensorProgram) {
      this.programs.set('tensor', tensorProgram);
    }

    // Geometry transform program
    const geometryProgram = this.createProgram(
      'geometry_compute',
      geometryVertexShaderGLSL,
      geometryFragmentShaderGLSL,
      ['outVertex']
    );

    if (geometryProgram) {
      this.programs.set('geometry', geometryProgram);
    }
  }

  /**
   * Create WebGL program with transform feedback
   */
  private createProgram(
    name: string,
    vertexShader: string,
    fragmentShader: string,
    varyings: string[]
  ): WebGLProgram | null {
    if (!this.gl) return null;

    const gl = this.gl;

    // Compile shaders
    const vs = this.compileShader(gl.VERTEX_SHADER, vertexShader);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fragmentShader);

    if (!vs || !fs) return null;

    // Create program
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    // Set transform feedback varyings
    gl.transformFeedbackVaryings(program, varyings, gl.SEPARATE_ATTRIBS);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(`Failed to link ${name}:`, gl.getProgramInfoLog(program));
      return null;
    }

    console.log(`  ✓ ${name} program created`);
    return program;
  }

  /**
   * Compile shader
   */
  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Execute physics simulation via transform feedback
   */
  async simulatePhysics(
    bodies: Array<{ position: [number, number, number], velocity: [number, number, number], mass: number }>,
    timestep: number,
    gravity: number
  ): Promise<Array<{ position: [number, number, number], velocity: [number, number, number] }>> {
    if (!this.gl || !this.programs.has('physics')) {
      throw new Error('WebGL2 not initialized');
    }

    const gl = this.gl;
    const program = this.programs.get('physics')!;

    const bodyCount = bodies.length;

    // Create buffers for positions and velocities
    const positions = new Float32Array(bodyCount * 3);
    const velocities = new Float32Array(bodyCount * 3);
    const masses = new Float32Array(bodyCount);

    for (let i = 0; i < bodyCount; i++) {
      positions[i * 3 + 0] = bodies[i].position[0];
      positions[i * 3 + 1] = bodies[i].position[1];
      positions[i * 3 + 2] = bodies[i].position[2];

      velocities[i * 3 + 0] = bodies[i].velocity[0];
      velocities[i * 3 + 1] = bodies[i].velocity[1];
      velocities[i * 3 + 2] = bodies[i].velocity[2];

      masses[i] = bodies[i].mass;
    }

    // Input buffers
    const posBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_COPY);

    const velBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, velBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, velocities, gl.DYNAMIC_COPY);

    const massBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, massBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, masses, gl.DYNAMIC_COPY);

    // Output buffers (for transform feedback)
    const outPosBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, outPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions.byteLength, gl.DYNAMIC_COPY);

    const outVelBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, outVelBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, velocities.byteLength, gl.DYNAMIC_COPY);

    // Create VAO
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    // Position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    // Velocity attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, velBuffer);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    // Mass attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, massBuffer);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);

    // Create transform feedback
    const tf = gl.createTransformFeedback()!;
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, outPosBuffer);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, outVelBuffer);

    // Use program
    gl.useProgram(program);

    // Set uniforms
    const timestepLoc = gl.getUniformLocation(program, 'uTimestep');
    const gravityLoc = gl.getUniformLocation(program, 'uGravity');
    const bodyCountLoc = gl.getUniformLocation(program, 'uBodyCount');

    gl.uniform1f(timestepLoc, timestep);
    gl.uniform1f(gravityLoc, gravity);
    gl.uniform1i(bodyCountLoc, bodyCount);

    // Run transform feedback
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, bodyCount);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);

    // Read back results
    gl.bindBuffer(gl.ARRAY_BUFFER, outPosBuffer);
    const outPositions = new Float32Array(gl.getBufferSubData(0, 0, positions.byteLength));

    gl.bindBuffer(gl.ARRAY_BUFFER, outVelBuffer);
    const outVelocities = new Float32Array(gl.getBufferSubData(0, 0, velocities.byteLength));

    // Unpack results
    const result: Array<{ position: [number, number, number], velocity: [number, number, number] }> = [];
    for (let i = 0; i < bodyCount; i++) {
      result.push({
        position: [outPositions[i * 3 + 0], outPositions[i * 3 + 1], outPositions[i * 3 + 2]],
        velocity: [outVelocities[i * 3 + 0], outVelocities[i * 3 + 1], outVelocities[i * 3 + 2]]
      });
    }

    // Cleanup
    gl.deleteBuffer(posBuffer);
    gl.deleteBuffer(velBuffer);
    gl.deleteBuffer(massBuffer);
    gl.deleteBuffer(outPosBuffer);
    gl.deleteBuffer(outVelBuffer);
    gl.deleteVertexArray(vao);
    gl.deleteTransformFeedback(tf);

    return result;
  }

  /**
   * Execute matrix multiplication
   */
  async matmul(
    matrixA: Float32Array,
    matrixB: Float32Array,
    rowsA: number,
    colsA: number,
    colsB: number
  ): Promise<Float32Array> {
    if (!this.gl || !this.programs.has('tensor')) {
      throw new Error('WebGL2 not initialized');
    }

    const gl = this.gl;
    const program = this.programs.get('tensor')!;

    // Upload textures for matrices
    const textureA = this.createTexture(matrixA, colsA, rowsA);
    const textureB = this.createTexture(matrixB, colsB, colsA);
    const textureC = this.createTexture(new Float32Array(rowsA * colsB), colsB, rowsA);

    // Use program
    gl.useProgram(program);

    // Set uniforms
    gl.uniform1i(gl.getUniformLocation(program, 'uMatrixA'), 0);
    gl.uniform1i(gl.getUniformLocation(program, 'uMatrixB'), 1);
    gl.uniform1i(gl.getUniformLocation(program, 'uMatrixC'), 2);
    gl.uniform1i(gl.getUniformLocation(program, 'uRowsA'), rowsA);
    gl.uniform1i(gl.getUniformLocation(program, 'uColsA'), colsA);
    gl.uniform1i(gl.getUniformLocation(program, 'uColsB'), colsB);

    // Bind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureA);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textureB);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, textureC);

    // Render fullscreen quad
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    const quadBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Read back result
    const result = new Float32Array(rowsA * colsB);
    gl.readPixels(0, 0, colsB, rowsA, gl.RGBA, gl.FLOAT, result);

    // Cleanup
    gl.deleteTexture(textureA);
    gl.deleteTexture(textureB);
    gl.deleteTexture(textureC);
    gl.deleteBuffer(quadBuffer);
    gl.deleteVertexArray(vao);

    return result;
  }

  /**
   * Create texture from float array
   */
  private createTexture(data: Float32Array, width: number, height: number): WebGLTexture {
    if (!this.gl) throw new Error('WebGL2 not initialized');

    const gl = this.gl;
    const texture = gl.createTexture()!;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
  }

  /**
   * Check if WebGL2 is available
   */
  isAvailable(): boolean {
    return !!this.gl;
  }

  /**
   * Get WebGL2 stats
   */
  getStats() {
    if (!this.gl) {
      return { available: false };
    }

    return {
      available: true,
      renderer: this.gl.getParameter(this.gl.RENDERER),
      maxTextureSize: this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE),
      maxVertexAttribs: this.gl.getParameter(this.gl.MAX_VERTEX_ATTRIBS),
      programs: this.programs.size
    };
  }
}

// ============================================================================
// WEBGL2 SHADERS (GLSL)
// ============================================================================

const physicsVertexShaderGLSL = `#version 300 es
precision highp float;

layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec3 inVelocity;
layout(location = 2) in float inMass;

layout(location = 0) out vec3 outPosition;
layout(location = 1) out vec3 outVelocity;

uniform float uTimestep;
uniform float uGravity;
uniform int uBodyCount;

const float SOFTENING = 0.01;

void main() {
    vec3 position = inPosition;
    vec3 velocity = inVelocity;
    float mass = inMass;
    
    vec3 accel = vec3(0.0);
    
    // N-body gravity (simplified - would need SSBO for full N-body)
    for (int i = 0; i < min(uBodyCount, 64); i++) {
        // In production, would read from shader storage buffer
        // This is a simplified version
    }
    
    velocity += accel * uTimestep;
    position += velocity * uTimestep;
    
    outPosition = position;
    outVelocity = velocity;
    
    gl_Position = vec4(position, 1.0);
}
`;

const physicsFragmentShaderGLSL = `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
    fragColor = vec4(0.0);
}
`;

const tensorVertexShaderGLSL = `#version 300 es
precision highp float;

layout(location = 0) in vec2 position;

out vec2 vUV;

void main() {
    vUV = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const tensorFragmentShaderGLSL = `#version 300 es
precision highp float;

uniform sampler2D uMatrixA;
uniform sampler2D uMatrixB;
uniform sampler2D uMatrixC;
uniform int uRowsA;
uniform int uColsA;
uniform int uColsB;

out vec4 fragColor;

void main() {
    int row = int(gl_FragCoord.y);
    int col = int(gl_FragCoord.x);
    
    if (row >= uRowsA || col >= uColsB) {
        fragColor = vec4(0.0);
        return;
    }
    
    float sum = 0.0;
    
    for (int k = 0; k < uColsA; k++) {
        vec4 a = texelFetch(uMatrixA, ivec2(k, row), 0);
        vec4 b = texelFetch(uMatrixB, ivec2(col, k), 0);
        sum += dot(a, b);
    }
    
    fragColor = vec4(sum, 0.0, 0.0, 1.0);
}
`;

const geometryVertexShaderGLSL = `#version 300 es
precision highp float;

layout(location = 0) in vec3 inVertex;

layout(location = 0) out vec3 outVertex;

uniform float uScale;
uniform float uRotation;
uniform vec3 uTranslation;

void main() {
    vec3 vertex = inVertex;
    
    // Scale
    vertex *= uScale;
    
    // Rotation around Z
    float cosRot = cos(uRotation);
    float sinRot = sin(uRotation);
    float x = vertex.x;
    float y = vertex.y;
    vertex.x = x * cosRot - y * sinRot;
    vertex.y = x * sinRot + y * cosRot;
    
    // Translation
    vertex += uTranslation;
    
    outVertex = vertex;
    gl_Position = vec4(vertex, 1.0);
}
`;

const geometryFragmentShaderGLSL = `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
    fragColor = vec4(0.0);
}
`;
