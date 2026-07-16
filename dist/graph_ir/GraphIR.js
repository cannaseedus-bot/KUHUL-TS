"use strict";
/**
 * 📊 Graph IR - Intermediate Representation
 *
 * The Kernel produces Graphs.
 * Graph IR is the serialization layer between Kernel and backends.
 *
 * Kernel → Graph IR → SCXQ2 | JSON | LLVM | DOT | ...
 *
 * This keeps the kernel independent of any specific IR format.
 * SCXQ2 is just ONE possible serialization.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphIRCompiler = exports.LLVMSerializer = exports.DOTSerializer = exports.JSONSerializer = exports.SCXQ2Serializer = void 0;
exports.createGraphIRNode = createGraphIRNode;
exports.createGraphIREdge = createGraphIREdge;
exports.createGraphIRModule = createGraphIRModule;
exports.graphToGraphIR = graphToGraphIR;
function createGraphIRNode(id, type, attributes = new Map(), inputs = [], outputs = []) {
    return { id, type, attributes, inputs, outputs };
}
function createGraphIREdge(source, target, type = 'data', attributes = new Map()) {
    return { source, target, type, attributes };
}
function createGraphIRModule(name) {
    return {
        name,
        version: '1.0.0',
        nodes: [],
        edges: [],
        metadata: new Map()
    };
}
// ============================================================================
// 4. Graph → Graph IR Conversion
// ============================================================================
/**
 * Convert Kernel Graph to Graph IR
 *
 * This is the bridge between Kernel and IR.
 * The kernel only knows about Graphs.
 * Graph IR adds structure and types.
 */
function graphToGraphIR(graph, cycleCount) {
    const module = createGraphIRModule('graph_ir_cycle_' + cycleCount);
    // Set metadata
    module.metadata.set('source_graph', graph.name);
    module.metadata.set('cycle_count', cycleCount);
    module.metadata.set('timestamp', Date.now());
    // Convert graph nodes to IR nodes
    for (let i = 0; i < graph.nodes.length; i++) {
        const nodeName = graph.nodes[i];
        const node = createGraphIRNode('node_' + i, inferNodeType(nodeName), new Map([['original_name', nodeName]]), [], []);
        module.nodes.push(node);
    }
    // Convert graph edges to IR edges
    for (const [source, target] of graph.edges) {
        const edge = createGraphIREdge(source, target, 'data', new Map());
        module.edges.push(edge);
    }
    return module;
}
/**
 * Infer node type from name
 */
function inferNodeType(nodeName) {
    if (nodeName.includes('tensor'))
        return 'tensor';
    if (nodeName.includes('attention'))
        return 'attention';
    if (nodeName.includes('physics'))
        return 'physics';
    if (nodeName.includes('hash'))
        return 'hash';
    if (nodeName.includes('cache'))
        return 'storage';
    return 'generic';
}
// ============================================================================
// 5.1 SCXQ2 Serializer
// ============================================================================
class SCXQ2Serializer {
    constructor() {
        this.name = 'SCXQ2';
    }
    serialize(module) {
        const lines = [];
        lines.push('; SCXQ2 Serialized from Graph IR');
        lines.push('; Module: ' + module.name);
        lines.push('; Version: ' + module.version);
        lines.push('');
        // Serialize nodes as SCXQ2 instructions
        for (const node of module.nodes) {
            const opcode = this.nodeToOpcode(node);
            lines.push('INSTRUCTION ' + opcode + ' ; ' + node.id);
        }
        lines.push('');
        lines.push('; Total: ' + module.nodes.length + ' nodes, ' + module.edges.length + ' edges');
        return lines.join('\n');
    }
    nodeToOpcode(node) {
        switch (node.type) {
            case 'tensor': return 'TENSOR_NEW';
            case 'attention': return 'ATTENTION';
            case 'physics': return 'GEOM_FLOW';
            case 'hash': return 'MEM_STORE';
            case 'storage': return 'MEM_ALLOC';
            default: return 'NOP';
        }
    }
}
exports.SCXQ2Serializer = SCXQ2Serializer;
// ============================================================================
// 5.2 JSON Serializer
// ============================================================================
class JSONSerializer {
    constructor() {
        this.name = 'JSON';
    }
    serialize(module) {
        return JSON.stringify({
            name: module.name,
            version: module.version,
            nodes: module.nodes.map(n => ({
                id: n.id,
                type: n.type,
                attributes: Object.fromEntries(n.attributes),
                inputs: n.inputs,
                outputs: n.outputs
            })),
            edges: module.edges.map(e => ({
                source: e.source,
                target: e.target,
                type: e.type,
                attributes: Object.fromEntries(e.attributes)
            })),
            metadata: Object.fromEntries(module.metadata)
        }, null, 2);
    }
}
exports.JSONSerializer = JSONSerializer;
// ============================================================================
// 5.3 DOT Serializer (Graphviz)
// ============================================================================
class DOTSerializer {
    constructor() {
        this.name = 'DOT';
    }
    serialize(module) {
        const lines = [];
        lines.push('digraph ' + module.name + ' {');
        lines.push('  rankdir=LR;');
        lines.push('');
        // Serialize nodes
        for (const node of module.nodes) {
            lines.push('  ' + node.id + ' [label="' + node.type + '\\n' + node.id + '"];');
        }
        lines.push('');
        // Serialize edges
        for (const edge of module.edges) {
            lines.push('  ' + edge.source + ' -> ' + edge.target + ';');
        }
        lines.push('}');
        return lines.join('\n');
    }
}
exports.DOTSerializer = DOTSerializer;
// ============================================================================
// 5.4 LLVM-like Serializer
// ============================================================================
class LLVMSerializer {
    constructor() {
        this.name = 'LLVM';
    }
    serialize(module) {
        const lines = [];
        lines.push('; Graph IR → LLVM-like IR');
        lines.push('; Module: ' + module.name);
        lines.push('');
        lines.push('define void @' + module.name.replace(/[^a-zA-Z0-9_]/g, '_') + '() {');
        lines.push('entry:');
        // Serialize nodes as LLVM-like instructions
        let regId = 0;
        for (const node of module.nodes) {
            const opcode = this.nodeToLLVMOp(node);
            lines.push('  %' + regId + ' = call ' + opcode + ' ; ' + node.id);
            regId++;
        }
        lines.push('  ret void');
        lines.push('}');
        return lines.join('\n');
    }
    nodeToLLVMOp(node) {
        switch (node.type) {
            case 'tensor': return 'tensor_alloc()';
            case 'attention': return 'attention_compute()';
            case 'physics': return 'physics_step()';
            case 'hash': return 'hash_compute()';
            case 'storage': return 'mem_alloc()';
            default: return 'nop()';
        }
    }
}
exports.LLVMSerializer = LLVMSerializer;
// ============================================================================
// 6. Graph IR Compiler - Selects serializer and compiles
// ============================================================================
class GraphIRCompiler {
    constructor() {
        this.serializers = new Map();
        // Register built-in serializers
        this.registerSerializer(new SCXQ2Serializer());
        this.registerSerializer(new JSONSerializer());
        this.registerSerializer(new DOTSerializer());
        this.registerSerializer(new LLVMSerializer());
    }
    registerSerializer(serializer) {
        this.serializers.set(serializer.name, serializer);
        console.log('  ✓ Registered Graph IR serializer: ' + serializer.name);
    }
    compile(module, format) {
        const serializer = this.serializers.get(format);
        if (!serializer) {
            throw new Error('Unknown Graph IR format: ' + format + '. Available: ' + Array.from(this.serializers.keys()).join(', '));
        }
        console.log('  📊 Compiling Graph IR to ' + format);
        return serializer.serialize(module);
    }
    getAvailableFormats() {
        return Array.from(this.serializers.keys());
    }
}
exports.GraphIRCompiler = GraphIRCompiler;
