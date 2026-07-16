/**
 * XUL Phase - Termination & Fold Closure
 *
 * The XUL phase terminates fold execution and seals the artifact.
 * It is the END monad that closes the computation box.
 *
 * Algebra: XUL → End
 * No further computation after XUL in this fold
 */
import { Phase, PhaseResult, PhaseContext } from './Phase';
export interface XulOperation {
    reason?: string;
    timestamp: number;
}
export interface XulResult extends PhaseResult {
    terminated: true;
    foldClosed: true;
    reason?: string;
}
export declare class XulPhase implements Phase<XulOperation, XulResult> {
    readonly name = "XUL";
    readonly type = "END_MONAD";
    readonly priority = 6;
    private terminated;
    /**
     * Enter XUL phase - prepares termination
     */
    enter(ctx: PhaseContext, op: XulOperation): PhaseResult;
    /**
     * Execute XUL phase - terminates fold
     */
    execute(ctx: PhaseContext, op: XulOperation): Promise<XulResult>;
    /**
     * Exit XUL phase - fold is closed, no further execution
     */
    exit(ctx: PhaseContext): PhaseResult;
    /**
     * Check if fold is terminated
     */
    isTerminated(): boolean;
    /**
     * Reset for next fold
     */
    reset(): void;
}
