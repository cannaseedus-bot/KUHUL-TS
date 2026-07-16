/**
 * SCXQ2 → OpenCL C Compiler
 * 
 * Compiles SCXQ2 IR to OpenCL C kernels
 */

import { 
  SCXQ2Module, 
  SCXQ2Function, 
  SCXQ2Instruction,
  SCXQ2BackendCompiler, 
  CompiledBackend,
  BackendResource 
} from '../SCXQ2_IR';

export class OpenCLCompiler implements SCXQ2BackendCompiler {
  readonly name = 'OpenCL_C';

  async compile(module: SCXQ2Module): Promise<CompiledBackend> {
    const kernels: string[] = [];
    const resources: BackendResource[] = [];
    
    for (const func of module.functions) {
      const kernel = this.compileFunction(func, resources);
      kernels.push(kernel);
    }
    
    const constants = this.generateConstants(module.constants);
    
    const opencl = [
      '// SCXQ2 → OpenCL C Compiled Output',
      `// Module: ${module.name}`,
      `// π-Hash: ${module.πHash}`,
      '',
      constants,
      '',
      ...kernels
    ].join('\n');
    
    return {
      code: opencl,
      sourceLanguage: 'OpenCL_C',
      entryPoint: module.functions[0]?.name || 'main',
      resources
    };
  }

  private compileFunction(func: SCXQ2Function, resources: BackendResource[]): string {
    const lines: string[] = [];
    
    lines.push(`// Kernel: ${func.name}`);
    lines.push(`// π-Hash: ${func.πHash}`);
    lines.push('');
    
    // Kernel signature
    lines.push(`__kernel void ${func.name}(`);
    lines.push(`  uint global_id`);
    
    // Add buffer parameters
    let binding = 0;
    for (const param of func.parameters) {
      if (param.type.includes('Tensor')) {
        resources.push({
          type: 'buffer',
          name: param.name,
          binding: binding++
        });
        lines.push(`  , __global float* ${param.name}`);
      }
    }
    
    lines.push(') {');
    
    // Generate instructions
    for (const instruction of func.instructions) {
      const openclCode = this.compileInstruction(instruction);
      lines.push(`  ${openclCode}`);
    }
    
    lines.push('}');
    lines.push('');
    
    return lines.join('\n');
  }

  private compileInstruction(instr: SCXQ2Instruction): string {
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
        return this.matrixMultiplyOpenCL();
      
      case 'GLYPH_PI':
        return `const float π = ${Math.PI}f;`;
      
      case 'GLYPH_PHI':
        return `const float φ = ${(1 + Math.sqrt(5)) / 2}f;`;
      
      default:
        return `// Unknown opcode: ${instr.opcode}`;
    }
  }

  private matrixMultiplyOpenCL(): string {
    return `
      // Matrix multiply
      for (int i = 0; i < rows_a; i++) {
        for (int j = 0; j < cols_b; j++) {
          float sum = 0.0f;
          for (int k = 0; k < cols_a; k++) {
            sum += matrix_a[i * cols_a + k] * matrix_b[k * cols_b + j];
          }
          matrix_c[i * cols_b + j] = sum;
        }
      }
    `.trim();
  }

  private generateConstants(constants: Array<{name: string, value: any}>): string {
    const lines: string[] = [];
    
    for (const constant of constants) {
      const value = typeof constant.value === 'number' 
        ? constant.value.toFixed(15) + 'f'
        : JSON.stringify(constant.value);
      
      lines.push(`constant float ${constant.name} = ${value};`);
    }
    
    return lines.join('\n');
  }
}
