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

export class PopPhase implements Phase<PopOperation, PopResult> {
  readonly name = 'POP';
  readonly type = 'RETURN_MONAD';
  readonly priority = 5; // Last to execute (after all effects)
  
  private returnValues: any[] = [];

  /**
   * Enter POP phase - wraps value in monadic context
   */
  enter(ctx: PhaseContext, op: PopOperation): PhaseResult {
    const wrapped = {
      value: op.value,
      type: op.type || typeof op.value,
      frame: ctx.frame,
      isPure: true
    };
    
    this.returnValues.push(wrapped);
    
    return {
      success: true,
      phase: this.name,
      wrapped: true
    };
  }

  /**
   * Execute POP phase - extracts and returns value
   */
  async execute(ctx: PhaseContext, op: PopOperation): Promise<PopResult> {
    const result: PopResult = {
      success: true,
      phase: this.name,
      value: op.value,
      type: op.type || typeof op.value,
      isPure: true,
      hash: ctx.hashState({ value: op.value })
    };
    
    ctx.emit('pop_executed', {
      value: op.value,
      frame: ctx.frame
    });
    
    return result;
  }

  /**
   * Exit POP phase - clears return buffer
   */
  exit(ctx: PhaseContext): PhaseResult {
    const count = this.returnValues.length;
    this.returnValues = [];
    
    return {
      success: true,
      phase: this.name,
      valuesReturned: count
    };
  }

  /**
   * Get last returned value
   */
  getLastValue(): any {
    return this.returnValues[this.returnValues.length - 1];
  }

  /**
   * Get all return values for this frame
   */
  getReturnValues(): any[] {
    return [...this.returnValues];
  }
}
