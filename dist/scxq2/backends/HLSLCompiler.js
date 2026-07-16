"use strict";
/**
 * SCXQ2 → HLSL Compiler
 *
 * Compiles SCXQ2 IR to D3D11 HLSL compute shaders
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HLSLCompiler = void 0;
class HLSLCompiler {
    constructor() {
        this.name = 'HLSL';
    }
    async compile(module) {
        const shaders = [];
        const resources = [];
        for (const func of module.functions) {
            const shader = this.compileFunction(func, resources);
            shaders.push(shader);
        }
        const constants = this.generateConstants(module.constants);
        const hlsl = [
            '// SCXQ2 → HLSL Compiled Output',
            `// Module: ${module.name}`,
            `// π-Hash: ${module.πHash}`,
            '',
            constants,
            '',
            ...shaders
        ].join('\n');
        return {
            code: hlsl,
            sourceLanguage: 'HLSL',
            entryPoint: module.functions[0]?.name || 'main',
            resources
        };
    }
    compileFunction(func, resources) {
        const lines = [];
        lines.push(`// Function: ${func.name}`);
        lines.push(`// π-Hash: ${func.πHash}`);
        lines.push('');
        // Constant buffer
        lines.push('cbuffer Constants : register(b0) {');
        lines.push('  uint global_id;');
        lines.push('  float π_value;');
        lines.push('};');
        lines.push('');
        // Structured buffers
        let binding = 0;
        for (const param of func.parameters) {
            if (param.type.includes('Tensor')) {
                resources.push({
                    type: 'buffer',
                    name: param.name,
                    binding: binding++
                });
                lines.push(`RWStructuredBuffer<float> ${param.name} : register(u${resources.length - 1});`);
            }
        }
        lines.push('');
        // Compute shader entry point
        lines.push('[numthreads(64, 1, 1)]');
        lines.push(`void ${func.name}(uint3 dispatchThreadID : SV_DispatchThreadID) {`);
        // Generate instructions
        for (const instruction of func.instructions) {
            const hlslCode = this.compileInstruction(instruction);
            lines.push(`  ${hlslCode}`);
        }
        lines.push('}');
        lines.push('');
        return lines.join('\n');
    }
    compileInstruction(instr) {
        switch (instr.opcode) {
            case 'NOP':
                return '// NOP';
            case 'HALT':
                return 'return;';
            case 'FADD':
                return 'result = operand_a + operand_b;';
            case 'FSUB':
                return 'result = operand_a - operand_b;';
            case 'FMUL':
                return 'result = operand_a * operand_b;';
            case 'FDIV':
                return 'result = operand_a / operand_b;';
            case 'FSQRT':
                return 'result = sqrt(operand);';
            case 'TENSOR_MATMUL':
                return this.matrixMultiplyHLSL();
            case 'GLYPH_PI':
                return `const float π = ${Math.PI};`;
            case 'GLYPH_PHI':
                return `const float φ = ${(1 + Math.sqrt(5)) / 2};`;
            default:
                return `// Unknown opcode: ${instr.opcode}`;
        }
    }
    matrixMultiplyHLSL() {
        return `
      // Matrix multiply
      for (uint i = 0; i < rows_a; i++) {
        for (uint j = 0; j < cols_b; j++) {
          float sum = 0.0f;
          for (uint k = 0; k < cols_a; k++) {
            sum += matrix_a[i * cols_a + k] * matrix_b[k * cols_b + j];
          }
          matrix_c[i * cols_b + j] = sum;
        }
      }
    `.trim();
    }
    generateConstants(constants) {
        const lines = [];
        for (const constant of constants) {
            const value = typeof constant.value === 'number'
                ? constant.value.toFixed(15)
                : JSON.stringify(constant.value);
            lines.push(`static const float ${constant.name} = ${value};`);
        }
        return lines.join('\n');
    }
}
exports.HLSLCompiler = HLSLCompiler;
