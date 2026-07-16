/**
 * SCXQ2 → HLSL Compiler
 *
 * Compiles SCXQ2 IR to D3D11 HLSL compute shaders
 */
import { SCXQ2Module, SCXQ2BackendCompiler, CompiledBackend } from '../SCXQ2_IR';
export declare class HLSLCompiler implements SCXQ2BackendCompiler {
    readonly name = "HLSL";
    compile(module: SCXQ2Module): Promise<CompiledBackend>;
    private compileFunction;
    private compileInstruction;
    private matrixMultiplyHLSL;
    private generateConstants;
}
