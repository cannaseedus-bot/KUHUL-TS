/**
 * SCXQ2 Intermediate Representation
 *
 * Backend-independent IR that π produces.
 * Like LLVM IR, but for KUHUL semantic operations.
 *
 * π never knows about WebGL/OpenCL/D3D11.
 * π only produces SCXQ2.
 * Backend compilers translate SCXQ2 → WGSL/HLSL/OpenCL C/GLSL/WASM.
 */
export type SCXQ2OpCode = 'NOP' | 'HALT' | 'JUMP' | 'JUMP_IF' | 'CALL' | 'RET' | 'ENTER' | 'LEAVE' | 'TRAP' | 'WAIT' | 'SIGNAL' | 'YIELD' | 'RESUME' | 'PUSH' | 'POP' | 'PEEK' | 'DUP' | 'SWAP' | 'ROT' | 'OVER' | 'DROP' | 'GET_LOCAL' | 'SET_LOCAL' | 'GET_GLOBAL' | 'SET_GLOBAL' | 'IADD' | 'ISUB' | 'IMUL' | 'IDIV' | 'IMOD' | 'FADD' | 'FSUB' | 'FMUL' | 'FDIV' | 'FNEG' | 'FSQRT' | 'FPOW' | 'TENSOR_NEW' | 'TENSOR_LOAD' | 'TENSOR_STORE' | 'TENSOR_MATMUL' | 'TENSOR_ADD' | 'TENSOR_SUB' | 'TENSOR_MUL' | 'TENSOR_DIV' | 'TENSOR_RESHAPE' | 'TENSOR_TRANSPOSE' | 'TENSOR_COMPRESS' | 'TENSOR_DECOMPRESS' | 'GEOM_DISTANCE' | 'GEOM_SIMILARITY' | 'GEOM_PARALLEL' | 'GEOM_GEODESIC' | 'GEOM_ROTATE' | 'GEOM_REFLECT' | 'GEOM_FLOW' | 'GLYPH_POP' | 'GLYPH_WO' | 'GLYPH_SEK' | 'GLYPH_XUL' | 'GLYPH_KAYAB' | 'GLYPH_KUMKU' | 'GLYPH_YAX' | 'GLYPH_CHEN' | 'GLYPH_TENSOR_CORE' | 'GLYPH_COMPRESS' | 'GLYPH_PHASE_GATE' | 'GLYPH_PI' | 'GLYPH_PHI';
export interface SCXQ2Instruction {
    opcode: SCXQ2OpCode;
    operands: SCXQ2Operand[];
    result?: SCXQ2Value;
    metadata: SCXQ2Metadata;
}
export type SCXQ2Operand = SCXQ2Immediate | SCXQ2Register | SCXQ2Memory | SCXQ2Label;
export interface SCXQ2Immediate {
    type: 'immediate';
    value: number | string | boolean | Float32Array;
}
export interface SCXQ2Register {
    type: 'register';
    id: number;
    dataType: SCXQ2DataType;
}
export interface SCXQ2Memory {
    type: 'memory';
    address: number;
    size: number;
}
export interface SCXQ2Label {
    type: 'label';
    name: string;
}
export type SCXQ2DataType = 'πScalar' | 'πVector2' | 'πVector3' | 'πVector4' | 'πMatrix2' | 'πMatrix3' | 'πMatrix4' | 'πTensor';
export interface SCXQ2Value {
    id: number;
    type: SCXQ2DataType;
    definition: SCXQ2Instruction;
}
export interface SCXQ2Metadata {
    sourceLocation?: {
        file: string;
        line: number;
        column: number;
    };
    πHash?: string;
    foldId?: number;
    phase?: 'Pop' | 'Wo' | 'Yax' | 'Sek' | 'Chen' | 'Xul';
}
export interface SCXQ2Function {
    name: string;
    parameters: SCXQ2Parameter[];
    returnType: SCXQ2DataType;
    instructions: SCXQ2Instruction[];
    localVariables: SCXQ2Variable[];
    πHash: string;
}
export interface SCXQ2Parameter {
    name: string;
    type: SCXQ2DataType;
    register: number;
}
export interface SCXQ2Variable {
    name: string;
    type: SCXQ2DataType;
    register: number;
    mutable: boolean;
}
export interface SCXQ2Module {
    name: string;
    version: string;
    functions: SCXQ2Function[];
    globals: SCXQ2Global[];
    constants: SCXQ2Constant[];
    πHash: string;
    metadata: SCXQ2ModuleMetadata;
}
export interface SCXQ2Global {
    name: string;
    type: SCXQ2DataType;
    initializer?: SCXQ2Instruction;
}
export interface SCXQ2Constant {
    name: string;
    value: number | Float32Array;
    type: SCXQ2DataType;
}
export interface SCXQ2ModuleMetadata {
    sourceFile: string;
    compiledAt: number;
    targetBackend?: string;
    optimizationLevel?: number;
}
export declare class SCXQ2Builder {
    private instructions;
    private registers;
    private labels;
    private currentFold;
    private currentPhase;
    /**
     * Allocate new register
     */
    allocRegister(type: SCXQ2DataType): SCXQ2Register;
    /**
     * Emit instruction
     */
    emit(opcode: SCXQ2OpCode, operands?: SCXQ2Operand[], result?: SCXQ2Value): SCXQ2Instruction;
    /**
     * Set current phase
     */
    setPhase(phase: SCXQ2Metadata['phase']): void;
    /**
     * Emit Pop phase instructions
     */
    emitPop(bindings: Map<string, any>): SCXQ2Instruction[];
    /**
     * Emit Wo phase instructions
     */
    emitWo(worldState: any): SCXQ2Instruction[];
    /**
     * Emit Sek phase instructions (compute operations)
     */
    emitSek(operation: string, args: any[]): SCXQ2Instruction[];
    /**
     * Emit Ch'en phase (collapse/emit)
     */
    emitChen(): SCXQ2Instruction[];
    /**
     * Emit Xul phase (terminate)
     */
    emitXul(): SCXQ2Instruction[];
    /**
     * Build complete fold
     */
    buildFold(bindings: Map<string, any>, worldState: any, operations: Array<{
        op: string;
        args: any[];
    }>): SCXQ2Function;
    /**
     * Compute π-hash of fold
     */
    private computeFoldHash;
    /**
     * Build SCXQ2 module
     */
    buildModule(name: string, folds: SCXQ2Function[]): SCXQ2Module;
    private computeModuleHash;
}
export interface SCXQ2BackendCompiler {
    name: string;
    compile(module: SCXQ2Module): Promise<CompiledBackend>;
}
export interface CompiledBackend {
    code: string;
    sourceLanguage: 'WGSL' | 'HLSL' | 'OpenCL_C' | 'GLSL' | 'WASM';
    entryPoint: string;
    resources: BackendResource[];
}
export interface BackendResource {
    type: 'buffer' | 'texture' | 'sampler' | 'uniform';
    name: string;
    binding: number;
    size?: number;
}
/**
 * Example: Physics simulation compiled to SCXQ2
 */
export declare function createPhysicsModule(): SCXQ2Module;
