/**
 * SEK Phase - Side Effects & Knowledge
 * 
 * The SEK phase handles all side effects, external operations, and knowledge queries.
 * It is the primary IO monad for KUHUL-TS execution.
 * 
 * Algebra: SEK → (Operation × Args) → Result
 * Sequencing: SEK₁ ; SEK₂ (deterministic order)
 */

import { Phase, PhaseResult, PhaseContext } from './Phase';

export interface SekOperation {
  op: string;
  args: any[];
  timestamp: number;
  hash?: string;
}

export interface SekResult extends PhaseResult {
  operation: string;
  result: any;
  sideEffects: string[];
}

export class SekPhase implements Phase<SekOperation, SekResult> {
  readonly name = 'SEK';
  readonly type = 'IO_MONAD';
  readonly priority = 1; // First to execute
  
  private operationLog: SekOperation[] = [];
  private resultCache = new Map<number, any>();

  /**
   * Enter SEK phase - validates and queues operation
   */
  enter(ctx: PhaseContext, op: SekOperation): PhaseResult {
    // Hash the operation for determinism
    const hash = this.hashOperation(op);
    op.hash = hash;
    
    // Check if already executed (replay optimization)
    if (ctx.replayEnabled && this.resultCache.has(ctx.frame)) {
      return {
        success: true,
        phase: this.name,
        cached: true,
        result: this.resultCache.get(ctx.frame)
      };
    }
    
    // Validate operation
    const valid = this.validateOperation(op);
    if (!valid) {
      return {
        success: false,
        phase: this.name,
        error: `Invalid SEK operation: ${op.op}`
      };
    }
    
    // Queue for execution
    this.operationLog.push(op);
    
    return {
      success: true,
      phase: this.name,
      queued: true,
      hash
    };
  }

  /**
   * Execute SEK phase - processes all queued operations
   */
  async execute(ctx: PhaseContext, op: SekOperation): Promise<SekResult> {
    const startTime = performance.now();
    
    // Execute based on operation type
    const result = await this.dispatch(op.op, op.args, ctx);
    
    const endTime = performance.now();
    
    const sekResult: SekResult = {
      success: true,
      phase: this.name,
      operation: op.op,
      result,
      sideEffects: this.getSideEffects(op.op),
      executionTime: endTime - startTime,
      hash: op.hash
    };
    
    // Cache for replay
    if (ctx.replayEnabled) {
      this.resultCache.set(ctx.frame, sekResult);
    }
    
    // Emit phase event
    ctx.emit('phase_complete', {
      phase: this.name,
      frame: ctx.frame,
      hash: sekResult.hash
    });
    
    return sekResult;
  }

  /**
   * Exit SEK phase - cleans up and prepares for next phase
   */
  exit(ctx: PhaseContext): PhaseResult {
    const count = this.operationLog.length;
    this.operationLog = []; // Clear for next frame
    
    return {
      success: true,
      phase: this.name,
      operationsProcessed: count
    };
  }

  /**
   * Dispatch operation to handler
   */
  private async dispatch(op: string, args: any[], ctx: PhaseContext): Promise<any> {
    const handlers: Record<string, Function> = {
      'log': (a: any[]) => this.handleLog(a, ctx),
      'add_body': (a: any[]) => this.handleAddBody(a, ctx),
      'update_physics': (a: any[]) => this.handleUpdatePhysics(a, ctx),
      'hash_state': (a: any[]) => this.handleHashState(a, ctx),
      'add_field': (a: any[]) => this.handleAddField(a, ctx),
      'exec_binary': (a: any[]) => this.handleExecBinary(a, ctx),
      'render_frame': (a: any[]) => this.handleRenderFrame(a, ctx),
    };
    
    const handler = handlers[op];
    if (!handler) {
      throw new Error(`Unknown SEK operation: ${op}`);
    }
    
    return await handler(args);
  }

  private handleLog(args: any[], ctx: PhaseContext) {
    ctx.emit('log', args.join(' '));
    return { logged: true, message: args.join(' ') };
  }

  private handleAddBody(args: any[], ctx: PhaseContext) {
    const [world, body] = args;
    world.bodies.push(body);
    ctx.emit('body_created', body);
    return { body, count: world.bodies.length };
  }

  private handleUpdatePhysics(args: any[], ctx: PhaseContext) {
    const [world, dt] = args;
    world.bodies.forEach((body: any) => {
      body.velocity[1] += 9.81 * dt * 0.1;
      body.position[0] += body.velocity[0] * dt;
      body.position[1] += body.velocity[1] * dt;
    });
    return { dt, bodyCount: world.bodies.length };
  }

  private handleHashState(args: any[], ctx: PhaseContext) {
    const [state] = args;
    const hash = ctx.hashState(state);
    return { hash };
  }

  private handleAddField(args: any[], ctx: PhaseContext) {
    const [world, field] = args;
    world.fields.push(field);
    return { field };
  }

  private async handleExecBinary(args: any[], ctx: PhaseContext) {
    const [binaryName, config] = args;
    // Would spawn binary process
    return { binary: binaryName, config };
  }

  private handleRenderFrame(args: any[], ctx: PhaseContext) {
    ctx.emit('render', ctx.world);
    return { rendered: true, frame: ctx.frame };
  }

  /**
   * Validate operation against SEK algebra
   */
  private validateOperation(op: SekOperation): boolean {
    const validOps = [
      'log', 'add_body', 'update_physics', 'hash_state',
      'add_field', 'exec_binary', 'render_frame'
    ];
    return validOps.includes(op.op);
  }

  /**
   * Hash operation for determinism
   */
  private hashOperation(op: SekOperation): string {
    const str = JSON.stringify({ op: op.op, args: op.args });
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Track side effects for dependency analysis
   */
  private getSideEffects(op: string): string[] {
    const effects: Record<string, string[]> = {
      'log': ['console'],
      'add_body': ['world.bodies'],
      'update_physics': ['world.bodies', 'τ.position', 'τ.velocity'],
      'hash_state': [],
      'add_field': ['world.fields'],
      'exec_binary': ['external'],
      'render_frame': ['css-ver', 'dom']
    };
    return effects[op] || ['unknown'];
  }

  /**
   * Get phase statistics
   */
  getStats() {
    return {
      phase: this.name,
      operationsLogged: this.operationLog.length,
      cacheSize: this.resultCache.size
    };
  }
}
