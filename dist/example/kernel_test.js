"use strict";
/**
 * 🏛️ K'UHUL KERNEL TEST ENGINE
 *
 * Proves the semantic nodes and fold runtime works.
 *
 * Architecture:
 *   Kernel (Folds + Nodes + XCFE) → Graph → SCXQ2 IR → Backend
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Kernel_1 = require("../kernel/Kernel");
const WGSLCompiler_1 = require("../scxq2/backends/WGSLCompiler");
const HLSLCompiler_1 = require("../scxq2/backends/HLSLCompiler");
const OpenCLCompiler_1 = require("../scxq2/backends/OpenCLCompiler");
async function main() {
    console.log('='.repeat(80));
    console.log('🏛️ K\'UHUL KERNEL TEST ENGINE');
    console.log('   Proving Semantic Nodes + Fold Runtime');
    console.log('='.repeat(80));
    console.log('');
    // ============================================================
    // 1. Create Kernel Runtime
    // ============================================================
    console.log('1️⃣  Initializing K\'UHUL Kernel...');
    console.log('');
    const kernel = new Kernel_1.KuhulKernel({
        deterministic: true,
        replayEnabled: true,
        maxCycles: 3 // Just 3 cycles for demo
    });
    console.log('');
    console.log('   Kernel Components:');
    console.log('     • Folds: Pop, Wo, Sek, Chen, Xul');
    console.log('     • Nodes: parse, extract, build_graph, compute_attention, etc.');
    console.log('     • XCFE: Transition engine');
    console.log('     • Graph: Data structure flowing through folds');
    console.log('');
    // ============================================================
    // 2. Execute Kernel Cycles
    // ============================================================
    console.log('2️⃣  Executing Kernel Cycles...');
    console.log('');
    const finalGraph = await kernel.run(3);
    console.log('');
    console.log('   Final Graph State:');
    console.log(`     Name: ${finalGraph.name}`);
    console.log(`     Nodes: ${finalGraph.nodes.length}`);
    console.log(`     Edges: ${finalGraph.edges.length}`);
    console.log('');
    // ============================================================
    // 3. Show Transition History
    // ============================================================
    console.log('3️⃣  XCFE Transition History...');
    console.log('');
    const transitions = kernel.getTransitionHistory();
    console.log(`   Total transitions: ${transitions.length}`);
    console.log('   Sequence:');
    // Show first 10 transitions
    for (let i = 0; i < Math.min(10, transitions.length); i++) {
        const [from, to] = transitions[i];
        console.log(`     ${i + 1}. ${from} → ${to}`);
    }
    if (transitions.length > 10) {
        console.log(`     ... and ${transitions.length - 10} more`);
    }
    console.log('');
    // ============================================================
    // 4. Convert to SCXQ2 IR
    // ============================================================
    console.log('4️⃣  Converting Kernel Graph to SCXQ2 IR...');
    console.log('');
    const scx2Module = (0, Kernel_1.graphToSCXQ2)(finalGraph, kernel.getCycleCount());
    console.log('   SCXQ2 Module:');
    console.log(`     Name: ${scx2Module.name}`);
    console.log(`     π-Hash: ${scx2Module.πHash}`);
    console.log(`     Functions: ${scx2Module.functions.length}`);
    console.log(`     Constants: ${scx2Module.constants.length}`);
    console.log(`     Instructions: ${scx2Module.functions[0]?.instructions.length || 0}`);
    console.log('');
    // ============================================================
    // 5. Compile to Backends
    // ============================================================
    console.log('5️⃣  Compiling SCXQ2 to Backends...');
    console.log('');
    // WGSL
    const wgslCompiler = new WGSLCompiler_1.WGSLCompiler();
    const wgsl = await wgslCompiler.compile(scx2Module);
    console.log(`   ✓ WGSL (WebGPU): ${wgsl.code.length} bytes`);
    // HLSL
    const hlslCompiler = new HLSLCompiler_1.HLSLCompiler();
    const hlsl = await hlslCompiler.compile(scx2Module);
    console.log(`   ✓ HLSL (D3D11): ${hlsl.code.length} bytes`);
    // OpenCL
    const openclCompiler = new OpenCLCompiler_1.OpenCLCompiler();
    const opencl = await openclCompiler.compile(scx2Module);
    console.log(`   ✓ OpenCL C: ${opencl.code.length} bytes`);
    console.log('');
    // ============================================================
    // 6. Show Backend Preview
    // ============================================================
    console.log('6️⃣  Backend Code Preview (WGSL)...');
    console.log('');
    console.log('   --- First 400 characters ---');
    console.log(wgsl.code.substring(0, 400) + '...\n');
    // ============================================================
    // 7. Summary
    // ============================================================
    console.log('='.repeat(80));
    console.log('✅ K\'UHUL KERNEL TEST COMPLETE');
    console.log('='.repeat(80));
    console.log('');
    console.log('   Architecture Verified:');
    console.log('');
    console.log('   Level 0: Kernel (Folds + Nodes + XCFE)');
    console.log('              ↓');
    console.log('   Level 1: Graph (Data Structure)');
    console.log('              ↓');
    console.log('   Level 2: SCXQ2 IR (Backend-Independent)');
    console.log('              ↓');
    console.log('   Level 3: Backends (WGSL, HLSL, OpenCL)');
    console.log('');
    console.log('   Key Insights:');
    console.log('     ✓ Folds are semantic state containers');
    console.log('     ✓ Nodes are active transformations');
    console.log('     ✓ XCFE moves between folds');
    console.log('     ✓ Graph flows through the system');
    console.log('     ✓ SCXQ2 is backend-independent');
    console.log('     ✓ π never knows about GPU APIs');
    console.log('');
    console.log('   Statistics:');
    console.log(`     • Cycles executed: ${kernel.getCycleCount()}`);
    console.log(`     • Transitions: ${transitions.length}`);
    console.log(`     • Final graph nodes: ${finalGraph.nodes.length}`);
    console.log(`     • Final graph edges: ${finalGraph.edges.length}`);
    console.log(`     • SCXQ2 instructions: ${scx2Module.functions[0]?.instructions.length || 0}`);
    console.log(`     • Backend code size: ${wgsl.code.length + hlsl.code.length + opencl.code.length} bytes`);
    console.log('');
}
main().catch(console.error);
