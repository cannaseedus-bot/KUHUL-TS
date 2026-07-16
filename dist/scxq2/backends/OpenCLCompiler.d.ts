/**
 * SCXQ2 → OpenCL C Compiler
 *
 * Compiles SCXQ2 IR to OpenCL C kernels
 */
import { SCXQ2Module, SCXQ2BackendCompiler, CompiledBackend } from '../SCXQ2_IR';
export declare class OpenCLCompiler implements SCXQ2BackendCompiler {
    readonly name = "OpenCL_C";
    compile(module: SCXQ2Module): Promise<CompiledBackend>;
    private compileFunction;
    private compileInstruction;
    private matrixMultiplyOpenCL;
    private generateConstants;
}
