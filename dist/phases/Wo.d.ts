/**
 * WO Phase - World Operations & State Mutations
 *
 * The WO phase handles state transformations within the physics world.
 * It is the STATE MONAD for KUHUL-TS execution.
 *
 * Algebra: WO → (State → (Result, NewState))
 * All mutations are tracked and hashed
 */
import { Phase, PhaseResult, PhaseContext } from './Phase';
export interface WoOperation {
    op: string;
    target: string;
    value: any;
    timestamp: number;
}
export interface WoResult extends PhaseResult {
    operation: string;
    previousState: any;
    newState: any;
    delta: any;
}
export declare class WoPhase implements Phase<WoOperation, WoResult> {
    readonly name = "WO";
    readonly type = "STATE_MONAD";
    readonly priority = 2;
    private mutations;
    /**
     * Enter WO phase - validates state mutation
     */
    enter(ctx: PhaseContext, op: WoOperation): PhaseResult;
    /**
     * Execute WO phase - applies state mutations
     */
    execute(ctx: PhaseContext, op: WoOperation): Promise<WoResult>;
    /**
     * Exit WO phase - commits mutations and clears buffer
     */
    exit(ctx: PhaseContext): PhaseResult;
    /**
     * Get state at path (e.g., 'world.bodies[0].position')
     */
    private getStateAtPath;
    /**
     * Set state at path
     */
    private setStateAtPath;
    /**
     * Compute delta between states
     */
    private computeDelta;
    /**
     * Get mutation history for path
     */
    getMutationHistory(path: string): Array<{
        frame: number;
        before: any;
        after: any;
    }>;
}
