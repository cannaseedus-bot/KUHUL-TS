# 🏛️ K'UHUL KERNEL - Minimal Semantic Runtime

```
Version: 1.0.0
Purpose: Prove semantic nodes and fold runtime works
Philosophy: Start with the kernel. Let everything else emerge from composition.
```

---

## 🎯 The Foundation

**The K'UHUL Kernel is a runtime with only 3 components:**

```
1. Folds    → Semantic state containers
2. Nodes    → Active transformations within a fold
3. XCFE     → Transition engine between folds
```

**That's it.** Everything else (Tensor, GPU, SVG, LoRA, Experts, Replay) is an **application** of this kernel.

---

## 🏛️ The Kernel Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    K'UHUL KERNEL                                           │
│                    Minimal Semantic Runtime                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Level 1: Fold                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Pop, Wo, Sek, Chen, Xul                                            │   │
│  │  Semantic state containers                                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                     │                                      │
│  Level 2: Node                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  parse, extract, build_graph, compute_attention, matmul,            │   │
│  │  project_output, emit, store_replay, hash                           │   │
│  │  Active transformations within a fold                               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                     │                                      │
│  Level 3: XCFE                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Pop → Wo → Sek → Chen → Xul → Pop                                 │   │
│  │  Transition engine between folds                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                     │                                      │
│  Level 4: Graph                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  RootGraph → ParsedGraph → TensorGraph → AttentionGraph →           │   │
│  │  MatMulGraph → ProjectionGraph → EmittedGraph → ReplayGraph →       │   │
│  │  HashedGraph                                                         │   │
│  │  Data structure flowing through folds                               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 Formal Definitions

### Level 1: Fold

```ebnf
Fold = {
    name:       Identifier
    nodes:      NodeSet
    active:     Boolean
}
```

A Fold is a **semantic state container**.
It doesn't DO anything. It just HOLDS state.

### Level 2: Node

```ebnf
Node = {
    name:       Identifier
    transform:  Function<Graph → Graph>
}
```

A Node is an **active transformation** within a fold.
It consumes a graph and emits a graph.

### Level 3: XCFE

```ebnf
XCFE = {
    current:      Fold
    transitions:  [Fold → Fold]
}
```

XCFE moves between folds.
It decides: "Which fold is next?"

### Level 4: Graph

```ebnf
Graph = {
    name:       Identifier
    nodes:      [String]
    edges:      [(String, String)]
    data:       Map<String, Any>
}
```

A Graph is a **data structure** flowing through folds.
It carries state from node to node, fold to fold.

---

## 🚀 Execution Flow

```
📂 Fold: Pop
    📌 Node: parse → ParsedGraph
    📌 Node: extract → extracted_data
    📊 Graph: ParsedGraph (nodes: 2, edges: 0)
    🔄 XCFE: Pop → Wo

📂 Fold: Wo
    📌 Node: build_graph → TensorGraph
    📊 Graph: TensorGraph (nodes: 5, edges: 0)
    🔄 XCFE: Wo → Sek

📂 Fold: Sek
    📌 Node: compute_attention → AttentionGraph
    📌 Node: matmul → MatMulGraph
    📊 Graph: MatMulGraph (nodes: 6, edges: 1)
    🔄 XCFE: Sek → Chen

📂 Fold: Chen
    📌 Node: project_output → ProjectionGraph
    📌 Node: emit → EmittedGraph
    📊 Graph: EmittedGraph (nodes: 7, edges: 1)
    🔄 XCFE: Chen → Xul

📂 Fold: Xul
    📌 Node: store_replay → ReplayGraph
    📌 Node: hash → HashedGraph
    📊 Graph: HashedGraph (nodes: 9, edges: 1)
    🔄 XCFE: Xul → Pop
```

**Cycle repeats...**

---

## 🎯 Test Results

### 3 Cycles Executed

```
Cycle 1:
  RootGraph (1 node) → HashedGraph (9 nodes, 1 edge)
  
Cycle 2:
  HashedGraph (9 nodes, 1 edge) → HashedGraph (17 nodes, 2 edges)
  
Cycle 3:
  HashedGraph (17 nodes, 2 edges) → HashedGraph (25 nodes, 3 edges)
```

### Statistics

| Metric | Value |
|--------|-------|
| Cycles | 3 |
| Transitions | 15 |
| Final Nodes | 25 |
| Final Edges | 3 |
| SCXQ2 Instructions | 14 |
| Backend Code | 2028 bytes |

---

## 🔗 Integration with SCXQ2

The kernel **produces graphs**, which are then **converted to SCXQ2 IR**:

```
Kernel (Folds + Nodes + XCFE)
         ↓
      Graph
         ↓
   graphToSCXQ2()
         ↓
   SCXQ2 Module
         ↓
   Backend Compilers
         ↓
   WGSL | HLSL | OpenCL
```

### Conversion Function

```typescript
function graphToSCXQ2(graph: Graph, cycleCount: number): SCXQ2Module {
  const builder = new SCXQ2Builder();
  
  const fold = builder.buildFold(
    // π-bindings (from graph metadata)
    new Map([
      ['GRAPH_NAME', graph.name],
      ['NODE_COUNT', graph.nodes.length],
      ['EDGE_COUNT', graph.edges.length],
      ['CYCLE', cycleCount]
    ]),
    
    // World state (graph data)
    { graph: { name, nodes, edges } },
    
    // Operations (graph transformations)
    [
      { op: 'TENSOR_NEW', args: [graph.name] },
      { op: 'GEOM_FLOW', args: [graph.edges.length] }
    ]
  );
  
  return builder.buildModule(`kernel_cycle_${cycleCount}`, [fold]);
}
```

---

## 🎓 Key Insights

### 1. **Folds are Semantic Containers**

```typescript
// A fold doesn't DO anything
const fold = createFold('Pop', [
  createNode('parse', ...),
  createNode('extract', ...)
]);

// It just holds nodes
fold.active = true;  // That's it
```

### 2. **Nodes are Active Transformations**

```typescript
// A node transforms graphs
const node = createNode('compute_attention', (g) => {
  return {
    ...g,
    name: 'AttentionGraph',
    edges: [...g.edges, ['q_tensor', 'k_tensor']]
  };
});
```

### 3. **XCFE Moves Between Folds**

```typescript
xcfe.transitionTo('Wo');  // Pop → Wo
xcfe.transitionTo('Sek'); // Wo → Sek
xcfe.transitionTo('Chen');// Sek → Chen
```

### 4. **Graph Flows Through System**

```
RootGraph → Pop → Wo → Sek → Chen → Xul → HashedGraph
```

### 5. **SCXQ2 is Backend-Independent**

```
Graph → SCXQ2 → WGSL/HLSL/OpenCL
```

### 6. **π Never Knows About GPU APIs**

```
Kernel produces Graph
Graph → SCXQ2
SCXQ2 → Backend
Backend → GPU

π (Kernel) never touches GPU!
```

---

## 📁 File Structure

```
kuhul-ts/src/
├── kernel/
│   └── Kernel.ts                    # Core kernel implementation
│       ├── Graph interface
│       ├── Node interface
│       ├── Fold interface
│       ├── XCFE class
│       ├── KuhulKernel class
│       └── graphToSCXQ2() converter
│
├── example/
│   └── kernel_test.ts               # Test engine
│
└── scxq2/
    ├── SCXQ2_IR.ts                  # IR types
    └── backends/
        ├── WGSLCompiler.ts
        ├── HLSLCompiler.ts
        └── OpenCLCompiler.ts
```

---

## 🚀 Usage

### Basic Kernel

```typescript
import { KuhulKernel } from './kernel/Kernel';

const kernel = new KuhulKernel({
  deterministic: true,
  replayEnabled: true,
  maxCycles: 10
});

// Run cycles
const finalGraph = await kernel.run(3);

console.log(finalGraph);
// {
//   name: 'HashedGraph',
//   nodes: [...],
//   edges: [...]
// }
```

### With SCXQ2 Integration

```typescript
import { graphToSCXQ2 } from './kernel/Kernel';
import { WGSLCompiler } from './scxq2/backends/WGSLCompiler';

// Convert graph to SCXQ2
const scx2Module = graphToSCXQ2(finalGraph, kernel.getCycleCount());

// Compile to backend
const wgsl = await new WGSLCompiler().compile(scx2Module);

console.log(wgsl.code);
// WGSL compute shader
```

---

## 🎯 Why This Matters

### Before (Complex)

```
Application → π → PhaseRunner → Phases → StateBridge → Backend
```

**Problem:** Too many layers, tight coupling, hard to test.

### After (Simple)

```
Application → Kernel (Folds + Nodes + XCFE) → Graph → SCXQ2 → Backend
```

**Solution:** Clean separation, easy to test, backend-independent.

---

## 🔮 Future Extensions

### Level 5: Applications

Now that we have the kernel, we can build:

1. **Tensor Application**
   ```typescript
   const tensorFold = createFold('Tensor', [
     createNode('matmul', ...),
     createNode('transpose', ...)
   ]);
   ```

2. **Physics Application**
   ```typescript
   const physicsFold = createFold('Physics', [
     createNode('integrate', ...),
     createNode('collide', ...)
   ]);
   ```

3. **ML Application**
   ```typescript
   const mlFold = createFold('ML', [
     createNode('forward', ...),
     createNode('backward', ...),
     createNode('update', ...)
   ]);
   ```

4. **SVG Application**
   ```typescript
   const svgFold = createFold('SVG', [
     createNode('render', ...),
     createNode('animate', ...)
   ]);
   ```

**All applications of the same kernel!**

---

## ✅ Verification

### What We Proved

1. ✅ **Folds work** - Semantic state containers
2. ✅ **Nodes work** - Active transformations
3. ✅ **XCFE works** - Transition engine
4. ✅ **Graphs flow** - Data structure through system
5. ✅ **Cycles work** - Pop → Wo → Sek → Chen → Xul → Pop
6. ✅ **SCXQ2 integration** - Graph → SCXQ2 IR
7. ✅ **Backend compilation** - SCXQ2 → WGSL/HLSL/OpenCL
8. ✅ **π-hash verification** - Deterministic replay

### What's Next

1. Add more node types (tensor, physics, ML)
2. Optimize graph transformations
3. Add graph persistence (save/load)
4. Build visual debugger
5. Create application templates

---

## 📜 Seal

```
K'UHUL KERNEL v1.0.0
Folds → Nodes → XCFE → Graphs
Start with the kernel. Let everything else emerge from composition.

Seal: kernel_architecture.md — Minimal semantic runtime verified
```
