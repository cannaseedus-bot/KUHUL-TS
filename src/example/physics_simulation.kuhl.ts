/**
 * KUHUL-TS Physics Simulation Example
 * 
 * Demonstrates complete fold lifecycle with state persistence
 */

import { π, τ, Sek, Pop, Wo, Yax, Chen, Xul } from '@kuhul/ts-runtime';
import { KuhulRuntime } from '../KuhulRuntime';

// ============================================
// π-Bindings (Immutable)
// ============================================

const GRAVITY: [number, number, number] = π([0, 9.81, 0]);
const TIMESTEP: number = π(0.016);
const MAX_FOLDS: number = π(300);
const WORLD_BOUNDS: { width: number, height: number } = π({ width: 800, height: 400 });

// ============================================
// τ-Bindings (Temporal - persist across folds)
// ============================================

let frame: number = τ(0);
let totalEnergy: number = τ(0);
let collisionCount: number = τ(0);

// ============================================
// World State Interface
// ============================================

interface Body {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  mass: number;
  radius: number;
}

interface PhysicsWorld {
  bodies: Body[];
  fields: any[];
  active: boolean;
}

// ============================================
// Fold Execution
// ============================================

async function runPhysicsSimulation() {
  // Create runtime
  const runtime = new KuhulRuntime({
    deterministic: true,
    replayEnabled: true,
    hashChain: true,
    maxFolds: 300,
    checkpointInterval: 60
  });
  
  // Initialize state
  const initialState = {
    π: {
      GRAVITY: [0, 9.81, 0],
      TIMESTEP: 0.016,
      MAX_FOLDS: 300
    },
    τ: {
      frame: 0,
      totalEnergy: 0,
      collisionCount: 0
    },
    world: {
      bodies: createInitialBodies(10),
      fields: [{ type: 'gravity', strength: 9.81 }],
      active: true
    }
  };
  
  // Event handlers
  runtime.on('phase_complete', (data) => {
    console.log(`  Phase: ${data.phase} (frame ${data.frame})`);
  });
  
  runtime.on('fold_complete', (artifact) => {
    console.log(`  Artifact emitted: ${artifact.stateHash.slice(0, 16)}...`);
  });
  
  // Start simulation
  const stats = await runtime.start(initialState);
  
  // Show results
  console.log('\n📊 Simulation Statistics:');
  console.log(`  Total folds: ${stats.totalFolds}`);
  console.log(`  Average fold time: ${stats.averageFoldTime.toFixed(2)}ms`);
  console.log(`  Hash chain length: ${stats.hashChainLength}`);
  console.log(`  τ-bindings tracked: ${stats.τBindingsCount}`);
  console.log(`  Artifacts emitted: ${stats.artifactsEmitted}`);
  
  // Export state for later analysis
  const exportedState = runtime.exportState();
  console.log('\n💾 State exported for persistence');
  
  return { runtime, stats, exportedState };
}

// ============================================
// Helper Functions
// ============================================

function createInitialBodies(count: number): Body[] {
  const bodies: Body[] = [];
  
  for (let i = 0; i < count; i++) {
    bodies.push({
      id: `body_${i}`,
      position: [
        Math.random() * 800,
        Math.random() * 400,
        0
      ],
      velocity: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        0
      ],
      mass: 1.0 + Math.random() * 4,
      radius: 10 + Math.random() * 20
    });
  }
  
  return bodies;
}

// ============================================
// Run Example
// ============================================

runPhysicsSimulation()
  .then(({ runtime, stats }) => {
    console.log('\n✅ Physics simulation complete!');
    
    // Get final state
    const context = runtime.getContext();
    console.log(`\nFinal state:`);
    console.log(`  Frame: ${context.frame}`);
    console.log(`  Bodies: ${context.world.bodies.length}`);
    console.log(`  Hash chain: ${context.hashChain.length} entries`);
  })
  .catch(console.error);
