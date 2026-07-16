/**
 * POP Phase - Return Values & Result Extraction
 *
 * The POP phase handles value extraction from the computation monad.
 * It is the RETURN operation in the KUHUL algebra.
 *
 * Algebra: POP(value) → M(value)
 * Pure: No side effects, only value wrapping
 */
import { Phase, PhaseResult, PhaseContext } from './Phase';
export interface PopOperation {
    value: any;
    type?: string;
    timestamp: number;
}
export interface PopResult extends PhaseResult {
    value: any;
    type: string;
    isPure: true;
}
export declare class PopPhase implements Phase<PopOperation, PopResult> {
    readonly name = "POP";
    readonly type = "RETURN_MONAD";
    readonly priority = 5;
    private returnValues;
    /**
     * Enter POP phase - wraps value in monadic context
     */
    enter(ctx: PhaseContext, op: PopOperation): PhaseResult;
    /**
     * Execute POP phase - extracts and returns value
     */
    execute(ctx: PhaseContext, op: PopOperation): Promise<PopResult>;
    /**
     * Exit POP phase - clears return buffer
     */
    exit(ctx: PhaseContext): PhaseResult;
    /**
     * Get last returned value
     */
    getLastValue(): any;
    /**
     * Get all return values for this frame
     */
    getReturnValues(): any[];
}
