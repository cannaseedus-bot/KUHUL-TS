/**
 * CH'EN Phase - Collapse & Emit
 *
 * The CH'EN phase collapses the computation into an artifact
 * and emits state deltas for the next fold.
 *
 * Algebra: CH'EN → (State × Hash) → Artifact
 * This is the BRIDGE between Fold N and Fold N+1
 */
import { Phase, PhaseResult, PhaseContext } from './Phase';
export interface StateDelta {
    path: string;
    before: any;
    after: any;
    hash: string;
}
export interface FoldArtifact {
    foldId: number;
    timestamp: number;
    stateHash: string;
    previousHash: string;
    deltas: StateDelta[];
    τSnapshot: Map<string, any>;
    worldSnapshot: any;
    sideEffects: string[];
}
export interface ChenOperation {
    emitArtifact: boolean;
    includeDeltas: boolean;
    compress: boolean;
}
export interface ChenResult extends PhaseResult {
    artifact: FoldArtifact;
    isSealed: true;
    nextFoldReady: boolean;
}
export declare class ChenPhase implements Phase<ChenOperation, ChenResult> {
    readonly name = "CHEN";
    readonly type = "COLLAPSE_MONAD";
    readonly priority = 4;
    private currentArtifact;
    private previousHash;
    private deltaLog;
    /**
     * Enter CH'EN phase - prepares artifact emission
     */
    enter(ctx: PhaseContext, op: ChenOperation): PhaseResult;
    /**
     * Execute CH'EN phase - collapses computation into artifact
     */
    execute(ctx: PhaseContext, op: ChenOperation): Promise<ChenResult>;
    /**
     * Exit CH'EN phase - prepares state for next fold
     */
    exit(ctx: PhaseContext): PhaseResult;
    /**
     * Compute state deltas between frames
     */
    private computeStateDeltas;
    /**
     * Apply deltas to prepare next fold's initial state
     */
    private applyDeltasForNextFold;
    /**
     * Collect side effects from all phases
     */
    private collectSideEffects;
    /**
     * Get current artifact (for inspection)
     */
    getCurrentArtifact(): FoldArtifact | null;
    /**
     * Get hash chain (for verification)
     */
    getHashChain(): string[];
    /**
     * Verify artifact integrity
     */
    verifyArtifact(artifact: FoldArtifact, ctx: PhaseContext): boolean;
    /**
     * Replay from artifact (for deterministic replay)
     */
    replayFromArtifact(artifact: FoldArtifact, ctx: PhaseContext): void;
}
