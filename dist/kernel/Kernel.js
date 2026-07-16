"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KuhulKernel = exports.XCFE = void 0;
exports.createGraph = createGraph;
exports.createNode = createNode;
exports.createFold = createFold;
exports.addNodeToFold = addNodeToFold;
exports.processFold = processFold;
exports.createPlugin = createPlugin;
exports.kernelGraphToGraphIR = kernelGraphToGraphIR;
function createGraph(name, nodes = [], edges = []) {
    return {
        name,
        nodes,
        edges,
        data: new Map()
    };
}
function createNode(name, transform) {
    return { name, transform };
}
function createFold(name, nodes = []) {
    return {
        name,
        nodes,
        active: false
    };
}
function addNodeToFold(fold, node) {
    fold.nodes.push(node);
}
function processFold(fold, input) {
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
class XCFE {
    constructor() {
        this.folds = new Map();
        this.currentFold = '';
        this.transitions = [];
    }
    registerFold(fold) {
        this.folds.set(fold.name, fold);
        console.log(`  ✓ Registered fold: ${fold.name}`);
    }
    setCurrentFold(name) {
        const fold = this.folds.get(name);
        if (fold) {
            // Deactivate current
            if (this.currentFold) {
                const oldFold = this.folds.get(this.currentFold);
                if (oldFold)
                    oldFold.active = false;
            }
            // Activate new
            this.currentFold = name;
            fold.active = true;
            console.log(`  🔄 XCFE: Set current fold → ${name}`);
        }
    }
    getCurrentFold() {
        return this.currentFold;
    }
    getFoldData(name) {
        return this.folds.get(name);
    }
    transitionTo(name) {
        const oldFold = this.currentFold;
        const newFold = this.folds.get(name);
        if (newFold && oldFold) {
            this.folds.get(oldFold).active = false;
            this.currentFold = name;
            newFold.active = true;
            this.transitions.push([oldFold, name]);
            console.log(`  🔄 XCFE: ${oldFold} → ${name}`);
        }
    }
    getTransitionHistory() {
        return [...this.transitions];
    }
}
exports.XCFE = XCFE;
class KuhulKernel {
    constructor(config = {}) {
        this.cycleCount = 0;
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
    buildFolds() {
        // Fold: Pop (Load/Input)
        // Purpose: Load external data into the graph
        const pop = createFold('Pop', [
            createNode('load', (g) => {
                const result = { ...g, name: 'LoadedGraph', nodes: [...g.nodes], edges: [...g.edges], data: g.data };
                return result;
            }),
            createNode('parse', (g) => {
                const result = { ...g, name: 'ParsedGraph', nodes: [...g.nodes, 'parsed_data'], edges: [...g.edges], data: g.data };
                return result;
            })
        ]);
        this.xcfe.registerFold(pop);
        // Fold: Wo (Store/Output)
        // Purpose: Build execution structures
        const wo = createFold('Wo', [
            createNode('plan', (g) => {
                const result = {
                    ...g,
                    name: 'PlannedGraph',
                    nodes: [...g.nodes, 'execution_plan'],
                    edges: [...g.edges],
                    data: g.data
                };
                return result;
            }),
            createNode('allocate', (g) => {
                const result = {
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
                const result = {
                    ...g,
                    name: 'TransformedGraph',
                    nodes: [...g.nodes],
                    edges: [...g.edges, ['resource_1', 'resource_2']],
                    data: g.data
                };
                return result;
            }),
            createNode('compute', (g) => {
                const result = {
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
                const result = {
                    ...g,
                    name: 'ProjectedGraph',
                    nodes: [...g.nodes, 'output'],
                    edges: [...g.edges],
                    data: g.data
                };
                return result;
            }),
            createNode('emit', (g) => {
                const result = {
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
                const result = {
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
                const result = {
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
    buildGraph() {
        this.graph = createGraph('RootGraph', ['root'], []);
        console.log(`  ✓ Initial graph: ${this.graph.name} (nodes: ${this.graph.nodes.length})`);
    }
    // ========================================================================
    // 8. Execute One Cycle (Pop → Wo → Sek → Chen → Xul)
    // ========================================================================
    executeCycle() {
        console.log(`\n🔄 Cycle ${this.cycleCount + 1} starting...`);
        console.log('─────────────────────────────────────────────────────────────\n');
        const cycle = ['Pop', 'Wo', 'Sek', 'Chen', 'Xul'];
        for (const foldName of cycle) {
            const fold = this.xcfe.getFoldData(foldName);
            if (!fold)
                continue;
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
    async run(cycles) {
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
    computeHash(graph) {
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
    getGraph() {
        return this.graph;
    }
    getXCFE() {
        return this.xcfe;
    }
    getCycleCount() {
        return this.cycleCount;
    }
    getTransitionHistory() {
        return this.xcfe.getTransitionHistory();
    }
    // ========================================================================
    // 11. Plugin System - Attach nodes to folds dynamically
    // ========================================================================
    /**
     * Install a plugin that adds nodes to folds
     * This is how domain-specific capabilities extend the kernel
     */
    installPlugin(plugin) {
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
exports.KuhulKernel = KuhulKernel;
function createPlugin(name, nodes) {
    return { name, nodes };
}
const GraphIR_1 = require("../graph_ir/GraphIR");
function kernelGraphToGraphIR(graph, cycleCount) {
    return (0, GraphIR_1.graphToGraphIR)(graph, cycleCount);
}
