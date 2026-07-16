/**
 * KUHUL State Bridge - Fold N → Fold N+1 Handoff
 *
 * Manages persistent state transfer between folds.
 * This is the CRITICAL PATH for physics evolution and temporal continuity.
 *
 * Architecture:
 *   Fold N (Ch'en) → StateDelta[] → Bridge → Fold N+1 (Wo)
 *
 * The bridge ensures:
 *   1. Hash chain continuity (cryptographic linking)
 *   2. τ-binding persistence (temporal state)
 *   3. World state evolution (physics continuity)
 *   4. Artifact verification (integrity checking)
 */
import { FoldArtifact } from './Chen';
import { PhaseContext } from './Phase';
export interface StateBridgeConfig {
    verifyHashes: boolean;
    compressDeltas: boolean;
    maxHistoryFrames: number;
}
export interface BridgeState {
    currentFold: number;
    previousArtifact: FoldArtifact | null;
    hashChain: string[];
    τPersistence: Map<string, any[]>;
    worldHistory: any[];
}
export declare class StateBridge {
    private config;
    private state;
    constructor(config?: Partial<StateBridgeConfig>);
    /**
     * Transfer state from Fold N artifact to Fold N+1 context
     *
     * This is the CORE handoff mechanism - called between every fold
     */
    transferState(artifact: FoldArtifact, ctx: PhaseContext): PhaseContext;
    /**
     * Verify artifact hash integrity
     */
    private verifyArtifactHash;
    /**
     * Verify hash chain continuity
     */
    private verifyHashChain;
    /**
     * Get τ-binding history for analysis/replay
     */
    getτHistory(key: string): Array<{
        fold: number;
        value: any;
        hash: string;
    }>;
    /**
     * Get world state at specific fold (for replay)
     */
    getWorldAtFold(fold: number): any;
    /**
     * Get full hash chain (for verification)
     */
    getHashChain(): string[];
    /**
     * Replay from specific fold
     */
    replayFromFold(fold: number, ctx: PhaseContext): PhaseContext;
    /**
     * Export state for persistence
     */
    exportState(): object;
    /**
     * Import state for restoration
     */
    importState(exported: any, ctx: PhaseContext): void;
    /**
     * Get bridge statistics
     */
    getStats(): {
        currentFold: number;
        hashChainLength: number;
        τBindingsTracked: number;
        worldHistoryFrames: number;
        previousArtifactHash: string;
    };
}
