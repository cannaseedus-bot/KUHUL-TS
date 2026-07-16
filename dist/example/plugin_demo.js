"use strict";
/**
 * 🔌 K'UHUL KERNEL PLUGIN DEMONSTRATION
 *
 * Shows how the kernel is domain-agnostic and plugins add functionality:
 *   - Kernel: Folds + Nodes + XCFE + Graphs (no domain knowledge)
 *   - AI Plugin: Adds transformer/attention nodes
 *   - Physics Plugin: Adds N-body simulation nodes
 *   - LoRA Plugin: Adds low-rank adaptation nodes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Kernel_1 = require("../kernel/Kernel");
const AIPlugin_1 = require("../plugins/AIPlugin");
const PhysicsPlugin_1 = require("../plugins/PhysicsPlugin");
async function main() {
    console.log('='.repeat(80));
    console.log('🔌 K\'UHUL KERNEL PLUGIN DEMONSTRATION');
    console.log('   Domain-Agnostic Kernel + Domain-Specific Plugins');
    console.log('='.repeat(80));
    console.log('');
    // ============================================================
    // 1. Create Base Kernel (No Domain Knowledge)
    // ============================================================
    console.log('1️⃣  Creating Base Kernel (Domain-Agnostic)...');
    console.log('');
    const baseKernel = new Kernel_1.KuhulKernel({
        deterministic: true,
        replayEnabled: true,
        maxCycles: 1
    });
    console.log('');
    console.log('   Base Kernel Components:');
    console.log('     • Folds: Pop, Wo, Sek, Chen, Xul');
    console.log('     • Nodes: load, parse, plan, allocate, transform, compute, project, emit, store, hash');
    console.log('     • XCFE: Transition engine');
    console.log('     • NO AI, NO Physics, NO Domain Knowledge');
    console.log('');
    // ============================================================
    // 2. Run Base Kernel (Generic Transformations Only)
    // ============================================================
    console.log('2️⃣  Running Base Kernel (1 Cycle)...');
    console.log('');
    const baseGraph = await baseKernel.run(1);
    console.log('');
    console.log('   Base Result:');
    console.log(`     Graph: ${baseGraph.name}`);
    console.log(`     Nodes: ${baseGraph.nodes.length}`);
    console.log(`     Edges: ${baseGraph.edges.length}`);
    console.log('');
    // ============================================================
    // 3. Create Kernel with AI Plugin
    // ============================================================
    console.log('3️⃣  Creating Kernel with AI Plugin...');
    console.log('');
    const aiKernel = new Kernel_1.KuhulKernel({
        deterministic: true,
        replayEnabled: true,
        maxCycles: 1
    });
    // Install AI plugin (adds transformer nodes)
    aiKernel.installPlugin((0, AIPlugin_1.createAIPlugin)());
    console.log('');
    console.log('   AI Plugin Added:');
    console.log('     • Wo: ai_build_qkv, ai_build_attention_mask');
    console.log('     • Sek: ai_compute_qk_attention, ai_apply_softmax, ai_apply_attention_to_v, ai_output_projection');
    console.log('     • Chen: ai_add_residual, ai_layer_norm');
    console.log('');
    // ============================================================
    // 4. Run AI Kernel (Transformer Transformations)
    // ============================================================
    console.log('4️⃣  Running AI Kernel (1 Cycle)...');
    console.log('');
    const aiGraph = await aiKernel.run(1);
    console.log('');
    console.log('   AI Result:');
    console.log(`     Graph: ${aiGraph.name}`);
    console.log(`     Nodes: ${aiGraph.nodes.length}`);
    console.log(`     Edges: ${aiGraph.edges.length}`);
    console.log('');
    // ============================================================
    // 5. Create Kernel with Multiple Plugins
    // ============================================================
    console.log('5️⃣  Creating Kernel with AI + LoRA + MoE Plugins...');
    console.log('');
    const multiKernel = new Kernel_1.KuhulKernel({
        deterministic: true,
        replayEnabled: true,
        maxCycles: 1
    });
    // Install multiple plugins
    multiKernel.installPlugin((0, AIPlugin_1.createAIPlugin)());
    multiKernel.installPlugin((0, AIPlugin_1.createLoRAPlugin)());
    multiKernel.installPlugin((0, AIPlugin_1.createMoEPlugin)());
    console.log('');
    console.log('   Plugins Installed:');
    console.log('     • AI: Transformer nodes');
    console.log('     • LoRA: Low-rank adaptation nodes');
    console.log('     • MoE: Mixture of experts nodes');
    console.log('');
    // ============================================================
    // 6. Run Multi-Plugin Kernel
    // ============================================================
    console.log('6️⃣  Running Multi-Plugin Kernel (1 Cycle)...');
    console.log('');
    const multiGraph = await multiKernel.run(1);
    console.log('');
    console.log('   Multi-Plugin Result:');
    console.log(`     Graph: ${multiGraph.name}`);
    console.log(`     Nodes: ${multiGraph.nodes.length}`);
    console.log(`     Edges: ${multiGraph.edges.length}`);
    console.log('');
    // ============================================================
    // 7. Create Kernel with Physics Plugin
    // ============================================================
    console.log('7️⃣  Creating Kernel with Physics Plugin...');
    console.log('');
    const physicsKernel = new Kernel_1.KuhulKernel({
        deterministic: true,
        replayEnabled: true,
        maxCycles: 1
    });
    // Install physics plugin
    physicsKernel.installPlugin((0, PhysicsPlugin_1.createPhysicsPlugin)());
    console.log('');
    console.log('   Physics Plugin Added:');
    console.log('     • Wo: physics_build_bodies, physics_build_fields');
    console.log('     • Sek: physics_apply_forces, physics_integrate, physics_detect_collisions, physics_resolve_collisions');
    console.log('     • Chen: physics_emit_state');
    console.log('');
    // ============================================================
    // 8. Run Physics Kernel
    // ============================================================
    console.log('8️⃣  Running Physics Kernel (1 Cycle)...');
    console.log('');
    const physicsGraph = await physicsKernel.run(1);
    console.log('');
    console.log('   Physics Result:');
    console.log(`     Graph: ${physicsGraph.name}`);
    console.log(`     Nodes: ${physicsGraph.nodes.length}`);
    console.log(`     Edges: ${physicsGraph.edges.length}`);
    console.log('');
    // ============================================================
    // 9. Comparison
    // ============================================================
    console.log('='.repeat(80));
    console.log('9️⃣  COMPARISON - Kernel + Plugins');
    console.log('='.repeat(80));
    console.log('');
    console.log('   Configuration          | Nodes | Edges | Domain Knowledge');
    console.log('   ───────────────────────┼───────┼───────┼──────────────────');
    console.log('   Base Kernel            | ' + baseGraph.nodes.length.toString().padEnd(5) + ' | ' + baseGraph.edges.length.toString().padEnd(5) + ' | None (Generic)');
    console.log('   + AI Plugin            | ' + aiGraph.nodes.length.toString().padEnd(5) + ' | ' + aiGraph.edges.length.toString().padEnd(5) + ' | Transformers');
    console.log('   + AI+LoRA+MoE          | ' + multiGraph.nodes.length.toString().padEnd(5) + ' | ' + multiGraph.edges.length.toString().padEnd(5) + ' | MoE Architecture');
    console.log('   + Physics Plugin       | ' + physicsGraph.nodes.length.toString().padEnd(5) + ' | ' + physicsGraph.edges.length.toString().padEnd(5) + ' | N-Body Simulation');
    console.log('');
    // ============================================================
    // 10. Summary
    // ============================================================
    console.log('='.repeat(80));
    console.log('✅ PLUGIN DEMONSTRATION COMPLETE');
    console.log('='.repeat(80));
    console.log('');
    console.log('   Key Insights:');
    console.log('');
    console.log('   1. Kernel is Domain-Agnostic ✓');
    console.log('      • Knows: Folds, Nodes, XCFE, Graphs');
    console.log('      • Doesn\'t Know: AI, Physics, SVG, Databases');
    console.log('');
    console.log('   2. Plugins Add Domain Knowledge ✓');
    console.log('      • AI Plugin: Transformers, Attention, LoRA, MoE');
    console.log('      • Physics Plugin: N-Body, Fluids, Collisions');
    console.log('      • More Plugins: SVG, Database, Networking, etc.');
    console.log('');
    console.log('   3. Same Kernel, Different Applications ✓');
    console.log('      • Base: Generic graph transformations');
    console.log('      • +AI: Transformer inference');
    console.log('      • +Physics: Physics simulation');
    console.log('      • +All: Multi-domain execution');
    console.log('');
    console.log('   4. Linux Analogy ✓');
    console.log('      • Linux: processes, memory, files (kernel)');
    console.log('      • Photoshop, Blender, Chrome (plugins)');
    console.log('      • KUHUL: folds, nodes, XCFE, graphs (kernel)');
    console.log('      • AI, Physics, SVG (plugins)');
    console.log('');
    console.log('   Architecture:');
    console.log('');
    console.log('     K\'UHUL Kernel v1.0 (Domain-Agnostic)');
    console.log('           ↓');
    console.log('     Plugin System');
    console.log('           ↓');
    console.log('     AI │ Physics │ SVG │ Database │ ...');
    console.log('           ↓');
    console.log('     Applications');
    console.log('');
    console.log('   This is the correct foundation! 🏛️');
    console.log('');
}
main().catch(console.error);
