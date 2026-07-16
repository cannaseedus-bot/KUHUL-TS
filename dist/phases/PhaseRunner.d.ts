/**
 * KUHUL Phase Runner - Deterministic Phase Sequencer
 *
 * Orchestrates phase execution in strict algebraic order.
 * Ensures phases don't compete - they compose sequentially.
 *
 * Execution Order:
 *   1. SEK (IO effects)
 *   2. WO (State mutations)
 *   3. Ch'en (Read operations)
 *   4. Yax (Conditionals)
 *   5. Pop (Return values)
 *   6. Xul (Termination)
 */
import { Phase, PhaseResult } from './Phase';
export interface GlyphCall {
    glyph: string;
    args: any[];
    id?: number;
}
export interface PhaseRunnerConfig {
    deterministic: boolean;
    replayEnabled: boolean;
    hashChain: boolean;
}
export declare class PhaseRunner {
    private phases;
    private executionOrder;
    private frame;
    private hashChain;
    private context;
    private eventHandlers;
    constructor(config?: PhaseRunnerConfig);
    /**
     * Register a phase
     */
    registerPhase(phase: Phase<any, any>): void;
    /**
     * Execute a single glyph call through its phase
     */
    executeGlyph(glyph: string, args: any[]): Promise<PhaseResult>;
    /**
     * Execute a sequence of glyph calls (deterministic order)
     */
    executeSequence(calls: GlyphCall[]): Promise<PhaseResult[]>;
    /**
     * Get phase for glyph type
     */
    private getPhaseForGlyph;
    /**
     * Create operation object for phase
     */
    private createOperation;
    /**
     * Hash state for determinism
     */
    private hashState;
    /**
     * Event handler registration
     */
    on(event: string, handler: Function): void;
    private onEvent;
    /**
     * Get current frame
     */
    getFrame(): number;
    /**
     * Get hash chain
     */
    getHashChain(): string[];
    /**
     * Get phase statistics
     */
    getPhaseStats(): Record<string, any>;
    /**
     * Reset runner for new execution
     */
    reset(): void;
}
