/**
 * KUHUL TypeScript - Public API
 *
 * TypeScript syntax with KUHUL deterministic semantics
 */
export { KuhulRuntime } from './KuhulRuntime';
export type { KuhulRuntimeConfig, RuntimeStats } from './KuhulRuntime';
export * from './phases/index';
export { KUHULTypeScriptCompiler } from './compiler';
export type { KUHULCompileOptions, KUHULProgram } from './compiler';
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
declare function π<T>(value: T): T;
declare function τ<T>(value: T): T;
declare function Sek(op: string, ...args: any[]): Generator<any>;
declare function Pop<T>(value: T): Generator<T>;
declare function Wo(op: string, target: string, value: any): Generator<any>;
declare function Yax(condition: boolean, trueBranch: any, falseBranch?: any): Generator<any>;
declare function Chen(options: any): Generator<any>;
declare function Xul(reason?: string): Generator<any>;
export { π, τ, Sek, Pop, Wo, Yax, Chen, Xul };
