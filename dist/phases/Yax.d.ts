/**
 * YAX Phase - Conditional Branching
 *
 * The YAX phase handles deterministic conditional execution.
 * It is the CONTROL FLOW monad for KUHUL-TS.
 *
 * Algebra: YAX → (Condition × Branch) → SelectedBranch
 * Both branches are evaluated, one is selected (deterministic)
 */
import { Phase, PhaseResult, PhaseContext } from './Phase';
export interface YaxOperation {
    condition: boolean;
    trueBranch: string;
    falseBranch?: string;
    timestamp: number;
}
export interface YaxResult extends PhaseResult {
    selected: 'true' | 'false';
    condition: boolean;
    isDeterministic: true;
}
export declare class YaxPhase implements Phase<YaxOperation, YaxResult> {
    readonly name = "YAX";
    readonly type = "CONTROL_MONAD";
    readonly priority = 4;
    private branchLog;
    /**
     * Enter YAX phase - evaluates condition deterministically
     */
    enter(ctx: PhaseContext, op: YaxOperation): PhaseResult;
    /**
     * Execute YAX phase - selects branch deterministically
     */
    execute(ctx: PhaseContext, op: YaxOperation): Promise<YaxResult>;
    /**
     * Exit YAX phase - clears branch buffer
     */
    exit(ctx: PhaseContext): PhaseResult;
    /**
     * Get branch history for analysis
     */
    getBranchHistory(): Array<{
        frame: number;
        condition: boolean;
        selected: string;
    }>;
}
