# 🏛️ KUHUL TypeScript (KUHUL-TS)

**A domain-agnostic semantic graph runtime with TypeScript syntax**

[![npm](https://img.shields.io/npm/v/@kuhul/ts.svg)](https://www.npmjs.com/package/@kuhul/ts) [![License](https://img.shields.io/npm/l/@kuhul/ts.svg)](LICENSE)
---

---
https://www.npmjs.com/package/@kuhul/ts
---

## 🎯 The Critical Insight

> **Can the runtime exist before AI?**
> 
> **Answer: YES**

KUHUL Kernel v1.0 answers only four questions:

```
1. What Fold is active?
2. Which Nodes belong to that Fold?
3. How is the Graph transformed?
4. Which Fold is legal next?
```

**Everything else is installed via plugins.**

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  K'UHUL Kernel v1.0 (Domain-Agnostic)                       │
│  • Folds: Pop, Wo, Sek, Chen, Xul                           │
│  • Nodes: Active transformations                            │
│  • XCFE: Transition engine                                  │
│  • Graphs: Data structure                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Graph IR (Serialization Layer)                             │
│  • SCXQ2 → Backend compilation                              │
│  • JSON  → Interchange, debugging                           │
│  • DOT   → Visualization (Graphviz)                         │
│  • LLVM  → Further compilation                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Plugins (Capability-Specific)                              │
│  • TransformerPlugin - Self-attention                       │
│  • LoRAPlugin - Low-rank adaptation                         │
│  • MoEPlugin - Mixture of experts                           │
│  • PhysicsPlugin - N-body simulation                        │
│  • SVGPlugin - Vector graphics                              │
│  • DatabasePlugin - Data persistence                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Installation

```bash
npm install @kuhul/ts
```

### Basic Usage

```typescript
import { KuhulKernel, createNode } from '@kuhul/ts';

// Create kernel
const kernel = new KuhulKernel({
  deterministic: true,
  replayEnabled: true,
  maxCycles: 10
});

// Run cycles
const graph = await kernel.run(3);

console.log(graph);
// { name: 'HashedGraph', nodes: [...], edges: [...] }
```

### With Transformer Plugin

```typescript
import { KuhulKernel } from '@kuhul/ts';
import { createTransformerPlugin } from '@kuhul/ts/plugins';

const kernel = new KuhulKernel();

// Install transformer capability
kernel.installPlugin(createTransformerPlugin());

// Run transformer inference
const graph = await kernel.run(1);

// Graph now contains:
// - Q/K/V projections
// - Attention computation
// - Softmax, residual, layer norm
```

### With Multiple Plugins

```typescript
import { createTransformerPlugin } from '@kuhul/ts/plugins';
import { createLoRAPlugin } from '@kuhul/ts/plugins';
import { createMoEPlugin } from '@kuhul/ts/plugins';

const kernel = new KuhulKernel();

// Install multiple capabilities
kernel.installPlugin(createTransformerPlugin());
kernel.installPlugin(createLoRAPlugin());
kernel.installPlugin(createMoEPlugin());

// Run MoE architecture with LoRA adaptation
const graph = await kernel.run(3);
```

---

## 📐 Key Concepts

### Folds (Semantic State Containers)

```typescript
// 5 semantic folds
const folds = ['Pop', 'Wo', 'Sek', 'Chen', 'Xul'];

// Each fold holds nodes
// Pop   → Load/Input
// Wo    → Store/Build structures
// Sek   → Execute/Compute
// Chen  → Collapse/Emit
// Xul   → Terminate/Store
```

### Nodes (Active Transformations)

```typescript
import { createNode } from '@kuhul/ts';

// Create a custom node
const myNode = createNode('my_transform', (graph) => {
  return {
    ...graph,
    name: 'TransformedGraph',
    nodes: [...graph.nodes, 'my_data']
  };
});
```

### XCFE (Transition Engine)

```typescript
// Deterministic transitions
Pop → Wo → Sek → Chen → Xul → Pop → ...

// Kernel manages transitions
// No manual fold switching needed
```

### Graphs (Data Structure)

```typescript
interface Graph {
  name: string;
  nodes: string[];
  edges: Array<[string, string]>;
  data?: Map<string, any>;
}

// Flows through folds
// Transformed by nodes
// Serialized via Graph IR
```

---

## 🔌 Plugin System

### Capability-Specific Plugins

The kernel is domain-agnostic. Plugins add domain knowledge:

```typescript
// Transformer Plugin
import { createTransformerPlugin } from '@kuhul/ts/plugins';

kernel.installPlugin(createTransformerPlugin());
// Adds: Q/K/V projections, attention, softmax, residual, layer norm

// LoRA Plugin
import { createLoRAPlugin } from '@kuhul/ts/plugins';

kernel.installPlugin(createLoRAPlugin());
// Adds: LoRA A/B matrices, adaptation

// Physics Plugin
import { createPhysicsPlugin } from '@kuhul/ts/plugins';

kernel.installPlugin(createPhysicsPlugin());
// Adds: Bodies, fields, forces, collisions
```

### Custom Plugins

```typescript
import { createPlugin, createNode } from '@kuhul/ts';

const myPlugin = createPlugin('MyPlugin', new Map([
  ['Wo', [
    createNode('my_setup', (g) => {
      // Custom transformation
      return { ...g, nodes: [...g.nodes, 'my_data'] };
    })
  ]],
  ['Sek', [
    createNode('my_compute', (g) => {
      // Custom computation
      return { ...g, edges: [...g.edges, ['a', 'b']] };
    })
  ]]
]));

kernel.installPlugin(myPlugin);
```

---

## 📊 Graph IR (Serialization Layer)

The kernel produces Graphs. Graph IR serializes them to multiple formats:

```typescript
import { graphToGraphIR, GraphIRCompiler } from '@kuhul/ts/graph-ir';

// Convert kernel graph to Graph IR
const graphIR = graphToGraphIR(graph, cycleCount);

// Compile to multiple formats
const compiler = new GraphIRCompiler();

// SCXQ2 (backend compilation)
const scxq2 = compiler.compile(graphIR, 'SCXQ2');

// JSON (interchange, debugging)
const json = compiler.compile(graphIR, 'JSON');

// DOT (Graphviz visualization)
const dot = compiler.compile(graphIR, 'DOT');

// LLVM (further compilation)
const llvm = compiler.compile(graphIR, 'LLVM');
```

### Example: JSON Output

```json
{
  "name": "graph_ir_cycle_1",
  "version": "1.0.0",
  "nodes": [
    {
      "id": "node_0",
      "type": "generic",
      "attributes": {"original_name": "root"},
      "inputs": [],
      "outputs": []
    },
    {
      "id": "node_8",
      "type": "attention",
      "attributes": {"original_name": "QKAttentionGraph"},
      "inputs": ["q_proj", "k_proj"],
      "outputs": ["attn_probs"]
    }
  ],
  "edges": [
    {"source": "q_proj", "target": "k_proj", "type": "data"}
  ]
}
```

---

## 🏗️ Project Structure

```
my-kuhul-app/
├── src/
│   ├── main.ts              # Entry point
│   ├── kernel.ts            # Kernel setup
│   ├── plugins/             # Custom plugins
│   │   ├── transformer.ts
│   │   └── custom.ts
│   └── graph_ir/            # Graph IR configs
├── dist/
│   ├── bundle.js            # Compiled output
│   ├── graph_ir.json        # Graph IR JSON
│   └── graph_ir.dot         # Graphviz visualization
├── package.json
└── kuhul.config.json        # Configuration
```

### Configuration

```json
{
  "kernel": {
    "deterministic": true,
    "replayEnabled": true,
    "maxCycles": 100
  },
  "plugins": [
    "transformer",
    "lora",
    "moe"
  ],
  "graphIR": {
    "formats": ["SCXQ2", "JSON", "DOT"],
    "outputDir": "./dist"
  }
}
```

---

## 🎓 The Linux Analogy

### Linux Kernel

```
Linux Kernel:
  • Processes, Memory, Files, Scheduling
  
Does NOT know:
  ✗ Photoshop
  ✗ Blender
  ✗ Chrome

Applications install on top.
```

### K'UHUL Kernel

```
K'UHUL Kernel:
  • Folds, Nodes, XCFE, Graphs
  
Does NOT know:
  ✗ Transformers
  ✗ LoRA
  ✗ MoE
  ✗ Physics
  ✗ SVG

Plugins install on top.
```

---

## 📚 Documentation

- **[KERNEL_V1_FINAL.md](./KERNEL_V1_FINAL.md)** - Complete v1.0 specification
- **[KERNEL_ARCHITECTURE.md](./KERNEL_ARCHITECTURE.md)** - Kernel design
- **[GRAPH_IR.md](./graph_ir/README.md)** - Graph IR serialization
- **[PLUGINS.md](./plugins/README.md)** - Plugin development guide
- **[OPCODES.md](./OPCODES.md)** - SCXQ2 opcode reference

---

## 🔮 Roadmap

### Phase 1: Kernel v1.0 ✅ Complete

- [x] Domain-agnostic kernel
- [x] Folds, Nodes, XCFE, Graphs
- [x] Plugin system
- [x] Graph IR layer
- [x] Multiple serializers (SCXQ2, JSON, DOT, LLVM)

### Phase 2: Plugins (In Progress)

- [x] TransformerPlugin
- [x] LoRAPlugin
- [x] MoEPlugin
- [x] PhysicsPlugin
- [ ] SVGPlugin
- [ ] DatabasePlugin
- [ ] NetworkingPlugin

### Phase 3: Production

- [ ] VS Code extension
- [ ] CLI tools
- [ ] Performance benchmarks
- [ ] Example applications
- [ ] Documentation website

---

## 🤝 Contributing

### Building a Plugin

```typescript
import { createPlugin, createNode } from '@kuhul/ts';

export function createMyPlugin() {
  return createPlugin('MyPlugin', new Map([
    ['Wo', [
      createNode('my_setup', (g) => {
        // Your transformation
        return g;
      })
    ]],
    ['Sek', [
      createNode('my_compute', (g) => {
        // Your computation
        return g;
      })
    ]]
  ]));
}
```

### Adding a Serializer

```typescript
import { GraphIRSerializer, GraphIRModule } from '@kuhul/ts/graph-ir';

export class MySerializer implements GraphIRSerializer {
  readonly name = 'MyFormat';
  
  serialize(module: GraphIRModule): string {
    // Your serialization logic
    return '...';
  }
}
```

---

## 📜 License

MIT

---

## 🏛️ The Specification

> **The K'UHUL Kernel is domain-agnostic. It defines semantic folds, node execution, graph transformation, and deterministic fold transitions. Domain knowledge is never embedded in the kernel; it is introduced exclusively through plugins that register nodes within one or more folds. The Graph IR layer provides serialization independence, allowing the kernel to output multiple formats (SCXQ2, JSON, DOT, LLVM) without modification.**

---

**K'UHUL Kernel v1.0** - The runtime exists before AI. Everything else is installed.
