"use strict";
/**
 * 🧠 AI Plugin for K'UHUL Kernel
 *
 * This is a DOMAIN-SPECIFIC EXTENSION that attaches AI/ML nodes to folds.
 * The kernel doesn't know about transformers, tensors, or attention.
 * This plugin adds that knowledge.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAIPlugin = createAIPlugin;
exports.createLoRAPlugin = createLoRAPlugin;
exports.createMoEPlugin = createMoEPlugin;
const Kernel_1 = require("../kernel/Kernel");
/**
 * AI Plugin - Adds transformer/attention nodes to the kernel
 *
 * Installs nodes into:
 *   - Wo: Build Q/K/V tensors, attention structures
 *   - Sek: Compute attention, matmul, softmax
 *   - Chen: Project outputs
 */
function createAIPlugin() {
    const nodes = new Map();
    // Wo Fold: Build execution structures
    nodes.set('Wo', [
        (0, Kernel_1.createNode)('ai_build_qkv', (g) => {
            // Build query, key, value tensors
            const result = {
                ...g,
                name: 'QKVGraph',
                nodes: [...g.nodes, 'q_tensor', 'k_tensor', 'v_tensor'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🧠 AI: Built Q/K/V tensors');
            return result;
        }),
        (0, Kernel_1.createNode)('ai_build_attention_mask', (g) => {
            // Build attention mask
            const result = {
                ...g,
                name: 'AttentionMaskGraph',
                nodes: [...g.nodes, 'attention_mask'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🧠 AI: Built attention mask');
            return result;
        })
    ]);
    // Sek Fold: Execute compute
    nodes.set('Sek', [
        (0, Kernel_1.createNode)('ai_compute_qk_attention', (g) => {
            // Compute Q @ K^T
            const result = {
                ...g,
                name: 'QKAttentionGraph',
                nodes: [...g.nodes],
                edges: [...g.edges, ['q_tensor', 'k_tensor']],
                data: g.data
            };
            console.log('      🧠 AI: Computed QK^T attention');
            return result;
        }),
        (0, Kernel_1.createNode)('ai_apply_softmax', (g) => {
            // Apply softmax to attention scores
            const result = {
                ...g,
                name: 'SoftmaxGraph',
                nodes: [...g.nodes, 'attention_probs'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🧠 AI: Applied softmax');
            return result;
        }),
        (0, Kernel_1.createNode)('ai_apply_attention_to_v', (g) => {
            // Apply attention to V
            const result = {
                ...g,
                name: 'AttentionOutputGraph',
                nodes: [...g.nodes, 'attention_output'],
                edges: [...g.edges, ['attention_probs', 'v_tensor']],
                data: g.data
            };
            console.log('      🧠 AI: Applied attention to V');
            return result;
        }),
        (0, Kernel_1.createNode)('ai_output_projection', (g) => {
            // Output projection
            const result = {
                ...g,
                name: 'OutputProjectionGraph',
                nodes: [...g.nodes, 'projected_output'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🧠 AI: Projected output');
            return result;
        })
    ]);
    // Chen Fold: Emit results
    nodes.set('Chen', [
        (0, Kernel_1.createNode)('ai_add_residual', (g) => {
            // Add residual connection
            const result = {
                ...g,
                name: 'ResidualGraph',
                nodes: [...g.nodes, 'residual_output'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🧠 AI: Added residual connection');
            return result;
        }),
        (0, Kernel_1.createNode)('ai_layer_norm', (g) => {
            // Apply layer normalization
            const result = {
                ...g,
                name: 'LayerNormGraph',
                nodes: [...g.nodes, 'normalized_output'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🧠 AI: Applied layer norm');
            return result;
        })
    ]);
    return (0, Kernel_1.createPlugin)('AIPlugin', nodes);
}
/**
 * LoRA Plugin - Low-Rank Adaptation
 *
 * Installs nodes into:
 *   - Wo: Build LoRA matrices
 *   - Sek: Apply LoRA adaptation
 */
function createLoRAPlugin() {
    const nodes = new Map();
    // Wo Fold: Build LoRA structures
    nodes.set('Wo', [
        (0, Kernel_1.createNode)('lora_build_matrices', (g) => {
            // Build LoRA A and B matrices
            const result = {
                ...g,
                name: 'LoRAGraph',
                nodes: [...g.nodes, 'lora_A', 'lora_B'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🔧 LoRA: Built A/B matrices');
            return result;
        })
    ]);
    // Sek Fold: Apply LoRA
    nodes.set('Sek', [
        (0, Kernel_1.createNode)('lora_apply_adaptation', (g) => {
            // Apply LoRA: W + BA
            const result = {
                ...g,
                name: 'LoRAAdaptedGraph',
                nodes: [...g.nodes, 'adapted_weights'],
                edges: [...g.edges, ['lora_A', 'lora_B']],
                data: g.data
            };
            console.log('      🔧 LoRA: Applied adaptation');
            return result;
        })
    ]);
    return (0, Kernel_1.createPlugin)('LoRAPlugin', nodes);
}
/**
 * Expert/MoE Plugin - Mixture of Experts
 *
 * Installs nodes into:
 *   - Wo: Build expert routers
 *   - Sek: Route to experts, combine outputs
 */
function createMoEPlugin() {
    const nodes = new Map();
    // Wo Fold: Build MoE structures
    nodes.set('Wo', [
        (0, Kernel_1.createNode)('moe_build_router', (g) => {
            // Build gating network
            const result = {
                ...g,
                name: 'MoERouterGraph',
                nodes: [...g.nodes, 'gate_network', 'expert_1', 'expert_2'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🎯 MoE: Built router and experts');
            return result;
        })
    ]);
    // Sek Fold: Execute MoE
    nodes.set('Sek', [
        (0, Kernel_1.createNode)('moe_route_tokens', (g) => {
            // Route tokens to experts
            const result = {
                ...g,
                name: 'MoERoutedGraph',
                nodes: [...g.nodes, 'routed_tokens'],
                edges: [...g.edges, ['gate_network', 'expert_1']],
                data: g.data
            };
            console.log('      🎯 MoE: Routed tokens to experts');
            return result;
        }),
        (0, Kernel_1.createNode)('moe_combine_outputs', (g) => {
            // Combine expert outputs
            const result = {
                ...g,
                name: 'MoECombinedGraph',
                nodes: [...g.nodes, 'combined_output'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🎯 MoE: Combined expert outputs');
            return result;
        })
    ]);
    return (0, Kernel_1.createPlugin)('MoEPlugin', nodes);
}
