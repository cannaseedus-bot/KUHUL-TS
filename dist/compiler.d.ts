/**
 * KUHUL TypeScript Compiler
 *
 * Transforms TypeScript with KUHUL semantics into optimized JavaScript
 * with deterministic execution, glyph tracking, and CSS-VER integration
 */
import * as ts from 'typescript';
export interface KUHULCompileOptions {
    target: ts.ScriptTarget;
    module: ts.ModuleKind;
    deterministic: boolean;
    hashChain: boolean;
    replayEnabled: boolean;
    cssVER: boolean;
    svg3D: boolean;
    binaries: Record<string, string>;
}
export interface KUHULProgram {
    πBindings: Map<string, any>;
    τBindings: Map<string, any>;
    glyphCalls: GlyphCall[];
    functions: FunctionInfo[];
    interfaces: InterfaceInfo[];
    transformedCode: string;
    xjsonPrograms: XJSONProgram[];
}
export interface GlyphCall {
    glyph: 'Sek' | 'Pop' | 'Wo' | 'Ch\'en' | 'Yax' | 'Xul';
    args: any[];
    position: number;
    source: string;
    returnType?: string;
}
export interface FunctionInfo {
    name: string;
    parameters: string[];
    returnType: string;
    isGenerator: boolean;
    body: string;
}
export interface InterfaceInfo {
    name: string;
    properties: PropertySignature[];
}
export interface PropertySignature {
    name: string;
    type: string;
    optional: boolean;
}
export interface XJSONProgram {
    name: string;
    steps: XJSONStep[];
}
export interface XJSONStep {
    op: string;
    args?: any[];
    executable?: string;
}
export declare class KUHULTypeScriptCompiler {
    private options;
    private πBindings;
    private τBindings;
    private glyphCalls;
    private functions;
    private interfaces;
    private xjsonPrograms;
    constructor(options?: Partial<KUHULCompileOptions>);
    compile(source: string, filename?: string): KUHULProgram;
    private visitNode;
    private handleVariableStatement;
    private handleFunctionDeclaration;
    private handleInterfaceDeclaration;
    private handleYieldExpression;
    private evaluateExpression;
    private generateTransformedCode;
    compileFile(inputPath: string, outputPath?: string): KUHULProgram;
}
export declare function compile(source: string, options?: Partial<KUHULCompileOptions>): KUHULProgram;
export declare function compileFile(inputPath: string, outputPath?: string, options?: Partial<KUHULCompileOptions>): KUHULProgram;
