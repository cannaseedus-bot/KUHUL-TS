/**
 * KUHUL Phase System - Base Interfaces
 * 
 * Defines the algebraic structure for all KUHUL phases.
 * Each phase is a monadic computation with enter, execute, and exit.
 */

export interface PhaseContext {
  frame: number;
  π: Map<string, any>;      // Immutable bindings
  τ: Map<string, any>;      // Temporal bindings
  τHistory: Map<string, any[]>;
  world: any;
  hashChain: string[];
  replayEnabled: boolean;
  deterministic: boolean;
  
  // Event emission
  emit(event: string, data: any): void;
  
  // State hashing
  hashState(state: any): string;
}

export interface PhaseResult {
  success: boolean;
  phase: string;
  error?: string;
  hash?: string;
  cached?: boolean;
  queued?: boolean;
  wrapped?: boolean;
  [key: string]: any;
}

export interface Phase<Op, Result extends PhaseResult> {
  readonly name: string;
  readonly type: string;    // MONAD type (IO, STATE, RETURN, etc.)
  readonly priority: number; // Execution order
  
  /**
   * Enter phase - validates and prepares operation
   */
  enter(ctx: PhaseContext, op: Op): PhaseResult;
  
  /**
   * Execute phase - performs the computation
   */
  execute(ctx: PhaseContext, op: Op): Promise<Result>;
  
  /**
   * Exit phase - cleans up and commits results
   */
  exit(ctx: PhaseContext): PhaseResult;
}
