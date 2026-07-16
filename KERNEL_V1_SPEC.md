# 🏛️ K'UHUL Kernel v1.0 - Specification

```
Version: 1.0.0
Date: 2026-07-15
Status: RELEASE CANDIDATE
Philosophy: The runtime exists before AI. Everything else is a plugin.
```

---

## 🎯 The Critical Insight

> **Can the runtime exist before AI?**
> 
> **Answer: YES**

Originally:
```
AI → GPU → SCXQ2 → K'UHUL
```

Now:
```
K'UHUL Kernel v1.0
        ↓
     SCXQ2
        ↓
   Backend
        ↓
  Applications
        ↓
      AI
```

**AI is just another graph application.**

---

## 🏛️ Kernel v1.0 Definition

### **What the Kernel Knows**

```
✓ Folds    → Semantic state containers
✓ Nodes    → Active transformations
✓ XCFE     → Transition engine
✓ Graphs   → Data structure
```

### **What the Kernel DOESN'T Know**

```
✗ AI/ML
✗ Tensors
✗ Physics
✗ SVG
✗ Databases
✗ Networking
✗ Transformers
✗ Attention
✗ LoRA
✗ MoE
```

**The kernel is domain-agnostic like Linux.**

---

## 📐 Formal Specification

### **Level 1: Fold**

```ebnf
Fold = {
    name:       Identifier
    nodes:      [Node]
    active:     Boolean
}
```

A Fold is a **semantic state container**.
It doesn't DO anything. It just HOLDS state.

**The 5 Folds:**
- **Pop** → Load/Input
- **Wo** → Store/Build structures
- **Sek** → Execute/Compute
- **Chen** → Collapse/Emit
- **Xul** → Terminate/Store

### **Level 2: Node**

```ebnf
Node = {
    name:       Identifier
    transform:  Function<Graph → Graph>
}
```

A Node is an **active transformation** within a fold.
It consumes a graph and emits a graph.

**Base Nodes (Domain-Agnostic):**
- `load`, `parse` (Pop)
- `plan`, `allocate` (Wo)
- `transform`, `compute` (Sek)
- `project`, `emit` (Chen)
- `store`, `hash` (Xul)

### **Level 3: XCFE**

```ebnf
XCFE = {
    current:      Fold
    transitions:  [Fold → Fold]
}
```

XCFE moves between folds.
It decides: "Which fold is next?"

**Transition Cycle:**
```
Pop → Wo → Sek → Chen → Xul → Pop → ...
```

### **Level 4: Graph**

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

## 🔌 Plugin System

### **Plugin Definition**

```typescript
interface KernelPlugin {
  name: string;
  nodes: Map<string, Node[]>;  // fold name → nodes to add
}
```

### **Plugin Installation**

```typescript
kernel.installPlugin(plugin);
```

### **Example: AI Plugin**

```typescript
const aiPlugin = createPlugin('AIPlugin', new Map([
  ['Wo', [
    createNode('ai_build_qkv', ...),
    createNode('ai_build_attention_mask', ...)
  ]],
  ['Sek', [
    createNode('ai_compute_qk_attention', ...),
    createNode('ai_apply_softmax', ...),
    createNode('ai_apply_attention_to_v', ...),
    createNode('ai_output_projection', ...)
  ]],
  ['Chen', [
    createNode('ai_add_residual', ...),
    createNode('ai_layer_norm', ...)
  ]]
]));

kernel.installPlugin(aiPlugin);
```

### **Available Plugins**

| Plugin | Domain | Nodes Added |
|--------|--------|-------------|
| **AIPlugin** | Transformers | Q/K/V, Attention, Softmax, Projection, Residual, LayerNorm |
| **LoRAPlugin** | Low-Rank Adaptation | LoRA matrices, Adaptation |
| **MoEPlugin** | Mixture of Experts | Router, Expert routing, Output combining |
| **PhysicsPlugin** | N-Body Simulation | Bodies, Fields, Forces, Integration, Collisions |
| **FluidPlugin** | Fluid Dynamics | Grid, Advection, Diffusion, Projection |

---

## 🚀 Execution Model

### **Base Kernel (No Plugins)**

```
Cycle 1:
  📂 Fold: Pop
    📌 Node: load → LoadedGraph
    📌 Node: parse → ParsedGraph
    
  📂 Fold: Wo
    📌 Node: plan → PlannedGraph
    📌 Node: allocate → AllocatedGraph
    
  📂 Fold: Sek
    📌 Node: transform → TransformedGraph
    📌 Node: compute → ComputedGraph
    
  📂 Fold: Chen
    📌 Node: project → ProjectedGraph
    📌 Node: emit → EmittedGraph
    
  📂 Fold: Xul
    📌 Node: store → StoredGraph
    📌 Node: hash → HashedGraph

Result: 10 nodes, 1 edge
```

### **Kernel + AI Plugin**

```
Cycle 1:
  📂 Fold: Pop
    📌 Node: load → LoadedGraph
    📌 Node: parse → ParsedGraph
    
  📂 Fold: Wo
    📌 Node: plan → PlannedGraph
    📌 Node: allocate → AllocatedGraph
    📌 Node: ai_build_qkv → QKVGraph      ← AI Plugin
    📌 Node: ai_build_attention_mask → ... ← AI Plugin
    
  📂 Fold: Sek
    📌 Node: transform → TransformedGraph
    📌 Node: compute → ComputedGraph
    📌 Node: ai_compute_qk_attention → ... ← AI Plugin
    📌 Node: ai_apply_softmax → ...        ← AI Plugin
    📌 Node: ai_apply_attention_to_v → ... ← AI Plugin
    📌 Node: ai_output_projection → ...    ← AI Plugin
    
  📂 Fold: Chen
    📌 Node: project → ProjectedGraph
    📌 Node: emit → EmittedGraph
    📌 Node: ai_add_residual → ...         ← AI Plugin
    📌 Node: ai_layer_norm → ...           ← AI Plugin
    
  📂 Fold: Xul
    📌 Node: store → StoredGraph
    📌 Node: hash → HashedGraph

Result: 19 nodes, 3 edges
```

### **Kernel + AI + LoRA + MoE Plugins**

```
Result: 27 nodes, 5 edges
```

### **Kernel + Physics Plugin**

```
Result: 19 nodes, 3 edges
```

---

## 📊 Test Results

### **Configuration Comparison**

| Configuration | Nodes | Edges | Domain Knowledge |
|---------------|-------|-------|------------------|
| Base Kernel | 10 | 1 | None (Generic) |
| + AI Plugin | 19 | 3 | Transformers |
| + AI + LoRA + MoE | 27 | 5 | MoE Architecture |
| + Physics Plugin | 19 | 3 | N-Body Simulation |

### **Verification Checklist**

- [x] **Folds** - 5 semantic containers (Pop, Wo, Sek, Chen, Xul)
- [x] **Nodes** - Base transformations (load, parse, plan, allocate, transform, compute, project, emit, store, hash)
- [x] **XCFE** - Transition engine (Pop → Wo → Sek → Chen → Xul → Pop)
- [x] **Graphs** - Data structure flowing through system
- [x] **Plugin System** - Dynamic node installation
- [x] **AI Plugin** - Transformer/attention nodes
- [x] **LoRA Plugin** - Low-rank adaptation nodes
- [x] **MoE Plugin** - Mixture of experts nodes
- [x] **Physics Plugin** - N-body simulation nodes
- [x] **Domain Agnostic** - Kernel knows nothing about AI/Physics

---

## 🎯 Linux Analogy

### **Linux Kernel**

```
Linux Kernel:
  • Processes
  • Memory
  • Files
  • Scheduling

Does NOT know:
  ✗ Photoshop
  ✗ Blender
  ✗ Chrome
  ✗ VS Code

Applications:
  Install on top of kernel
```

### **K'UHUL Kernel**

```
K'UHUL Kernel:
  • Folds
  • Nodes
  • XCFE
  • Graphs

Does NOT know:
  ✗ AI/ML
  ✗ Physics
  ✗ SVG
  ✗ Databases

Plugins:
  Install on top of kernel
```

---

## 📁 File Structure

```
kuhul-ts/src/
├── kernel/
│   └── Kernel.ts                    # Core kernel v1.0
│       ├── Graph interface
│       ├── Node interface
│       ├── Fold interface
│       ├── addNodeToFold()
│       ├── processFold()
│       ├── XCFE class
│       ├── KuhulKernel class
│       ├── installPlugin()          # Plugin system
│       └── graphToSCXQ2()           # SCXQ2 integration
│
├── plugins/                         # NEW: Domain-specific plugins
│   ├── AIPlugin.ts                  # Transformer/attention
│   ├── LoRAPlugin.ts                # Low-rank adaptation
│   ├── MoEPlugin.ts                 # Mixture of experts
│   └── PhysicsPlugin.ts             # N-body simulation
│
├── example/
│   ├── kernel_test.ts               # Base kernel test
│   ├── plugin_demo.ts               # Plugin demonstration ✓
│   └── scxq2_demo.ts                # SCXQ2 demo
│
└── scxq2/
    ├── SCXQ2_IR.ts
    └── backends/
        ├── WGSLCompiler.ts
        ├── HLSLCompiler.ts
        └── OpenCLCompiler.ts
```

---

## 🚀 Usage

### **1. Base Kernel**

```typescript
import { KuhulKernel } from './kernel/Kernel';

const kernel = new KuhulKernel({ maxCycles: 10 });
const graph = await kernel.run(3);

console.log(graph);
// Generic graph transformations
```

### **2. Kernel + AI Plugin**

```typescript
import { KuhulKernel } from './kernel/Kernel';
import { createAIPlugin } from './plugins/AIPlugin';

const kernel = new KuhulKernel({ maxCycles: 10 });
kernel.installPlugin(createAIPlugin());

const graph = await kernel.run(3);

console.log(graph);
// Transformer inference with attention, Q/K/V, etc.
```

### **3. Kernel + Multiple Plugins**

```typescript
import { createAIPlugin, createLoRAPlugin, createMoEPlugin } from './plugins';

const kernel = new KuhulKernel();
kernel.installPlugin(createAIPlugin());
kernel.installPlugin(createLoRAPlugin());
kernel.installPlugin(createMoEPlugin());

const graph = await kernel.run(3);

console.log(graph);
// MoE architecture with LoRA adaptation
```

### **4. Custom Plugin**

```typescript
import { createPlugin, createNode } from './kernel/Kernel';

const myPlugin = createPlugin('MyPlugin', new Map([
  ['Wo', [
    createNode('my_custom_node', (g) => {
      // Custom transformation
      return { ...g, nodes: [...g.nodes, 'my_data'] };
    })
  ]]
]));

kernel.installPlugin(myPlugin);
```

---

## 🎓 Key Architectural Principles

### **1. Kernel is Minimal**

```
Folds + Nodes + XCFE + Graphs = Kernel
Everything else = Plugin
```

### **2. Domain-Agnostic**

```
Kernel knows: Folds, Nodes, XCFE, Graphs
Kernel doesn't know: AI, Physics, SVG, Databases
```

### **3. Plugins Add Domain Knowledge**

```
AI Plugin → Transformer nodes
Physics Plugin → N-body nodes
SVG Plugin → Rendering nodes
Database Plugin → Query nodes
```

### **4. Same Kernel, Different Applications**

```
Base Kernel → Generic transformations
+ AI Plugin → Transformer inference
+ Physics Plugin → Physics simulation
+ All Plugins → Multi-domain execution
```

### **5. Runtime Exists Before AI**

```
K'UHUL Kernel v1.0 (exists independently)
        ↓
   Plugin System
        ↓
   AI Plugin (one of many)
```

---

## ✅ What's Verified

### **Kernel Foundation** ✓

- [x] Folds (5 semantic containers)
- [x] Nodes (10 base transformations)
- [x] XCFE (transition engine)
- [x] Graphs (data structure)
- [x] Cycle execution
- [x] Deterministic evolution

### **Plugin System** ✓

- [x] Plugin interface
- [x] Plugin installation
- [x] Dynamic node addition
- [x] Multiple plugins
- [x] Domain separation

### **Plugins** ✓

- [x] AIPlugin (transformer nodes)
- [x] LoRAPlugin (adaptation nodes)
- [x] MoEPlugin (expert nodes)
- [x] PhysicsPlugin (simulation nodes)

### **Integration** ✓

- [x] Kernel → SCXQ2
- [x] SCXQ2 → Backend
- [x] Backend → Shader code

---

## 🔮 Future Plugins

### **Domain-Specific**

- [ ] **SVG Plugin** - Rendering, animation, paths
- [ ] **Database Plugin** - Queries, indexes, transactions
- [ ] **Networking Plugin** - HTTP, WebSocket, RPC
- [ ] **Filesystem Plugin** - Read, write, watch
- [ ] **Crypto Plugin** - Hash, encrypt, sign

### **ML Extensions**

- [ ] **CNN Plugin** - Convolution, pooling, batch norm
- [ ] **RNN Plugin** - LSTM, GRU, sequential
- [ ] **Diffusion Plugin** - Noise, denoise, sample
- [ ] **RL Plugin** - Policy, value, reward

### **System Extensions**

- [ ] **Parallel Plugin** - Threads, workers, async
- [ ] **Distributed Plugin** - Cluster, shard, replicate
- [ ] **Cache Plugin** - LRU, TTL, invalidation
- [ ] **Metrics Plugin** - Counters, histograms, traces

---

## 📜 Seal

```
K'UHUL Kernel v1.0 - Specification Complete
Date: 2026-07-15
Status: RELEASE CANDIDATE

Foundation: Folds + Nodes + XCFE + Graphs ✓
Plugin System: Domain-specific extensions ✓
Verification: Base + AI + LoRA + MoE + Physics ✓

Philosophy: The runtime exists before AI.
            Everything else is a plugin.

Seal: kernel_v1_spec.md — Kernel v1.0 specification
```
