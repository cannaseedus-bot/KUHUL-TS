/**
 * KUHUL Phase System - Public API
 * 
 * Export all phases and runtime components
 */

// Core interfaces
export { Phase, PhaseContext, PhaseResult } from './Phase';

// Phase modules
export { SekPhase } from './Sek';
export { PopPhase } from './Pop';
export { WoPhase } from './Wo';
export { ChenPhase, FoldArtifact, StateDelta } from './Chen';
export { YaxPhase } from './Yax';
export { XulPhase } from './Xul';

// Phase runner & state bridge
export { PhaseRunner, GlyphCall } from './PhaseRunner';
export { StateBridge, BridgeState } from './StateBridge';

// Phase registry
export class PhaseRegistry {
  private static instance: PhaseRegistry;
  private phases: Map<string, any> = new Map();
  
  private constructor() {
    this.registerDefaults();
  }
  
  static getInstance(): PhaseRegistry {
    if (!PhaseRegistry.instance) {
      PhaseRegistry.instance = new PhaseRegistry();
    }
    return PhaseRegistry.instance;
  }
  
  register(name: string, phase: any): void {
    this.phases.set(name, phase);
  }
  
  get(name: string): any {
    return this.phases.get(name);
  }
  
  getAll(): any[] {
    return Array.from(this.phases.values());
  }
  
  private registerDefaults(): void {
    this.register('Sek', SekPhase);
    this.register('Pop', PopPhase);
    this.register('Wo', WoPhase);
    this.register('Chen', ChenPhase);
    this.register('Yax', YaxPhase);
    this.register('Xul', XulPhase);
  }
}
