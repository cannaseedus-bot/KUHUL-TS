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

import { Phase, PhaseContext, PhaseResult } from './Phase';
import { SekPhase } from './Sek';
import { PopPhase } from './Pop';
import { WoPhase } from './Wo';
// Import other phases as they're created
// import { ChenPhase } from './Chen';
// import { YaxPhase } from './Yax';
// import { XulPhase } from './Xul';

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

export class PhaseRunner {
  private phases: Map<string, Phase<any, any>> = new Map();
  private executionOrder: string[] = [];
  private frame: number = 0;
  private hashChain: string[] = [];
  
  private context: PhaseContext = {
    frame: 0,
    π: new Map(),
    τ: new Map(),
    τHistory: new Map(),
    world: { bodies: [], fields: [], active: true },
    hashChain: [],
    replayEnabled: true,
    deterministic: true,
    emit: (event: string, data: any) => this.onEvent(event, data),
    hashState: (state: any) => this.hashState(state)
  };
  
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(config: PhaseRunnerConfig = {}) {
    // Register phases in execution order
    this.registerPhase(new SekPhase());      // Priority 1
    this.registerPhase(new WoPhase());       // Priority 2
    // this.registerPhase(new ChenPhase());  // Priority 3
    // this.registerPhase(new YaxPhase());   // Priority 4
    this.registerPhase(new PopPhase());      // Priority 5
    // this.registerPhase(new XulPhase());   // Priority 6
    
    // Sort by priority
    this.executionOrder = Array.from(this.phases.keys())
      .sort((a, b) => 
        (this.phases.get(a)!.priority) - (this.phases.get(b)!.priority)
      );
    
    console.log('⧫ PhaseRunner initialized');
    console.log(`  Execution order: ${this.executionOrder.join(' → ')}`);
  }

  /**
   * Register a phase
   */
  registerPhase(phase: Phase<any, any>) {
    this.phases.set(phase.name, phase);
    console.log(`  Registered phase: ${phase.name} (${phase.type})`);
  }

  /**
   * Execute a single glyph call through its phase
   */
  async executeGlyph(glyph: string, args: any[]): Promise<PhaseResult> {
    const phase = this.getPhaseForGlyph(glyph);
    
    if (!phase) {
      return {
        success: false,
        error: `No phase registered for glyph: ${glyph}`
      };
    }
    
    const op = this.createOperation(glyph, args);
    
    // Phase sequence: ENTER → EXECUTE → EXIT
    const enterResult = phase.enter(this.context, op);
    
    if (!enterResult.success) {
      return enterResult;
    }
    
    const executeResult = await phase.execute(this.context, op);
    
    const exitResult = phase.exit(this.context);
    
    // Hash the complete phase execution
    if (executeResult.success) {
      const frameHash = this.hashState({
        frame: this.frame,
        phase: phase.name,
        glyph,
        args,
        result: executeResult
      });
      
      this.hashChain.push(frameHash);
      this.context.hashChain = this.hashChain;
    }
    
    // Advance frame after complete phase sequence
    this.frame++;
    this.context.frame = this.frame;
    
    return executeResult;
  }

  /**
   * Execute a sequence of glyph calls (deterministic order)
   */
  async executeSequence(calls: GlyphCall[]): Promise<PhaseResult[]> {
    const results: PhaseResult[] = [];
    
    for (const call of calls) {
      const result = await this.executeGlyph(call.glyph, call.args);
      results.push(result);
      
      if (!result.success) {
        console.error(`Phase execution failed: ${call.glyph}`, result.error);
        break;
      }
    }
    
    return results;
  }

  /**
   * Get phase for glyph type
   */
  private getPhaseForGlyph(glyph: string): Phase<any, any> | null {
    const glyphPhaseMap: Record<string, string> = {
      'Sek': 'SEK',
      'Pop': 'POP',
      'Wo': 'WO',
      'Ch\'en': 'CHEN',
      'Yax': 'YAX',
      'Xul': 'XUL'
    };
    
    const phaseName = glyphPhaseMap[glyph];
    return phaseName ? this.phases.get(phaseName) || null : null;
  }

  /**
   * Create operation object for phase
   */
  private createOperation(glyph: string, args: any[]): any {
    switch (glyph) {
      case 'Sek':
        return { op: args[0], args: args.slice(1), timestamp: Date.now() };
      case 'Pop':
        return { value: args[0], timestamp: Date.now() };
      case 'Wo':
        return { op: args[0], target: args[1], value: args[2], timestamp: Date.now() };
      default:
        return { args, timestamp: Date.now() };
    }
  }

  /**
   * Hash state for determinism
   */
  private hashState(state: any): string {
    const str = JSON.stringify(state);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Event handler registration
   */
  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  private onEvent(event: string, data: any) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  /**
   * Get current frame
   */
  getFrame(): number {
    return this.frame;
  }

  /**
   * Get hash chain
   */
  getHashChain(): string[] {
    return [...this.hashChain];
  }

  /**
   * Get phase statistics
   */
  getPhaseStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [name, phase] of this.phases.entries()) {
      if (phase instanceof SekPhase) {
        stats[name] = phase.getStats();
      }
      // Add stats for other phases
    }
    
    return stats;
  }

  /**
   * Reset runner for new execution
   */
  reset() {
    this.frame = 0;
    this.hashChain = [];
    this.context.frame = 0;
    this.context.hashChain = [];
    this.context.τ.forEach((_, key) => {
      this.context.τHistory.set(key, []);
    });
  }
}
