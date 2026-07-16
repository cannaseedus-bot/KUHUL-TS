"use strict";
/**
 * 🧠 Transformer Plugin for K'UHUL Kernel
 *
 * Capability-specific plugin (not "AI" which is too broad).
 * Adds transformer architecture nodes to folds.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransformerPlugin = createTransformerPlugin;
const Kernel_1 = require("../kernel/Kernel");
/**
 * Transformer Plugin - Adds self-attention architecture nodes
 *
 * Installs nodes into:
 *   - Wo: Build Q/K/V projections
 *   - Sek: Compute attention, apply softmax, project output
 *   - Chen: Add residual, apply layer norm
 */
function createTransformerPlugin() {
    const nodes = new Map();
    // Wo Fold: Build transformer structures
    nodes.set('Wo', [
        (0, Kernel_1.createNode)('build_q_projection', (g) => {
            const result = {
                ...g,
                name: 'QProjectionGraph',
                nodes: [...g.nodes, 'q_proj'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🧠 Transformer: Built Q projection');
            return result;
        }),
        (0, Kernel_1.createNode)('build_k_projection', (g) => {
            const result = {
                ...g,
                name: 'KProjectionGraph',
                nodes: [...g.nodes, 'k_proj'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🧠 Transformer: Built K projection');
            return result;
        }),
        (0, Kernel_1.createNode)('build_v_projection', (g) => {
            const result = {
                ...g,
                name: 'VProjectionGraph',
                nodes: [...g.nodes, 'v_proj'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🧠 Transformer: Built V projection');
            return result;
        }),
        (0, Kernel_1.createNode)('build_attention_mask', (g) => {
            const result = {
                ...g,
                name: 'AttentionMaskGraph',
                nodes: [...g.nodes, 'attn_mask'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🧠 Transformer: Built attention mask');
            return result;
        })
    ]);
    // Sek Fold: Execute transformer
    nodes.set('Sek', [
        (0, Kernel_1.createNode)('compute_qk_attention', (g) => {
            const result = {
                ...g,
                name: 'QKAttentionGraph',
                nodes: [...g.nodes],
                edges: [...g.edges, ['q_proj', 'k_proj']],
                data: g.data
            };
            console.log('      🧠 Transformer: Computed QK^T attention');
            return result;
        }),
        (0, Kernel_1.createNode)('apply_softmax', (g) => {
            const result = {
                ...g,
                name: 'SoftmaxGraph',
                nodes: [...g.nodes, 'attn_probs'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🧠 Transformer: Applied softmax');
            return result;
        }),
        (0, Kernel_1.createNode)('apply_attention_to_v', (g) => {
            const result = {
                ...g,
                name: 'AttentionOutputGraph',
                nodes: [...g.nodes, 'attn_output'],
                edges: [...g.edges, ['attn_probs', 'v_proj']],
                data: g.data
            };
            console.log('      🧠 Transformer: Applied attention to V');
            return result;
        }),
        (0, Kernel_1.createNode)('project_output', (g) => {
            const result = {
                ...g,
                name: 'OutputProjectionGraph',
                nodes: [...g.nodes, 'output_proj'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🧠 Transformer: Projected output');
            return result;
        })
    ]);
    // Chen Fold: Post-process
    nodes.set('Chen', [
        (0, Kernel_1.createNode)('add_residual', (g) => {
            const result = {
                ...g,
                name: 'ResidualGraph',
                nodes: [...g.nodes, 'residual'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🧠 Transformer: Added residual connection');
            return result;
        }),
        (0, Kernel_1.createNode)('apply_layer_norm', (g) => {
            const result = {
                ...g,
                name: 'LayerNormGraph',
                nodes: [...g.nodes, 'normalized'],
                edges: [...g.edges],
                data: g.data
            };
            console.log('      🧠 Transformer: Applied layer norm');
            return result;
        })
    ]);
    return (0, Kernel_1.createPlugin)('TransformerPlugin', nodes);
}
