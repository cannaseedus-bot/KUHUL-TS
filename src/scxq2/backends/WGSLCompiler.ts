/**
 * SCXQ2 → WGSL Compiler
 * 
 * Compiles SCXQ2 IR to WebGPU WGSL shaders
 */

import { 
  SCXQ2Module, 
  SCXQ2Function, 
  SCXQ2Instruction, 
  SCXQ2BackendCompiler, 
  CompiledBackend,
  BackendResource 
} from '../SCXQ2_IR';

export class WGSLCompiler implements SCXQ2BackendCompiler {
  readonly name = 'WGSL';

  async compile(module: SCXQ2Module): Promise<CompiledBackend> {
    const shaders: string[] = [];
    const resources: BackendResource[] = [];
    
    // Generate WGSL for each function
    for (const func of module.functions) {
      const shader = this.compileFunction(func, resources);
      shaders.push(shader);
    }
    
    // Add constants
    const constants = this.generateConstants(module.constants);
    
    // Combine into final WGSL
    const wgsl = [
      '// SCXQ2 → WGSL Compiled Output',
      `// Module: ${module.name}`,
      `// π-Hash: ${module.πHash}`,
      '',
      constants,
      '',
      ...shaders
    ].join('\n');
    
    return {
      code: wgsl,
      sourceLanguage: 'WGSL',
      entryPoint: module.functions[0]?.name || 'main',
      resources
    };
  }

  /**
   * Compile SCXQ2 function to WGSL compute shader
   */
  private compileFunction(func: SCXQ2Function, resources: BackendResource[]): string {
    const lines: string[] = [];
    
    // Function header
    lines.push(`// Function: ${func.name}`);
    lines.push(`// π-Hash: ${func.πHash}`);
    lines.push('');
    
    // Bindings for tensors
    let binding = 0;
    for (const param of func.parameters) {
      if (param.type.includes('Tensor')) {
        resources.push({
          type: 'buffer',
          name: param.name,
          binding: binding++
        });
      }
    }
    
    // Compute shader entry point
    lines.push(`@compute @workgroup_size(64)`);
    lines.push(`fn ${func.name}(`);
    lines.push(`  @builtin(global_invocation_id) global_id: vec3<u32>`);
    
    // Add buffer bindings
    for (let i = 0; i < resources.length; i++) {
      const res = resources[i];
      lines.push(`  @group(0) @binding(${res.binding}) var<storage, read_write> ${res.name}: array<f32>,`);
    }
    
    lines.push(`) {`);
    
    // Generate instructions
    for (const instruction of func.instructions) {
      const wgslCode = this.compileInstruction(instruction);
      lines.push(`  ${wgslCode}`);
    }
    
    lines.push('}');
    lines.push('');
    
    return lines.join('\n');
  }

  /**
   * Compile SCXQ2 instruction to WGSL
   */
  private compileInstruction(instr: SCXQ2Instruction): string {
    switch (instr.opcode) {
      // Control Flow
      case 'NOP':
        return '// NOP';
      
      case 'HALT':
        return 'return;';
      
      case 'ENTER':
        return '// Enter fold';
      
      case 'LEAVE':
        return '// Leave fold';
      
      // Arithmetic
      case 'FADD':
        return this.binaryOp('+');
      
      case 'FSUB':
        return this.binaryOp('-');
      
      case 'FMUL':
        return this.binaryOp('*');
      
      case 'FDIV':
        return this.binaryOp('/');
      
      case 'FSQRT':
        return 'result = sqrt(operand);';
      
      case 'FPOW':
        return 'result = pow(operand1, operand2);';
      
      // Tensor Operations
      case 'TENSOR_NEW':
        return '// Allocate tensor';
      
      case 'TENSOR_MATMUL':
        return this.matrixMultiply();
      
      case 'TENSOR_ADD':
        return 'result = tensor_a + tensor_b;';
      
      case 'TENSOR_SUB':
        return 'result = tensor_a - tensor_b;';
      
      case 'TENSOR_MUL':
        return 'result = tensor_a * tensor_b;';
      
      // Glyphs
      case 'GLYPH_POP':
        return '// ⟁Pop: Load input';
      
      case 'GLYPH_WO':
        return '// ⟁Wo: Declare state';
      
      case 'GLYPH_SEK':
        return '// ⟁Sek: Execute operation';
      
      case 'GLYPH_CHEN':
        return '// ⟁Ch\'en: Collapse/emit';
      
      case 'GLYPH_XUL':
        return '// ⟁Xul: Terminate';
      
      case 'GLYPH_PI':
        return `const π: f32 = ${Math.PI};`;
      
      case 'GLYPH_PHI':
        return `const φ: f32 = ${(1 + Math.sqrt(5)) / 2};`;
      
      default:
        return `// Unknown opcode: ${instr.opcode}`;
    }
  }

  private binaryOp(op: string): string {
    return `result = operand_a ${op} operand_b;`;
  }

  private matrixMultiply(): string {
    return `
      // Matrix multiply
      for (var i: u32 = 0; i < rows_a; i = i + 1) {
        for (var j: u32 = 0; j < cols_b; j = j + 1) {
          var sum: f32 = 0.0;
          for (var k: u32 = 0; k < cols_a; k = k + 1) {
            sum = sum + matrix_a[i * cols_a + k] * matrix_b[k * cols_b + j];
          }
          matrix_c[i * cols_b + j] = sum;
        }
      }
    `.trim();
  }

  /**
   * Generate WGSL constants
   */
  private generateConstants(constants: Array<{name: string, value: any}>): string {
    const lines: string[] = [];
    
    for (const constant of constants) {
      const value = typeof constant.value === 'number' 
        ? constant.value.toFixed(15)
        : JSON.stringify(constant.value);
      
      lines.push(`const ${constant.name}: f32 = ${value};`);
    }
    
    return lines.join('\n');
  }
}
