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

export class XulPhase implements Phase<XulOperation, XulResult> {
  readonly name = 'XUL';
  readonly type = 'END_MONAD';
  readonly priority = 6; // Always last
  
  private terminated = false;

  /**
   * Enter XUL phase - prepares termination
   */
  enter(ctx: PhaseContext, op: XulOperation): PhaseResult {
    if (this.terminated) {
      return {
        success: false,
        phase: this.name,
        error: 'Fold already terminated'
      };
    }
    
    return {
      success: true,
      phase: this.name,
      ready: true
    };
  }

  /**
   * Execute XUL phase - terminates fold
   */
  async execute(ctx: PhaseContext, op: XulOperation): Promise<XulResult> {
    this.terminated = true;
    ctx.world.active = false;
    
    const result: XulResult = {
      success: true,
      phase: this.name,
      terminated: true,
      foldClosed: true,
      reason: op.reason || 'normal',
      hash: ctx.hashState({ terminated: true, reason: op.reason })
    };
    
    ctx.emit('fold_terminated', {
      foldId: ctx.frame,
      reason: op.reason,
      timestamp: Date.now()
    });
    
    return result;
  }

  /**
   * Exit XUL phase - fold is closed, no further execution
   */
  exit(ctx: PhaseContext): PhaseResult {
    return {
      success: true,
      phase: this.name,
      foldSealed: true
    };
  }

  /**
   * Check if fold is terminated
   */
  isTerminated(): boolean {
    return this.terminated;
  }

  /**
   * Reset for next fold
   */
  reset() {
    this.terminated = false;
  }
}
