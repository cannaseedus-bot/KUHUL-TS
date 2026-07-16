/**
 * SEK Phase - Side Effects & Knowledge
 *
 * The SEK phase handles all side effects, external operations, and knowledge queries.
 * It is the primary IO monad for KUHUL-TS execution.
 *
 * Algebra: SEK → (Operation × Args) → Result
 * Sequencing: SEK₁ ; SEK₂ (deterministic order)
 */
import { Phase, PhaseResult, PhaseContext } from './Phase';
export interface SekOperation {
    op: string;
    args: any[];
    timestamp: number;
    hash?: string;
}
export interface SekResult extends PhaseResult {
    operation: string;
    result: any;
    sideEffects: string[];
}
export declare class SekPhase implements Phase<SekOperation, SekResult> {
    readonly name = "SEK";
    readonly type = "IO_MONAD";
    readonly priority = 1;
    private operationLog;
    private resultCache;
    /**
     * Enter SEK phase - validates and queues operation
     */
    enter(ctx: PhaseContext, op: SekOperation): PhaseResult;
    /**
     * Execute SEK phase - processes all queued operations
     */
    execute(ctx: PhaseContext, op: SekOperation): Promise<SekResult>;
    /**
     * Exit SEK phase - cleans up and prepares for next phase
     */
    exit(ctx: PhaseContext): PhaseResult;
    /**
     * Dispatch operation to handler
     */
    private dispatch;
    private handleLog;
    private handleAddBody;
    private handleUpdatePhysics;
    private handleHashState;
    private handleAddField;
    private handleExecBinary;
    private handleRenderFrame;
    /**
     * Validate operation against SEK algebra
     */
    private validateOperation;
    /**
     * Hash operation for determinism
     */
    private hashOperation;
    /**
     * Track side effects for dependency analysis
     */
    private getSideEffects;
    /**
     * Get phase statistics
     */
    getStats(): {
        phase: string;
        operationsLogged: number;
        cacheSize: number;
    };
}
