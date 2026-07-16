/**
 * CH'EN Phase - Collapse & Emit
 * 
 * The CH'EN phase collapses the computation into an artifact
 * and emits state deltas for the next fold.
 * 
 * Algebra: CH'EN → (State × Hash) → Artifact
 * This is the BRIDGE between Fold N and Fold N+1
 */

import { Phase, PhaseResult, PhaseContext } from './Phase';

export interface StateDelta {
  path: string;
  before: any;
  after: any;
  hash: string;
}

export interface FoldArtifact {
  foldId: number;
  timestamp: number;
  stateHash: string;
  previousHash: string;  // Link to Fold N-1
  deltas: StateDelta[];
  τSnapshot: Map<string, any>;
  worldSnapshot: any;
  sideEffects: string[];
}

export interface ChenOperation {
  emitArtifact: boolean;
  includeDeltas: boolean;
  compress: boolean;
}

export interface ChenResult extends PhaseResult {
  artifact: FoldArtifact;
  isSealed: true;
  nextFoldReady: boolean;
}

export class ChenPhase implements Phase<ChenOperation, ChenResult> {
  readonly name = 'CHEN';
  readonly type = 'COLLAPSE_MONAD';
  readonly priority = 4; // After WO, before POP
  
  private currentArtifact: FoldArtifact | null = null;
  private previousHash: string = '0'; // Genesis hash
  private deltaLog: StateDelta[] = [];

  /**
   * Enter CH'EN phase - prepares artifact emission
   */
  enter(ctx: PhaseContext, op: ChenOperation): PhaseResult {
    // Compute current state hash
    const stateHash = ctx.hashState({
      π: Object.fromEntries(ctx.π),
      τ: Object.fromEntries(ctx.τ),
      world: ctx.world
    });
    
    // Verify hash chain continuity
    if (ctx.deterministic && ctx.frame > 0) {
      const expectedPrevious = this.previousHash;
      const actualPrevious = ctx.hashChain[ctx.hashChain.length - 2];
      
      if (expectedPrevious !== actualPrevious) {
        return {
          success: false,
          phase: this.name,
          error: 'Hash chain broken - state corruption detected'
        };
      }
    }
    
    return {
      success: true,
      phase: this.name,
      stateHash,
      previousHash: this.previousHash
    };
  }

  /**
   * Execute CH'EN phase - collapses computation into artifact
   */
  async execute(ctx: PhaseContext, op: ChenOperation): Promise<ChenResult> {
    // Compute state deltas from previous frame
    const deltas = this.computeStateDeltas(ctx);
    
    // Snapshot τ-bindings (persistent state)
    const τSnapshot = new Map(ctx.τ);
    
    // Snapshot world state
    const worldSnapshot = JSON.parse(JSON.stringify(ctx.world));
    
    // Create fold artifact
    const stateHash = ctx.hashState({
      π: Object.fromEntries(ctx.π),
      τ: Object.fromEntries(ctx.τ),
      world: ctx.world
    });
    
    const artifact: FoldArtifact = {
      foldId: ctx.frame,
      timestamp: Date.now(),
      stateHash,
      previousHash: this.previousHash,
      deltas,
      τSnapshot,
      worldSnapshot,
      sideEffects: this.collectSideEffects(ctx)
    };
    
    // Seal artifact with hash
    const artifactHash = ctx.hashState(artifact);
    (artifact as any).sealHash = artifactHash;
    
    this.currentArtifact = artifact;
    this.previousHash = stateHash; // Update for next fold
    
    // Emit artifact to XCFE (if enabled)
    ctx.emit('fold_complete', artifact);
    
    const result: ChenResult = {
      success: true,
      phase: this.name,
      artifact,
      isSealed: true,
      nextFoldReady: true,
      hash: artifactHash
    };
    
    return result;
  }

  /**
   * Exit CH'EN phase - prepares state for next fold
   */
  exit(ctx: PhaseContext): PhaseResult {
    if (!this.currentArtifact) {
      return {
        success: false,
        phase: this.name,
        error: 'No artifact to emit'
      };
    }
    
    // Apply deltas to prepare for next fold
    this.applyDeltasForNextFold(ctx, this.currentArtifact.deltas);
    
    // Clear delta log
    this.deltaLog = [];
    
    return {
      success: true,
      phase: this.name,
      artifactEmitted: true,
      nextFoldId: ctx.frame + 1
    };
  }

  /**
   * Compute state deltas between frames
   */
  private computeStateDeltas(ctx: PhaseContext): StateDelta[] {
    const deltas: StateDelta[] = [];
    
    // Track τ-binding changes
    ctx.τ.forEach((value, key) => {
      const history = ctx.τHistory.get(key) || [];
      const previousValue = history.length > 0 
        ? history[history.length - 1].value 
        : null;
      
      if (JSON.stringify(previousValue) !== JSON.stringify(value)) {
        deltas.push({
          path: `τ.${key}`,
          before: previousValue,
          after: value,
          hash: ctx.hashState({ path: `τ.${key}`, before: previousValue, after: value })
        });
      }
    });
    
    // Track world state changes
    // (Would compare with previous world snapshot)
    
    return deltas;
  }

  /**
   * Apply deltas to prepare next fold's initial state
   */
  private applyDeltasForNextFold(ctx: PhaseContext, deltas: StateDelta[]) {
    for (const delta of deltas) {
      if (delta.path.startsWith('τ.')) {
        const key = delta.path.slice(2);
        ctx.τ.set(key, delta.after);
        
        // Update history
        const history = ctx.τHistory.get(key) || [];
        history.push({
          frame: ctx.frame,
          value: delta.after,
          hash: delta.hash
        });
        ctx.τHistory.set(key, history);
      }
    }
  }

  /**
   * Collect side effects from all phases
   */
  private collectSideEffects(ctx: PhaseContext): string[] {
    // Would aggregate from SEK, WO phases
    return ['physics_update', 'state_mutation'];
  }

  /**
   * Get current artifact (for inspection)
   */
  getCurrentArtifact(): FoldArtifact | null {
    return this.currentArtifact;
  }

  /**
   * Get hash chain (for verification)
   */
  getHashChain(): string[] {
    // Would maintain full chain
    return [this.previousHash];
  }

  /**
   * Verify artifact integrity
   */
  verifyArtifact(artifact: FoldArtifact, ctx: PhaseContext): boolean {
    const computedHash = ctx.hashState({
      ...artifact,
      sealHash: undefined
    });
    
    return computedHash === (artifact as any).sealHash;
  }

  /**
   * Replay from artifact (for deterministic replay)
   */
  replayFromArtifact(artifact: FoldArtifact, ctx: PhaseContext) {
    // Restore τ-bindings
    for (const [key, value] of artifact.τSnapshot.entries()) {
      ctx.τ.set(key, value);
    }
    
    // Restore world state
    ctx.world = JSON.parse(JSON.stringify(artifact.worldSnapshot));
    
    // Set hash chain
    this.previousHash = artifact.stateHash;
    
    ctx.emit('replay_started', {
      foldId: artifact.foldId,
      stateHash: artifact.stateHash
    });
  }
}
