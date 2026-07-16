/**
 * Hybrid Compute Bridge - Combines Binary Lanes + WebGPU Lanes
 *
 * Routes operations to the best backend:
 * - WebGPU for tensor/physics/geometry (GPU acceleration)
 * - Binary executables for atomizer/mesh/linear_fold/micronaut
 */
import { ComputeBridge } from '../core/compute-bridge';
export interface HybridBridgeConfig {
    binaryDir: string;
    useWebGPU: boolean;
    useWebGL2: boolean;
    useOpenCL: boolean;
    useD3D11: boolean;
    defaultTimeout: number;
    preferBackend: 'webgpu' | 'webgl2' | 'opencl' | 'd3d11' | 'auto';
}
export declare class HybridComputeBridge implements ComputeBridge {
    private binaryLanes;
    private tensorLane;
    private physicsLane;
    private geometryLane;
    private webgl2Lane;
    private openclLane;
    private d3d11Lane;
    private config;
    private device;
    private activeBackend;
    constructor(config?: Partial<HybridBridgeConfig>);
    /**
     * Initialize binary lanes for existing executables
     */
    private initializeBinaryLanes;
    /**
     * Initialize all GPU backends
     */
    private initializeGPUBackends;
    /**
     * Initialize WebGL2 lane
     */
    private initializeWebGL2;
    /**
     * Initialize OpenCL lane
     */
    private initializeOpenCL;
    /**
     * Initialize D3D11 lane
     */
    private initializeD3D11;
    if(: any, navigator: any): any;
}
