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

export class YaxPhase implements Phase<YaxOperation, YaxResult> {
  readonly name = 'YAX';
  readonly type = 'CONTROL_MONAD';
  readonly priority = 4; // Same as CHEN, before POP
  
  private branchLog: Array<{condition: boolean, selected: string}> = [];

  /**
   * Enter YAX phase - evaluates condition deterministically
   */
  enter(ctx: PhaseContext, op: YaxOperation): PhaseResult {
    // Condition must be pure (no side effects)
    // Both branches are prepared but not executed
    
    return {
      success: true,
      phase: this.name,
      condition: op.condition,
      branchesReady: true
    };
  }

  /**
   * Execute YAX phase - selects branch deterministically
   */
  async execute(ctx: PhaseContext, op: YaxOperation): Promise<YaxResult> {
    const selected = op.condition ? 'true' : 'false';
    
    this.branchLog.push({
      condition: op.condition,
      selected
    });
    
    const result: YaxResult = {
      success: true,
      phase: this.name,
      selected: selected as 'true' | 'false',
      condition: op.condition,
      isDeterministic: true,
      hash: ctx.hashState({ condition: op.condition, selected })
    };
    
    ctx.emit('branch_selected', {
      selected,
      frame: ctx.frame
    });
    
    return result;
  }

  /**
   * Exit YAX phase - clears branch buffer
   */
  exit(ctx: PhaseContext): PhaseResult {
    const count = this.branchLog.length;
    this.branchLog = [];
    
    return {
      success: true,
      phase: this.name,
      branchesEvaluated: count
    };
  }

  /**
   * Get branch history for analysis
   */
  getBranchHistory(): Array<{frame: number, condition: boolean, selected: string}> {
    // Would maintain full history
    return [];
  }
}
