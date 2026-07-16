/**
 * Binary Lane - Spawns native executables (atomizer, mesh, linear_fold, micronaut)
 *
 * This lane bridges KUHUL-TS to your existing C++ binaries
 */
import { ComputeOperation, ComputeResult, LaneStatus } from '../core/compute-bridge';
export interface BinaryLaneConfig {
    id: string;
    type: 'atomizer' | 'mesh' | 'linear_fold' | 'micronaut' | 'micronaut_xjson' | 'moe_gguf';
    executable: string;
    workingDir: string;
    maxConcurrent: number;
    timeout: number;
}
export declare class BinaryLane {
    id: string;
    type: string;
    private executable;
    private workingDir;
    private maxConcurrent;
    private timeout;
    private runningProcesses;
    private pendingOperations;
    private lastHeartbeat;
    private totalExecutions;
    constructor(config: BinaryLaneConfig);
    /**
     * Check if lane can accept more work
     */
    isAvailable(): boolean;
    /**
     * Get current load
     */
    getLoad(): number;
    /**
     * Get lane status
     */
    getStatus(): LaneStatus;
    /**
     * Execute binary operation
     */
    execute(operation: ComputeOperation): Promise<ComputeResult>;
    /**
     * Build command line arguments based on operation type
     */
    private buildArgs;
    /**
     * Atomizer.exe arguments
     */
    private buildAtomizerArgs;
    /**
     * Mesh.exe arguments
     */
    private buildMeshArgs;
    /**
     * Linear_fold.exe arguments
     */
    private buildLinearFoldArgs;
    /**
     * Micronaut.exe arguments
     */
    private buildMicronautArgs;
    /**
     * Micronaut_xjson.exe arguments
     */
    private buildMicronautXJSONArgs;
    /**
     * Moe_gguf_runtime.exe arguments
     */
    private buildMoEGGUFArgs;
    /**
     * Parse binary output
     */
    private parseOutput;
    private parseAtomizerOutput;
    private parseMeshOutput;
    private parseLinearFoldOutput;
    private parseDotBracket;
    private parseMicronautOutput;
    private parseMicronautXJSONOutput;
    private parseMoEGGUFOutput;
    /**
     * Generate π-hash for result
     */
    private generateπHash;
    /**
     * Kill all running processes
     */
    killAll(): void;
    /**
     * Get statistics
     */
    getStats(): {
        id: string;
        type: string;
        running: number;
        pending: number;
        totalExecutions: number;
        maxConcurrent: number;
    };
}
