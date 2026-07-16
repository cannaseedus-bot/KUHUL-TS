# KUHUL Phase Architecture - Complete System

## The State Handoff Problem (And Solution)

**Question:** How does persistent state (like a physics world) flow from Fold N to Fold N+1?

**Answer:** Through the **Ch'en Artifact → StateBridge → Wo Initialization** pipeline.

---

## Complete Fold Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                         FOLD N                                   │
│                                                                  │
│  Pop (enter)                                                     │
│   ↓                                                              │
│  Wo (declare π/τ) ←─── τ from Fold N-1                           │
│   ↓                                                              │
│  Yax (resolve)                                                   │
│   ↓                                                              │
│  Sek (transform)                                                 │
│   ↓                                                              │
│  Ch'en (collapse) ────→ Artifact N ──→ StateBridge               │
│   ↓                                                              │
│  Xul (close)                                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Hash Chain Link
                    τ-Binding Snapshot
                    World State Snapshot
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       FOLD N+1                                   │
│                                                                  │
│  Pop (enter)                                                     │
│   ↓                                                              │
│  Wo (declare π/τ) ←─── τ from Artifact N (via StateBridge)      │
│   ↓                                                              │
│  ... (continues)                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Persistence Mechanisms

### 1. **τ-Binding Persistence**

```typescript
// Fold N
let frame: number = τ(0);  // Initial value
frame = τ(frame + 1);      // Update

// Ch'en phase captures τ snapshot
const τSnapshot = {
  frame: 42,
  totalEnergy: 1234.5,
  collisionCount: 15
};

// StateBridge stores in artifact
artifact.τSnapshot = τSnapshot;

// Fold N+1
// Wo phase restores τ from artifact
for (const [key, value] of artifact.τSnapshot.entries()) {
  ctx.τ.set(key, value);
}

// τ-bindings persist across folds!
```

### 2. **World State Evolution**

```typescript
// Fold N
world.bodies.forEach(body => {
  body.velocity[1] += 9.81 * dt;  // Apply gravity
  body.position[0] += body.velocity[0] * dt;
});

// Ch'en phase snapshots world
artifact.worldSnapshot = {
  bodies: [...world.bodies],
  fields: [...world.fields],
  active: true
};

// Fold N+1
// Wo phase restores world from snapshot
ctx.world = JSON.parse(JSON.stringify(artifact.worldSnapshot));

// Physics continues from where it left off!
```

### 3. **Hash Chain Continuity**

```typescript
// Fold N
artifact.stateHash = hash(π, τ, world);
artifact.previousHash = previousFold.stateHash;

// StateBridge verifies chain
if (artifact.previousHash !== lastKnownHash) {
  throw new Error('Hash chain broken!');
}

// Fold N+1
// New artifact links to Fold N
newArtifact.previousHash = artifact.stateHash;

// Cryptographic linking ensures deterministic replay
```

---

## Phase Execution Flow

### **Pop Phase (Enter Fold)**
```typescript
enter(ctx) {
  // Create new fold context
  const foldContext = {
    id: ctx.frame + 1,
    timestamp: Date.now(),
    πHash: generateHash(ctx)
  };
  
  // Verify hash chain continuity
  if (foldContext.πHash !== ctx.previousHash) {
    throw new Error('Hash mismatch!');
  }
}
```

### **Wo Phase (Declare State)**
```typescript
execute(ctx) {
  // Restore τ-bindings from previous artifact
  for (const [key, value] of ctx.previousArtifact.τSnapshot) {
    ctx.τ.set(key, value);
  }
  
  // Restore world state
  ctx.world = ctx.previousArtifact.worldSnapshot;
  
  // Declare π-bindings (immutable)
  ctx.π.set('GRAVITY', [0, 9.81, 0]);
  ctx.π.set('TIMESTEP', 0.016);
}
```

### **Ch'en Phase (Collapse & Emit)**
```typescript
execute(ctx) {
  // Compute state deltas
  const deltas = computeDeltas(ctx.previousState, ctx.currentState);
  
  // Snapshot τ-bindings
  const τSnapshot = new Map(ctx.τ);
  
  // Snapshot world state
  const worldSnapshot = JSON.parse(JSON.stringify(ctx.world));
  
  // Create artifact
  const artifact = {
    foldId: ctx.frame,
    stateHash: hash(ctx),
    previousHash: ctx.previousHash,
    deltas,
    τSnapshot,
    worldSnapshot,
    sideEffects: collectSideEffects(ctx)
  };
  
  // Seal artifact
  artifact.sealHash = hash(artifact);
  
  return artifact;
}
```

### **StateBridge (Handoff)**
```typescript
transferState(artifact, ctx) {
  // 1. Verify artifact integrity
  verifyHash(artifact);
  
  // 2. Verify hash chain
  if (artifact.previousHash !== ctx.lastHash) {
    throw new Error('Chain broken!');
  }
  
  // 3. Restore τ-bindings
  for (const [key, value] of artifact.τSnapshot) {
    ctx.τ.set(key, value);
  }
  
  // 4. Restore world state
  ctx.world = artifact.worldSnapshot;
  
  // 5. Update hash chain
  ctx.hashChain.push(artifact.stateHash);
  
  // Ready for Fold N+1!
}
```

---

## Example: Physics Simulation (3 Folds)

### **Fold 0 (Initial)**
```
τ.frame = 0
τ.totalEnergy = 0
world.bodies = [{position: [0, 0], velocity: [5, 0]}]

Ch'en Artifact 0:
  stateHash: 0x1234...
  τSnapshot: {frame: 0, totalEnergy: 0}
  worldSnapshot: {bodies: [...]}
```

### **Fold 1 (After 16ms)**
```
StateBridge transfers from Artifact 0:
  τ.frame → 0
  world.bodies → [{position: [0, 0], velocity: [5, 0]}]

Wo restores state, Sek updates physics:
  body.velocity[1] += 9.81 * 0.016  // Gravity
  body.position[0] += 5 * 0.016      // Motion
  
τ.frame = τ(1)
τ.totalEnergy = τ(12.5)

Ch'en Artifact 1:
  stateHash: 0x5678...
  previousHash: 0x1234...  ← Links to Fold 0
  τSnapshot: {frame: 1, totalEnergy: 12.5}
  worldSnapshot: {bodies: [{position: [0.08, -0.157], ...}]}
```

### **Fold 2 (After 32ms)**
```
StateBridge transfers from Artifact 1:
  τ.frame → 1
  τ.totalEnergy → 12.5
  world.bodies → [{position: [0.08, -0.157], ...}]

Wo restores state, Sek updates physics:
  body.velocity[1] += 9.81 * 0.016
  body.position[0] += 5 * 0.016
  body.position[1] += -0.157 * 0.016
  
τ.frame = τ(2)
τ.totalEnergy = τ(12.3)

Ch'en Artifact 2:
  stateHash: 0x9abc...
  previousHash: 0x5678...  ← Links to Fold 1
  τSnapshot: {frame: 2, totalEnergy: 12.3}
  worldSnapshot: {bodies: [{position: [0.16, -0.314], ...}]}
```

---

## Key Insights

### **1. Folds Are Sealed Computation Boxes**
- Each fold is mathematically isolated
- No external mutation during execution
- All state changes flow through Ch'en artifact

### **2. τ-Bindings Are The Bridge**
- π-bindings: Immutable (same in all folds)
- τ-bindings: Temporal (persist across folds)
- World state: Evolves via τ-binding updates

### **3. Hash Chain Ensures Determinism**
```
Fold 0: hash₀ = hash(state₀)
Fold 1: hash₁ = hash(state₁, hash₀)
Fold 2: hash₂ = hash(state₂, hash₁)
...

Replay from Fold N:
  - Verify hashₙ
  - Restore state from artifactₙ
  - Continue with foldₙ₊₁
```

### **4. XCFE Controls, Phases Execute**
```
XCFE (Control Algebra):
  while (active) {
    if (hashValid) {
      runPhases();  // Pop → Wo → Yax → Sek → Ch'en → Xul
    } else {
      rollback();
      retry();
    }
  }

Phases (Semantic Fold):
  - Pure execution within fold
  - No external side effects
  - All IO through Ch'en artifact
```

---

## Memory Arena Optimization

Because each fold has a strict lifecycle:

```
Allocate (Wo) → Execute (Yax/Sek) → Emit (Ch'en) → Drop (Xul)
```

The runtime can:
- **Pre-allocate** memory for each fold
- **Drop entire fold state** after Xul (O(1) garbage collection)
- **Reuse memory arenas** across folds
- **Compile to WASM** with explicit memory management

This makes KUHUL perfect for:
- **Physics engines** (deterministic, replayable)
- **Game servers** (authoritative, cheat-proof)
- **Scientific computing** (verifiable, reproducible)
- **Financial systems** (auditable, traceable)

---

## The Complete Picture

```
KUHUL-TS Source
    ↓
Compiler (TypeScript → JS)
    ↓
Glyph Calls (Sek, Pop, Wo, etc.)
    ↓
Phase Runner (sequences phases)
    ↓
Phase Execution (Pop → Wo → Yax → Sek → Ch'en → Xul)
    ↓
Ch'en Artifact (state snapshot + hash)
    ↓
StateBridge (verifies, transfers)
    ↓
Next Fold (τ restored, world restored)
    ↓
Repeat...
```

**This is the answer:** State persists via **τ-binding snapshots** in Ch'en artifacts, transferred by **StateBridge**, and restored in **Wo phase** of the next fold. The **hash chain** ensures cryptographic continuity, making every fold replayable and verifiable.
