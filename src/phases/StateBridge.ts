/**
 * KUHUL State Bridge - Fold N → Fold N+1 Handoff
 * 
 * Manages persistent state transfer between folds.
 * This is the CRITICAL PATH for physics evolution and temporal continuity.
 * 
 * Architecture:
 *   Fold N (Ch'en) → StateDelta[] → Bridge → Fold N+1 (Wo)
 *   
 * The bridge ensures:
 *   1. Hash chain continuity (cryptographic linking)
 *   2. τ-binding persistence (temporal state)
 *   3. World state evolution (physics continuity)
 *   4. Artifact verification (integrity checking)
 */

import { FoldArtifact, StateDelta } from './Chen';
import { PhaseContext } from './Phase';

export interface StateBridgeConfig {
  verifyHashes: boolean;
  compressDeltas: boolean;
  maxHistoryFrames: number;
}

export interface BridgeState {
  currentFold: number;
  previousArtifact: FoldArtifact | null;
  hashChain: string[];
  τPersistence: Map<string, any[]>;  // Full history per τ-binding
  worldHistory: any[];
}

export class StateBridge {
  private config: StateBridgeConfig;
  private state: BridgeState;

  constructor(config: Partial<StateBridgeConfig> = {}) {
    this.config = {
      verifyHashes: config.verifyHashes ?? true,
      compressDeltas: config.compressDeltas ?? false,
      maxHistoryFrames: config.maxHistoryFrames ?? 1000
    };
    
    this.state = {
      currentFold: 0,
      previousArtifact: null,
      hashChain: ['0'], // Genesis hash
      τPersistence: new Map(),
      worldHistory: []
    };
    
    console.log('⧫ StateBridge initialized');
    console.log(`  Hash verification: ${this.config.verifyHashes}`);
    console.log(`  Max history: ${this.config.maxHistoryFrames} frames`);
  }

  /**
   * Transfer state from Fold N artifact to Fold N+1 context
   * 
   * This is the CORE handoff mechanism - called between every fold
   */
  transferState(artifact: FoldArtifact, ctx: PhaseContext): PhaseContext {
    console.log(`[Bridge] Transferring state from Fold ${artifact.foldId} → ${artifact.foldId + 1}`);
    
    // 1. Verify artifact integrity
    if (this.config.verifyHashes) {
      const valid = this.verifyArtifactHash(artifact, ctx);
      if (!valid) {
        throw new Error(`Artifact hash verification failed for Fold ${artifact.foldId}`);
      }
    }
    
    // 2. Verify hash chain continuity
    const chainValid = this.verifyHashChain(artifact, ctx);
    if (!chainValid) {
      throw new Error(`Hash chain broken at Fold ${artifact.foldId}`);
    }
    
    // 3. Restore τ-bindings (persistent temporal state)
    for (const [key, value] of artifact.τSnapshot.entries()) {
      ctx.τ.set(key, value);
      
      // Update persistence history
      const history = this.state.τPersistence.get(key) || [];
      history.push({
        fold: artifact.foldId,
        value,
        hash: ctx.hashState({ fold: artifact.foldId, key, value })
      });
      
      // Trim history if needed
      if (history.length > this.config.maxHistoryFrames) {
        history.shift();
      }
      
      this.state.τPersistence.set(key, history);
    }
    
    // 4. Restore world state (physics continuity)
    ctx.world = JSON.parse(JSON.stringify(artifact.worldSnapshot));
    
    // 5. Update hash chain
    this.state.hashChain.push(artifact.stateHash);
    ctx.hashChain = [...this.state.hashChain];
    
    // 6. Store world history (for replay/debugging)
    this.state.worldHistory.push({
      fold: artifact.foldId,
      world: artifact.worldSnapshot,
      hash: artifact.stateHash
    });
    
    // 7. Update current fold counter
    this.state.currentFold = artifact.foldId + 1;
    this.state.previousArtifact = artifact;
    
    // 8. Emit bridge event
    ctx.emit('state_transferred', {
      fromFold: artifact.foldId,
      toFold: artifact.foldId + 1,
      τCount: ctx.τ.size,
      bodyCount: ctx.world.bodies?.length || 0
    });
    
    return ctx;
  }

  /**
   * Verify artifact hash integrity
   */
  private verifyArtifactHash(artifact: FoldArtifact, ctx: PhaseContext): boolean {
    const computedHash = ctx.hashState({
      foldId: artifact.foldId,
      timestamp: artifact.timestamp,
      stateHash: artifact.stateHash,
      previousHash: artifact.previousHash,
      deltas: artifact.deltas,
      τSnapshot: Object.fromEntries(artifact.τSnapshot),
      worldSnapshot: artifact.worldSnapshot,
      sideEffects: artifact.sideEffects,
      sealHash: undefined
    });
    
    return computedHash === (artifact as any).sealHash;
  }

  /**
   * Verify hash chain continuity
   */
  private verifyHashChain(artifact: FoldArtifact, ctx: PhaseContext): boolean {
    const expectedPrevious = this.state.hashChain[this.state.hashChain.length - 1];
    return artifact.previousHash === expectedPrevious;
  }

  /**
   * Get τ-binding history for analysis/replay
   */
  getτHistory(key: string): Array<{fold: number, value: any, hash: string}> {
    return this.state.τPersistence.get(key) || [];
  }

  /**
   * Get world state at specific fold (for replay)
   */
  getWorldAtFold(fold: number): any {
    const entry = this.state.worldHistory.find(e => e.fold === fold);
    return entry ? entry.world : null;
  }

  /**
   * Get full hash chain (for verification)
   */
  getHashChain(): string[] {
    return [...this.state.hashChain];
  }

  /**
   * Replay from specific fold
   */
  replayFromFold(fold: number, ctx: PhaseContext): PhaseContext {
    const entry = this.state.worldHistory.find(e => e.fold === fold);
    
    if (!entry) {
      throw new Error(`No world state recorded for Fold ${fold}`);
    }
    
    console.log(`[Bridge] Replaying from Fold ${fold}`);
    
    // Restore world
    ctx.world = JSON.parse(JSON.stringify(entry.world));
    
    // Restore hash chain up to this fold
    this.state.hashChain = this.state.hashChain.slice(0, fold + 1);
    ctx.hashChain = [...this.state.hashChain];
    
    // Restore τ-bindings
    this.state.τPersistence.forEach((history, key) => {
      const entry = history.find(h => h.fold === fold);
      if (entry) {
        ctx.τ.set(key, entry.value);
      }
    });
    
    ctx.frame = fold;
    this.state.currentFold = fold;
    
    ctx.emit('replay_started', {
      fromFold: fold,
      hashChainLength: this.state.hashChain.length
    });
    
    return ctx;
  }

  /**
   * Export state for persistence
   */
  exportState(): object {
    return {
      currentFold: this.state.currentFold,
      hashChain: this.state.hashChain,
      τPersistence: Object.fromEntries(
        Array.from(this.state.τPersistence.entries()).map(([k, v]) => [k, v])
      ),
      worldHistory: this.state.worldHistory.slice(-this.config.maxHistoryFrames)
    };
  }

  /**
   * Import state for restoration
   */
  importState(exported: any, ctx: PhaseContext) {
    this.state.currentFold = exported.currentFold;
    this.state.hashChain = exported.hashChain;
    this.state.τPersistence = new Map(
      Object.entries(exported.τPersistence).map(([k, v]) => [k, v as any[]])
    );
    this.state.worldHistory = exported.worldHistory;
    this.state.previousArtifact = null;
    
    ctx.hashChain = [...this.state.hashChain];
    
    console.log(`[Bridge] State imported from Fold ${this.state.currentFold}`);
  }

  /**
   * Get bridge statistics
   */
  getStats() {
    return {
      currentFold: this.state.currentFold,
      hashChainLength: this.state.hashChain.length,
      τBindingsTracked: this.state.τPersistence.size,
      worldHistoryFrames: this.state.worldHistory.length,
      previousArtifactHash: this.state.previousArtifact?.stateHash || 'none'
    };
  }
}
