/**
 * KUHUL Phase System - Public API
 *
 * Export all phases and runtime components
 */
export { Phase, PhaseContext, PhaseResult } from './Phase';
export { SekPhase } from './Sek';
export { PopPhase } from './Pop';
export { WoPhase } from './Wo';
export { ChenPhase, FoldArtifact, StateDelta } from './Chen';
export { YaxPhase } from './Yax';
export { XulPhase } from './Xul';
export { PhaseRunner, GlyphCall } from './PhaseRunner';
export { StateBridge, BridgeState } from './StateBridge';
export declare class PhaseRegistry {
    private static instance;
    private phases;
    private constructor();
    static getInstance(): PhaseRegistry;
    register(name: string, phase: any): void;
    get(name: string): any;
    getAll(): any[];
    private registerDefaults;
}
