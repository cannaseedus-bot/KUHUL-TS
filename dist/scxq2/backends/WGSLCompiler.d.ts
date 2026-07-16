/**
 * SCXQ2 → WGSL Compiler
 *
 * Compiles SCXQ2 IR to WebGPU WGSL shaders
 */
import { SCXQ2Module, SCXQ2BackendCompiler, CompiledBackend } from '../SCXQ2_IR';
export declare class WGSLCompiler implements SCXQ2BackendCompiler {
    readonly name = "WGSL";
    compile(module: SCXQ2Module): Promise<CompiledBackend>;
    /**
     * Compile SCXQ2 function to WGSL compute shader
     */
    private compileFunction;
    /**
     * Compile SCXQ2 instruction to WGSL
     */
    private compileInstruction;
    private binaryOp;
    private matrixMultiply;
    /**
     * Generate WGSL constants
     */
    private generateConstants;
}
