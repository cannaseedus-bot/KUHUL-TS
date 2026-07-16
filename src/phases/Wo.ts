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
  target: string;  // State path (e.g., 'world.bodies[0].position')
  value: any;
  timestamp: number;
}

export interface WoResult extends PhaseResult {
  operation: string;
  previousState: any;
  newState: any;
  delta: any;
}

export class WoPhase implements Phase<WoOperation, WoResult> {
  readonly name = 'WO';
  readonly type = 'STATE_MONAD';
  readonly priority = 2; // After SEK, before temporal
  
  private mutations: Array<{path: string, before: any, after: any}> = [];

  /**
   * Enter WO phase - validates state mutation
   */
  enter(ctx: PhaseContext, op: WoOperation): PhaseResult {
    // Get current state at path
    const currentState = this.getStateAtPath(ctx, op.target);
    
    // Validate mutation (no π-binding mutations allowed)
    if (op.target.startsWith('π.')) {
      return {
        success: false,
        phase: this.name,
        error: 'Cannot mutate π-bindings (immutable)'
      };
    }
    
    // Queue mutation
    this.mutations.push({
      path: op.target,
      before: currentState,
      after: op.value
    });
    
    return {
      success: true,
      phase: this.name,
      queued: true
    };
  }

  /**
   * Execute WO phase - applies state mutations
   */
  async execute(ctx: PhaseContext, op: WoOperation): Promise<WoResult> {
    const previousState = this.getStateAtPath(ctx, op.target);
    
    // Apply mutation
    this.setStateAtPath(ctx, op.target, op.value);
    
    const newState = this.getStateAtPath(ctx, op.target);
    const delta = this.computeDelta(previousState, newState);
    
    const result: WoResult = {
      success: true,
      phase: this.name,
      operation: op.op,
      previousState,
      newState,
      delta,
      hash: ctx.hashState({ path: op.target, before: previousState, after: newState })
    };
    
    ctx.emit('state_mutated', {
      path: op.target,
      delta,
      frame: ctx.frame
    });
    
    return result;
  }

  /**
   * Exit WO phase - commits mutations and clears buffer
   */
  exit(ctx: PhaseContext): PhaseResult {
    const count = this.mutations.length;
    
    // Hash all mutations for this frame
    const mutationHash = ctx.hashState(this.mutations);
    
    this.mutations = [];
    
    return {
      success: true,
      phase: this.name,
      mutationsCommitted: count,
      hash: mutationHash
    };
  }

  /**
   * Get state at path (e.g., 'world.bodies[0].position')
   */
  private getStateAtPath(ctx: PhaseContext, path: string): any {
    const parts = path.split(/\.|\[|\]/).filter(Boolean);
    let current: any = ctx;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  /**
   * Set state at path
   */
  private setStateAtPath(ctx: PhaseContext, path: string, value: any) {
    const parts = path.split(/\.|\[|\]/).filter(Boolean);
    const lastPart = parts.pop()!;
    
    let current: any = ctx;
    for (const part of parts) {
      current = current[part];
    }
    
    current[lastPart] = value;
  }

  /**
   * Compute delta between states
   */
  private computeDelta(before: any, after: any): any {
    if (typeof before === 'number' && typeof after === 'number') {
      return after - before;
    }
    if (Array.isArray(before) && Array.isArray(after)) {
      return after.map((v, i) => v - (before[i] || 0));
    }
    return { from: before, to: after };
  }

  /**
   * Get mutation history for path
   */
  getMutationHistory(path: string): Array<{frame: number, before: any, after: any}> {
    // Would be implemented with full history tracking
    return [];
  }
}
