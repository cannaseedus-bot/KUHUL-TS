"use strict";
/**
 * 📊 GRAPH IR DEMONSTRATION
 *
 * Shows the new architecture:
 *   Kernel → Graph IR → Multiple Formats (SCXQ2, JSON, DOT, LLVM)
 *
 * The kernel only knows about graphs.
 * Graph IR is the serialization layer.
 * Multiple output formats without changing the kernel.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Kernel_1 = require("../kernel/Kernel");
const TransformerPlugin_1 = require("../plugins/TransformerPlugin");
const GraphIR_1 = require("../graph_ir/GraphIR");
async function main() {
    console.log('='.repeat(80));
    console.log('📊 GRAPH IR DEMONSTRATION');
    console.log('   Kernel → Graph IR → Multiple Formats');
    console.log('='.repeat(80));
    console.log('');
    // ============================================================
    // 1. Create Kernel with Transformer Plugin
    // ============================================================
    console.log('1️⃣  Creating Kernel with Transformer Plugin...');
    console.log('');
    const kernel = new Kernel_1.KuhulKernel({
        deterministic: true,
        replayEnabled: true,
        maxCycles: 1
    });
    // Install transformer plugin (capability-specific, not "AI")
    kernel.installPlugin((0, TransformerPlugin_1.createTransformerPlugin)());
    console.log('');
    console.log('   Plugin Installed:');
    console.log('     • Transformer: Q/K/V projections, attention, softmax, residual, layer norm');
    console.log('');
    // ============================================================
    // 2. Run Kernel Cycle
    // ============================================================
    console.log('2️⃣  Running Kernel (1 Cycle)...');
    console.log('');
    const graph = await kernel.run(1);
    console.log('');
    console.log('   Kernel Result:');
    console.log(`     Graph: ${graph.name}`);
    console.log(`     Nodes: ${graph.nodes.length}`);
    console.log(`     Edges: ${graph.edges.length}`);
    console.log('');
    // ============================================================
    // 3. Convert to Graph IR
    // ============================================================
    console.log('3️⃣  Converting Kernel Graph to Graph IR...');
    console.log('');
    const graphIR = (0, GraphIR_1.graphToGraphIR)(graph, kernel.getCycleCount());
    console.log('   Graph IR Module:');
    console.log(`     Name: ${graphIR.name}`);
    console.log(`     Version: ${graphIR.version}`);
    console.log(`     Nodes: ${graphIR.nodes.length}`);
    console.log(`     Edges: ${graphIR.edges.length}`);
    console.log(`     Metadata entries: ${graphIR.metadata.size}`);
    console.log('');
    // ============================================================
    // 4. Compile to Multiple Formats
    // ============================================================
    console.log('4️⃣  Compiling Graph IR to Multiple Formats...');
    console.log('');
    const compiler = new GraphIR_1.GraphIRCompiler();
    console.log('   Available formats:', compiler.getAvailableFormats().join(', '));
    console.log('');
    // SCXQ2
    const scxq2 = compiler.compile(graphIR, 'SCXQ2');
    console.log('');
    console.log('   ✓ SCXQ2 Format (' + scxq2.length + ' bytes)');
    console.log('   --- Preview ---');
    console.log(scxq2.split('\n').slice(0, 10).join('\n'));
    console.log('');
    // JSON
    const json = compiler.compile(graphIR, 'JSON');
    console.log('');
    console.log('   ✓ JSON Format (' + json.length + ' bytes)');
    console.log('   --- Preview ---');
    console.log(json.split('\n').slice(0, 15).join('\n'));
    console.log('');
    // DOT (Graphviz)
    const dot = compiler.compile(graphIR, 'DOT');
    console.log('');
    console.log('   ✓ DOT Format (' + dot.length + ' bytes)');
    console.log('   --- Preview ---');
    console.log(dot.split('\n').slice(0, 15).join('\n'));
    console.log('');
    // LLVM-like
    const llvm = compiler.compile(graphIR, 'LLVM');
    console.log('');
    console.log('   ✓ LLVM-like Format (' + llvm.length + ' bytes)');
    console.log('   --- Preview ---');
    console.log(llvm.split('\n').slice(0, 15).join('\n'));
    console.log('');
    // ============================================================
    // 5. Summary
    // ============================================================
    console.log('='.repeat(80));
    console.log('5️⃣  ARCHITECTURE SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    console.log('   New Architecture:');
    console.log('');
    console.log('     Kernel (Domain-Agnostic)');
    console.log('           ↓');
    console.log('     Graph IR (Serialization Layer)');
    console.log('           ↓');
    console.log('     SCXQ2 │ JSON │ DOT │ LLVM │ ...');
    console.log('           ↓');
    console.log('     Backend / Tools');
    console.log('');
    console.log('   Key Benefits:');
    console.log('');
    console.log('     1. Kernel Independence ✓');
    console.log('        • Kernel only knows about graphs');
    console.log('        • Doesn\'t know about SCXQ2, JSON, DOT, LLVM');
    console.log('');
    console.log('     2. Multiple Output Formats ✓');
    console.log('        • SCXQ2: Backend compilation');
    console.log('        • JSON: Interchange, debugging');
    console.log('        • DOT: Visualization (Graphviz)');
    console.log('        • LLVM: Further compilation');
    console.log('');
    console.log('     3. Extensibility ✓');
    console.log('        • Add new formats without changing kernel');
    console.log('        • Implement GraphIRSerializer interface');
    console.log('        • Register with GraphIRCompiler');
    console.log('');
    console.log('     4. Clean Boundaries ✓');
    console.log('        • Kernel: Folds, Nodes, XCFE, Graphs');
    console.log('        • Graph IR: Structured representation');
    console.log('        • Serializers: Format-specific output');
    console.log('');
    console.log('   This is the correct foundation! 🏛️');
    console.log('');
}
main().catch(console.error);
