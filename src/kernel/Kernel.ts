/**
 * 🏛️ K'UHUL KERNEL v1.0 - Minimal Semantic Runtime
 * 
 * The Foundation:
 *   - Folds (semantic state containers)
 *   - Nodes (active transformations within a fold)
 *   - XCFE (transition engine between folds)
 *   - Graphs (data structure flowing through folds)
 * 
 * The kernel knows NOTHING about:
 *   - AI/ML
 *   - Tensors
 *   - Physics
 *   - SVG
 *   - Databases
 *   - Networking
 * 
 * Everything else is a PLUGIN that attaches nodes to folds.
 * Like Linux: knows processes/memory/files, not Photoshop.
 */

// ============================================================================
// 1. Graph (Data Structure)
// ============================================================================

export interface Graph {
  name: string;
  nodes: string[];
  edges: Array<[string, string]>;
  data?: Map<string, any>;
}

export function createGraph(name: string, nodes: string[] = [], edges: Array<[string, string]> = []): Graph {
  return {
    name,
    nodes,
    edges,
    data: new Map()
  };
}

// ============================================================================
// 2. Node (Active Transformation)
// ============================================================================

export interface Node {
  name: string;
  transform: (graph: Graph) => Graph;
}

export function createNode(name: string, transform: (graph: Graph) => Graph): Node {
  return { name, transform };
}

// ============================================================================
// 3. Fold (Semantic State Container)
// ============================================================================

export interface Fold {
  name: string;
  nodes: Node[];
  active: boolean;
}

export function createFold(name: string, nodes: Node[] = []): Fold {
  return {
    name,
    nodes,
    active: false
  };
}

export function addNodeToFold(fold: Fold, node: Node): void {
  fold.nodes.push(node);
}

export function processFold(fold: Fold, input: Graph): Graph {
  let current = input;
  
  console.log(`  📂 Fold: ${fold.name}`);
  
  for (const node of fold.nodes) {
    current = node.transform(current);
    console.log(`    📌 Node: ${node.name} → ${current.name}`);
  }
  
  console.log(`    📊 Graph: ${current.name} (nodes: ${current.nodes.length}, edges: ${current.edges.length})`);
  
  return current;
}

// ============================================================================
// 4. XCFE (Transition Engine)
// ============================================================================

export class XCFE {
  private folds: Map<string, Fold> = new Map();
  private currentFold: string = '';
  private transitions: Array<[string, string]> = [];

  registerFold(fold: Fold): void {
    this.folds.set(fold.name, fold);
    console.log(`  ✓ Registered fold: ${fold.name}`);
  }

  setCurrentFold(name: string): void {
    const fold = this.folds.get(name);
    if (fold) {
      // Deactivate current
      if (this.currentFold) {
        const oldFold = this.folds.get(this.currentFold);
        if (oldFold) oldFold.active = false;
      }
      
      // Activate new
      this.currentFold = name;
      fold.active = true;
      console.log(`  🔄 XCFE: Set current fold → ${name}`);
    }
  }

  getCurrentFold(): string {
    return this.currentFold;
  }

  getFoldData(name: string): Fold | undefined {
    return this.folds.get(name);
  }

  transitionTo(name: string): void {
    const oldFold = this.currentFold;
    const newFold = this.folds.get(name);
    
    if (newFold && oldFold) {
      this.folds.get(oldFold)!.active = false;
      this.currentFold = name;
      newFold.active = true;
      
      this.transitions.push([oldFold, name]);
      
      console.log(`  🔄 XCFE: ${oldFold} → ${name}`);
    }
  }

  getTransitionHistory(): Array<[string, string]> {
    return [...this.transitions];
  }
}

// ============================================================================
// 5. The Kernel Runtime
// ============================================================================

export interface KernelConfig {
  deterministic: boolean;
  replayEnabled: boolean;
  maxCycles: number;
}

export class KuhulKernel {
  private xcfe: XCFE;
  private graph: Graph;
  private config: KernelConfig;
  private cycleCount: number = 0;

  constructor(config: Partial<KernelConfig> = {}) {
    this.config = {
      deterministic: config.deterministic ?? true,
      replayEnabled: config.replayEnabled ?? true,
      maxCycles: config.maxCycles ?? 10
    };
    
    this.xcfe = new XCFE();
    
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🏛️ K\'UHUL KERNEL v1.0 - Minimal Semantic Runtime           ║');
    console.log('║  Folds → Nodes → XCFE → Graphs                               ║');
    console.log('║  Domain-Agnostic Foundation                                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    this.buildFolds();
    this.buildGraph();
  }

  // ========================================================================
  // 6. Build Folds (The 5 Semantic Containers - Domain Agnostic)
  // ========================================================================

  private buildFolds(): void {
    // Fold: Pop (Load/Input)
    // Purpose: Load external data into the graph
    const pop = createFold('Pop', [
      createNode('load', (g) => {
        const result: Graph = { ...g, name: 'LoadedGraph', nodes: [...g.nodes], edges: [...g.edges], data: g.data };
        return result;
      }),
      createNode('parse', (g) => {
        const result: Graph = { ...g, name: 'ParsedGraph', nodes: [...g.nodes, 'parsed_data'], edges: [...g.edges], data: g.data };
        return result;
      })
    ]);
    this.xcfe.registerFold(pop);

    // Fold: Wo (Store/Output)
    // Purpose: Build execution structures
    const wo = createFold('Wo', [
      createNode('plan', (g) => {
        const result: Graph = {
          ...g,
          name: 'PlannedGraph',
          nodes: [...g.nodes, 'execution_plan'],
          edges: [...g.edges],
          data: g.data
        };
        return result;
      }),
      createNode('allocate', (g) => {
        const result: Graph = {
          ...g,
          name: 'AllocatedGraph',
          nodes: [...g.nodes, 'resource_1', 'resource_2', 'resource_3'],
          edges: [...g.edges],
          data: g.data
        };
        return result;
      })
    ]);
    this.xcfe.registerFold(wo);

    // Fold: Sek (Execute/Compute)
    // Purpose: Perform transformations
    const sek = createFold('Sek', [
      createNode('transform', (g) => {
        const result: Graph = {
          ...g,
          name: 'TransformedGraph',
          nodes: [...g.nodes],
          edges: [...g.edges, ['resource_1', 'resource_2'] as [string, string]],
          data: g.data
        };
        return result;
      }),
      createNode('compute', (g) => {
        const result: Graph = {
          ...g,
          name: 'ComputedGraph',
          nodes: [...g.nodes, 'result'],
          edges: [...g.edges],
          data: g.data
        };
        return result;
      })
    ]);
    this.xcfe.registerFold(sek);

    // Fold: Chen (Collapse/Emit)
    // Purpose: Emit results
    const chen = createFold('Chen', [
      createNode('project', (g) => {
        const result: Graph = {
          ...g,
          name: 'ProjectedGraph',
          nodes: [...g.nodes, 'output'],
          edges: [...g.edges],
          data: g.data
        };
        return result;
      }),
      createNode('emit', (g) => {
        const result: Graph = {
          ...g,
          name: 'EmittedGraph',
          nodes: [...g.nodes],
          edges: [...g.edges],
          data: g.data
        };
        return result;
      })
    ]);
    this.xcfe.registerFold(chen);

    // Fold: Xul (Terminate/Store)
    // Purpose: Store state for replay
    const xul = createFold('Xul', [
      createNode('store', (g) => {
        const result: Graph = {
          ...g,
          name: 'StoredGraph',
          nodes: [...g.nodes, 'cache'],
          edges: [...g.edges],
          data: g.data
        };
        return result;
      }),
      createNode('hash', (g) => {
        const hash = this.computeHash(g);
        const result: Graph = {
          ...g,
          name: 'HashedGraph',
          nodes: [...g.nodes, 'hash_' + hash],
          edges: [...g.edges],
          data: g.data
        };
        return result;
      })
    ]);
    this.xcfe.registerFold(xul);

    // Set initial fold
    this.xcfe.setCurrentFold('Pop');
  }

  // ========================================================================
  // 7. Build Initial Graph
  // ========================================================================

  private buildGraph(): void {
    this.graph = createGraph('RootGraph', ['root'], []);
    console.log(`  ✓ Initial graph: ${this.graph.name} (nodes: ${this.graph.nodes.length})`);
  }

  // ========================================================================
  // 8. Execute One Cycle (Pop → Wo → Sek → Chen → Xul)
  // ========================================================================

  executeCycle(): Graph {
    console.log(`\n🔄 Cycle ${this.cycleCount + 1} starting...`);
    console.log('─────────────────────────────────────────────────────────────\n');
    
    const cycle = ['Pop', 'Wo', 'Sek', 'Chen', 'Xul'];
    
    for (const foldName of cycle) {
      const fold = this.xcfe.getFoldData(foldName);
      if (!fold) continue;
      
      // Process graph through fold's nodes
      this.graph = processFold(fold, this.graph);
      
      // Transition to next fold
      const currentIndex = cycle.indexOf(foldName);
      const nextIndex = (currentIndex + 1) % cycle.length;
      this.xcfe.transitionTo(cycle[nextIndex]);
    }
    
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log(`✅ Cycle ${this.cycleCount + 1} complete`);
    
    this.cycleCount++;
    
    return this.graph;
  }

  // ========================================================================
  // 9. Run Multiple Cycles
  // ========================================================================

  async run(cycles?: number): Promise<Graph> {
    const maxCycles = cycles ?? this.config.maxCycles;
    
    console.log(`\n🚀 Running ${maxCycles} cycles...\n`);
    
    for (let i = 0; i < maxCycles; i++) {
      this.executeCycle();
      
      // Check if we should stop
      if (!this.config.replayEnabled && i >= maxCycles - 1) {
        break;
      }
    }
    
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ K\'UHUL Kernel Complete - ' + this.cycleCount + ' cycles executed               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    return this.graph;
  }

  // ========================================================================
  // 10. Utilities
  // ========================================================================

  private computeHash(graph: Graph): string {
    const str = JSON.stringify({
      name: graph.name,
      nodes: graph.nodes.length,
      edges: graph.edges.length
    });
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  getGraph(): Graph {
    return this.graph;
  }

  getXCFE(): XCFE {
    return this.xcfe;
  }

  getCycleCount(): number {
    return this.cycleCount;
  }

  getTransitionHistory(): Array<[string, string]> {
    return this.xcfe.getTransitionHistory();
  }

  // ========================================================================
  // 11. Plugin System - Attach nodes to folds dynamically
  // ========================================================================

  /**
   * Install a plugin that adds nodes to folds
   * This is how domain-specific capabilities extend the kernel
   */
  installPlugin(plugin: KernelPlugin): void {
    console.log('  🔌 Installing plugin: ' + plugin.name);
    
    for (const [foldName, nodes] of plugin.nodes.entries()) {
      const fold = this.xcfe.getFoldData(foldName);
      if (fold) {
        for (const node of nodes) {
          addNodeToFold(fold, node);
        }
        console.log('    ✓ Added ' + nodes.length + ' nodes to fold ' + foldName);
      }
    }
  }
}

// ============================================================================
// 6. Plugin System - Domain-Specific Extensions
// ============================================================================

export interface KernelPlugin {
  name: string;
  nodes: Map<string, Node[]>;  // fold name → nodes to add
}

export function createPlugin(name: string, nodes: Map<string, Node[]>): KernelPlugin {
  return { name, nodes };
}

// ============================================================================
// 7. Graph IR Integration - Convert Kernel Graph to Graph IR
// ============================================================================

import { Graph as KernelGraph } from './Kernel';
import { graphToGraphIR, GraphIRModule } from '../graph_ir/GraphIR';

export function kernelGraphToGraphIR(graph: KernelGraph, cycleCount: number): GraphIRModule {
  return graphToGraphIR(graph, cycleCount);
}
