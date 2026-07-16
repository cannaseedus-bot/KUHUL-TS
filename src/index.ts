/**
 * KUHUL TypeScript - Public API
 * 
 * TypeScript syntax with KUHUL deterministic semantics
 */

// Runtime
export { KuhulRuntime } from './KuhulRuntime';
export type { KuhulRuntimeConfig, RuntimeStats } from './KuhulRuntime';

// Phase system
export * from './phases/index';

// Compiler
export { KUHULTypeScriptCompiler } from './compiler';
export type { KUHULCompileOptions, KUHULProgram } from './compiler';

// Type declarations for KUHUL-TS syntax
declare global {
  /**
   * π-binding: Immutable, deterministic value
   * Tracked in state hash, cannot be mutated
   */
  function π<T>(value: T): T;
  
  /**
   * τ-binding: Temporal value that persists across folds
   * Changes are tracked in history for replay
   */
  function τ<T>(value: T): T;
  
  /**
   * SEK glyph: Side effects and knowledge operations
   * All IO goes through SEK
   */
  function Sek(op: string, ...args: any[]): Generator<any>;
  
  /**
   * POP glyph: Return values from computation
   * Extracts result from monadic context
   */
  function Pop<T>(value: T): Generator<T>;
  
  /**
   * WO glyph: World operations and state mutations
   * All state changes go through WO
   */
  function Wo(op: string, target: string, value: any): Generator<any>;
  
  /**
   * YAX glyph: Conditional branching
   * Deterministic control flow
   */
  function Yax(condition: boolean, trueBranch: any, falseBranch?: any): Generator<any>;
  
  /**
   * CH'EN glyph: Collapse and emit artifact
   * Ends fold execution, produces artifact
   */
  function Chen(options: any): Generator<any>;
  
  /**
   * XUL glyph: Terminate fold
   * Closes computation box
   */
  function Xul(reason?: string): Generator<any>;
}

// Runtime function implementations (for type checking)
function π<T>(value: T): T {
  return Object.freeze(value);
}

function τ<T>(value: T): T {
  return value;
}

function* Sek(op: string, ...args: any[]): Generator<any> {
  yield { glyph: 'Sek', op, args };
}

function* Pop<T>(value: T): Generator<T> {
  yield { glyph: 'Pop', value };
  return value;
}

function* Wo(op: string, target: string, value: any): Generator<any> {
  yield { glyph: 'Wo', op, target, value };
}

function* Yax(condition: boolean, trueBranch: any, falseBranch?: any): Generator<any> {
  yield { glyph: 'Yax', condition, trueBranch, falseBranch };
  return condition ? trueBranch : (falseBranch ?? null);
}

function* Chen(options: any): Generator<any> {
  yield { glyph: 'Chen', options };
}

function* Xul(reason?: string): Generator<any> {
  yield { glyph: 'Xul', reason };
}

// Export glyph functions for use in KUHUL-TS code
export { π, τ, Sek, Pop, Wo, Yax, Chen, Xul };
