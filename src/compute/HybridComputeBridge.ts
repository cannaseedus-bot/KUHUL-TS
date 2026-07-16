/**
 * Hybrid Compute Bridge - Combines Binary Lanes + WebGPU Lanes
 * 
 * Routes operations to the best backend:
 * - WebGPU for tensor/physics/geometry (GPU acceleration)
 * - Binary executables for atomizer/mesh/linear_fold/micronaut
 */

import { ComputeBridge, ComputeOperation, ComputeResult, LaneStatus } from '../core/compute-bridge';
import { BinaryLane } from './BinaryLane';
import { TensorLane, PhysicsLane, GeometryLane } from './WebGPULanes';
import { WebGL2Lane } from './WebGL2Lane';
import { OpenCLLane } from './OpenCLLane';
import { D3D11Lane } from './D3D11Lane';

export interface HybridBridgeConfig {
  // Binary lanes
  binaryDir: string;
  
  // GPU Backends
  useWebGPU: boolean;
  useWebGL2: boolean;
  useOpenCL: boolean;
  useD3D11: boolean;
  
  // General
  defaultTimeout: number;
  preferBackend: 'webgpu' | 'webgl2' | 'opencl' | 'd3d11' | 'auto';
}

export class HybridComputeBridge implements ComputeBridge {
  private binaryLanes: Map<string, BinaryLane> = new Map();
  private tensorLane: TensorLane | null = null;
  private physicsLane: PhysicsLane | null = null;
  private geometryLane: GeometryLane | null = null;
  private webgl2Lane: WebGL2Lane | null = null;
  private openclLane: OpenCLLane | null = null;
  private d3d11Lane: D3D11Lane | null = null;
  private config: HybridBridgeConfig;
  private device: GPUDevice | null = null;
  private activeBackend: string = 'none';

  constructor(config: Partial<HybridBridgeConfig> = {}) {
    this.config = {
      binaryDir: config.binaryDir || './bin',
      useWebGPU: config.useWebGPU ?? true,
      useWebGL2: config.useWebGL2 ?? true,
      useOpenCL: config.useOpenCL ?? true,
      useD3D11: config.useD3D11 ?? true,
      defaultTimeout: config.defaultTimeout ?? 30000,
      preferBackend: config.preferBackend ?? 'auto'
    };

    this.initializeBinaryLanes();
    this.initializeGPUBackends();
  }

  /**
   * Initialize binary lanes for existing executables
   */
  private initializeBinaryLanes(): void {
    const binaryDir = this.config.binaryDir;

    // Atomizer lane
    this.binaryLanes.set('atomizer-1', new BinaryLane({
      id: 'atomizer-1',
      type: 'atomizer',
      executable: `${binaryDir}/atomizer.exe`,
      workingDir: binaryDir,
      maxConcurrent: 2,
      timeout: this.config.defaultTimeout
    }));

    // Mesh lane
    this.binaryLanes.set('mesh-1', new BinaryLane({
      id: 'mesh-1',
      type: 'mesh',
      executable: `${binaryDir}/mesh.exe`,
      workingDir: binaryDir,
      maxConcurrent: 2,
      timeout: this.config.defaultTimeout
    }));

    // Linear fold lane
    this.binaryLanes.set('linear-fold-1', new BinaryLane({
      id: 'linear-fold-1',
      type: 'linear_fold',
      executable: `${binaryDir}/linear_fold.exe`,
      workingDir: binaryDir,
      maxConcurrent: 2,
      timeout: this.config.defaultTimeout
    }));

    // Micronaut lane
    this.binaryLanes.set('micronaut-1', new BinaryLane({
      id: 'micronaut-1',
      type: 'micronaut',
      executable: `${binaryDir}/micronaut.exe`,
      workingDir: binaryDir,
      maxConcurrent: 1,
      timeout: this.config.defaultTimeout * 10 // Evolution takes longer
    }));

    // Micronaut XJSON lane
    this.binaryLanes.set('micronaut-xjson-1', new BinaryLane({
      id: 'micronaut-xjson-1',
      type: 'micronaut_xjson',
      executable: `${binaryDir}/micronaut_xjson.exe`,
      workingDir: binaryDir,
      maxConcurrent: 4,
      timeout: this.config.defaultTimeout
    }));

    // MoE GGUF inference lane
    this.binaryLanes.set('moe-gguf-1', new BinaryLane({
      id: 'moe-gguf-1',
      type: 'moe_gguf',
      executable: `${binaryDir}/moe_gguf_runtime.exe`,
      workingDir: binaryDir,
      maxConcurrent: 1,
      timeout: this.config.defaultTimeout * 5
    }));

    console.log('⧫ Binary lanes initialized:');
    for (const [id, lane] of this.binaryLanes) {
      console.log(`  ${id} → ${lane.getStatus().available ? '✓' : '✗'}`);
    }
  }

  /**
   * Initialize all GPU backends
   */
  private async initializeGPUBackends(): Promise<void> {
    const backends: Array<{name: string, init: () => Promise<boolean>}> = [
      { name: 'D3D11', init: () => this.initializeD3D11() },
      { name: 'WebGPU', init: () => this.initializeWebGPU() },
      { name: 'WebGL2', init: () => this.initializeWebGL2() },
      { name: 'OpenCL', init: () => this.initializeOpenCL() }
    ];

    console.log('⧫ Initializing GPU backends...');

    for (const backend of backends) {
      try {
        const success = await backend.init();
        if (success) {
          this.activeBackend = backend.name;
          console.log(`  ✓ ${backend.name} initialized`);
          
          // If we found a backend and not auto-selecting, stop
          if (this.config.preferBackend !== 'auto' && this.config.preferBackend === backend.name.toLowerCase()) {
            break;
          }
        }
      } catch (error: any) {
        console.log(`  ✗ ${backend.name} failed: ${error.message}`);
      }
    }

    if (this.activeBackend === 'none') {
      console.log('⚠ No GPU backends available, using binary lanes only');
    } else {
      console.log(`⧫ Active backend: ${this.activeBackend}`);
    }
  }

  /**
   * Initialize WebGL2 lane
   */
  private async initializeWebGL2(): Promise<boolean> {
    if (!this.config.useWebGL2) return false;

    this.webgl2Lane = new WebGL2Lane();
    return await this.webgl2Lane.initialize();
  }

  /**
   * Initialize OpenCL lane
   */
  private async initializeOpenCL(): Promise<boolean> {
    if (!this.config.useOpenCL) return false;

    this.openclLane = new OpenCLLane();
    return await this.openclLane.initialize();
  }

  /**
   * Initialize D3D11 lane
   */
  private async initializeD3D11(): Promise<boolean> {
    if (!this.config.useD3D11) return false;

    this.d3d11Lane = new D3D11Lane();
    return await this.d3d11Lane.initialize();
  }
    if (typeof navigator === 'undefined' || !navigator.gpu) {
      console.log('⚠ WebGPU not available in this environment');
      return;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.log('⚠ No WebGPU adapter available');
        return;
      }

      this.device = await adapter.requestDevice();
      const queue = this.device.queue;

      console.log('⧫ WebGPU initialized:');
      console.log(`  Device: ${adapter.info.device}`);
      console.log(`  Backend: ${adapter.info.backend}`);

      // Create GPU lanes
      this.tensorLane = new TensorLane({ device: this.device, queue });
      this.physicsLane = new PhysicsLane({ device: this.device, queue });
      this.geometryLane = new GeometryLane({ device: this.device, queue });

      await this.tensorLane.initialize();
      await this.physicsLane.initialize();
      await this.geometryLane.initialize();

      console.log('  ✓ Tensor lane (MatMul)');
      console.log('  ✓ Physics lane (N-body)');
      console.log('  ✓ Geometry lane (Mesh transform)');

    } catch (error: any) {
      console.log('⚠ WebGPU initialization failed:', error.message);
    }
  }

  /**
   * Execute compute operation
   */
  async execute<T = any>(operation: ComputeOperation): Promise<ComputeResult<T>> {
    const startTime = performance.now();

    // Select lane based on operation type
    const lane = this.selectLane(operation);

    if (!lane) {
      return {
        id: `op-${Date.now()}`,
        operationId: operation.id,
        laneId: 'none',
        data: null as any,
        πHash: '0x00000000',
        duration: performance.now() - startTime,
        memory: 0,
        timestamp: Date.now(),
        success: false,
        error: new Error(`No lane available for type: ${operation.type}`)
      };
    }

    try {
      // Execute on selected lane
      const result = await lane.execute(operation);
      return result as ComputeResult<T>;

    } catch (error: any) {
      return {
        id: `op-${Date.now()}`,
        operationId: operation.id,
        laneId: lane.id,
        data: null as any,
        πHash: '0x00000000',
        duration: performance.now() - startTime,
        memory: 0,
        timestamp: Date.now(),
        success: false,
        error
      };
    }
  }

  /**
   * Stream results (for long-running operations)
   */
  async *stream<T = any>(operation: ComputeOperation): AsyncIterable<ComputeResult<T>> {
    const lane = this.selectLane(operation);

    if (!lane) {
      throw new Error(`No lane available for type: ${operation.type}`);
    }

    // For binary lanes, we can't truly stream, but we can poll
    if (lane instanceof BinaryLane) {
      const result = await lane.execute(operation);
      yield result as ComputeResult<T>;
      return;
    }

    // WebGPU lanes would need custom streaming implementation
    throw new Error('Streaming not implemented for WebGPU lanes');
  }

  /**
   * Select best lane for operation
   */
  private selectLane(operation: ComputeOperation): BinaryLane | WebGL2Lane | OpenCLLane | D3D11Lane | null {
    const type = operation.type;
    const laneId = operation.laneId;

    // Explicit lane selection
    if (laneId && this.binaryLanes.has(laneId)) {
      const lane = this.binaryLanes.get(laneId)!;
      if (lane.isAvailable()) {
        return lane;
      }
    }

    // Auto-select based on type and active backend
    switch (type) {
      case 'tensor':
        // Try GPU backends in priority order
        if (this.activeBackend === 'd3d11' && this.d3d11Lane?.isAvailable()) return this.d3d11Lane;
        if (this.activeBackend === 'webgpu' && this.tensorLane) return this.tensorLane;
        if (this.activeBackend === 'webgl2' && this.webgl2Lane?.isAvailable()) return this.webgl2Lane;
        if (this.activeBackend === 'opencl' && this.openclLane?.isAvailable()) return this.openclLane;
        return this.findAvailableBinaryLane(['atomizer']);

      case 'physics':
        if (this.activeBackend === 'd3d11' && this.d3d11Lane?.isAvailable()) return this.d3d11Lane;
        if (this.activeBackend === 'webgpu' && this.physicsLane) return this.physicsLane;
        if (this.activeBackend === 'webgl2' && this.webgl2Lane?.isAvailable()) return this.webgl2Lane;
        if (this.activeBackend === 'opencl' && this.openclLane?.isAvailable()) return this.openclLane;
        return this.findAvailableBinaryLane(['micronaut']);

      case 'geometry':
        if (this.activeBackend === 'd3d11' && this.d3d11Lane?.isAvailable()) return this.d3d11Lane;
        if (this.activeBackend === 'webgpu' && this.geometryLane) return this.geometryLane;
        if (this.activeBackend === 'webgl2' && this.webgl2Lane?.isAvailable()) return this.webgl2Lane;
        return this.findAvailableBinaryLane(['mesh']);

      case 'compression':
        return this.findAvailableBinaryLane(['atomizer', 'linear_fold']);

      case 'reasoning':
        return this.findAvailableBinaryLane(['micronaut', 'micronaut_xjson']);

      case 'π':
        return this.findAvailableBinaryLane(['linear_fold']);

      default:
        return this.findAvailableBinaryLane(Array.from(this.binaryLanes.keys()));
    }
  }

  /**
   * Find available binary lane from list
   */
  private findAvailableBinaryLane(laneTypes: string[]): BinaryLane | null {
    for (const laneType of laneTypes) {
      for (const [id, lane] of this.binaryLanes) {
        if (id.includes(laneType) && lane.isAvailable()) {
          return lane;
        }
      }
    }
    return null;
  }

  /**
   * Check if lane is available
   */
  isLaneAvailable(laneId: string): boolean {
    const lane = this.binaryLanes.get(laneId);
    return lane ? lane.isAvailable() : false;
  }

  /**
   * Get lane status
   */
  getLaneStatus(laneId: string): LaneStatus {
    const lane = this.binaryLanes.get(laneId);
    if (!lane) {
      throw new Error(`Lane ${laneId} not found`);
    }
    return lane.getStatus();
  }

  /**
   * Get all lane statuses
   */
  getAllLaneStatuses(): Map<string, LaneStatus> {
    const statuses = new Map<string, LaneStatus>();
    
    for (const [id, lane] of this.binaryLanes) {
      statuses.set(id, lane.getStatus());
    }

    // Add GPU backend statuses
    if (this.webgl2Lane?.isAvailable()) {
      const stats = this.webgl2Lane.getStats();
      statuses.set('webgl2', { 
        id: 'webgl2', 
        available: stats.available as boolean, 
        load: 0, 
        memory: 0, 
        pending: 0, 
        lastHeartbeat: Date.now() 
      });
    }

    if (this.openclLane?.isAvailable()) {
      const stats = this.openclLane.getStats();
      statuses.set('opencl', { 
        id: 'opencl', 
        available: stats.available as boolean, 
        load: 0, 
        memory: 0, 
        pending: 0, 
        lastHeartbeat: Date.now() 
      });
    }

    if (this.d3d11Lane?.isAvailable()) {
      const stats = this.d3d11Lane.getStats();
      statuses.set('d3d11', { 
        id: 'd3d11', 
        available: stats.available as boolean, 
        load: 0, 
        memory: 0, 
        pending: 0, 
        lastHeartbeat: Date.now() 
      });
    }

    return statuses;
  }

  /**
   * Get bridge statistics
   */
  getStats() {
    const binaryStats: any = {};
    for (const [id, lane] of this.binaryLanes) {
      binaryStats[id] = lane.getStats();
    }

    return {
      activeBackend: this.activeBackend,
      binaryLanes: binaryStats,
      webgpu: {
        available: !!this.device,
        tensorReady: !!this.tensorLane,
        physicsReady: !!this.physicsLane,
        geometryReady: !!this.geometryLane
      },
      webgl2: this.webgl2Lane?.getStats() || { available: false },
      opencl: this.openclLane?.getStats() || { available: false },
      d3d11: this.d3d11Lane?.getStats() || { available: false }
    };
  }

  /**
   * Shutdown all lanes
   */
  shutdown(): void {
    console.log('⧫ Shutting down compute bridge...');
    
    for (const [, lane] of this.binaryLanes) {
      lane.killAll();
    }
    
    this.binaryLanes.clear();
    this.tensorLane = null;
    this.physicsLane = null;
    this.geometryLane = null;
    this.webgl2Lane = null;
    this.openclLane = null;
    this.d3d11Lane = null;
    this.device = null;
    this.activeBackend = 'none';
    
    console.log('  ✓ All lanes shut down');
  }
}
