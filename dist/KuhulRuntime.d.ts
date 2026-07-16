/**
 * KUHUL Runtime - Complete Fold Lifecycle
 *
 * XCFE controls the loop:
 *   while (runtime.active()) {
 *     runtime.pop();
 *   }
 *
 * Pop() internally sequences:
 *   Pop → Wo → Yax → Sek → Ch'en → Xul
 *
 * π produces SCXQ2 IR, which is compiled to backends.
 * π never knows about WebGL/OpenCL/D3D11.
 */
export interface KuhulRuntimeConfig {
    deterministic: boolean;
    replayEnabled: boolean;
    hashChain: boolean;
    maxFolds: number;
    checkpointInterval: number;
}
export interface RuntimeStats {
    totalFolds: number;
    totalPhases: number;
    averageFoldTime: number;
    hashChainLength: number;
    τBindingsCount: number;
    artifactsEmitted: number;
}
export declare class KuhulRuntime {
    private config;
    private scx2Builder;
    private active;
    private foldCount;
    private scx2Modules;
    private wgslCompiler;
    private hlslCompiler;
    private openclCompiler;
    constructor(config?: Partial<KuhulRuntimeConfig>);
    /**
     * Start runtime - XCFE loop
     *
     * while (this.active) {
     *   this.pop();  // Executes: Pop → Wo → Yax → Sek → Ch'en → Xul
     * }
     */
    start(initialState?: any): Promise<RuntimeStats>;
    /**
     * Pop() - The ONLY external entry point
     *
     * Internally sequences:
     *   Pop → Wo → Yax → Sek → Ch'en → Xul
     *
     * This is NOT a loop in π. It's the runtime invoking semantic folds.
     * XCFE controls the loop externally.
     */
    private pop;
    /**
     * Stop runtime
     */
    stop(): void;
    /**
     * Get runtime statistics
     */
    getStats(): RuntimeStats;
    /**
     * Export SCXQ2 modules
     */
    exportState(): object;
    /**
     * Check if runtime is active
     */
    isActive(): boolean;
}
