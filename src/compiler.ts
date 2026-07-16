/**
 * KUHUL TypeScript Compiler
 * 
 * Transforms TypeScript with KUHUL semantics into optimized JavaScript
 * with deterministic execution, glyph tracking, and CSS-VER integration
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

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

export class KUHULTypeScriptCompiler {
  private options: KUHULCompileOptions;
  private πBindings = new Map<string, { value: any, type: string }>();
  private τBindings = new Map<string, { initialValue: any, type: string, updates: any[] }>();
  private glyphCalls: GlyphCall[] = [];
  private functions: FunctionInfo[] = [];
  private interfaces: InterfaceInfo[] = [];
  private xjsonPrograms: XJSONProgram[] = [];

  constructor(options: Partial<KUHULCompileOptions> = {}) {
    this.options = {
      target: options.target ?? ts.ScriptTarget.ES2022,
      module: options.module ?? ts.ModuleKind.ESNext,
      deterministic: options.deterministic ?? true,
      hashChain: options.hashChain ?? true,
      replayEnabled: options.replayEnabled ?? true,
      cssVER: options.cssVER ?? true,
      svg3D: options.svg3D ?? true,
      binaries: options.binaries ?? {},
    };
  }

  compile(source: string, filename: string = 'source.kuhl.ts'): KUHULProgram {
    // Create TypeScript source file
    const sourceFile = ts.createSourceFile(
      filename,
      source,
      this.options.target,
      true
    );

    // Visit AST and extract KUHUL constructs
    this.visitNode(sourceFile);

    // Generate transformed code
    const transformedCode = this.generateTransformedCode(source);

    return {
      πBindings: new Map(this.πBindings),
      τBindings: new Map(this.τBindings),
      glyphCalls: [...this.glyphCalls],
      functions: [...this.functions],
      interfaces: [...this.interfaces],
      transformedCode,
      xjsonPrograms: [...this.xjsonPrograms],
    };
  }

  private visitNode(node: ts.Node) {
    // π-binding: const x: number = π(value);
    if (ts.isVariableStatement(node)) {
      this.handleVariableStatement(node);
      return;
    }

    // τ-binding: let x: number = τ(value);
    if (ts.isVariableStatement(node)) {
      this.handleVariableStatement(node);
    }

    // Generator function: function* name() { ... }
    if (ts.isFunctionDeclaration(node)) {
      this.handleFunctionDeclaration(node);
    }

    // Interface definition
    if (ts.isInterfaceDeclaration(node)) {
      this.handleInterfaceDeclaration(node);
    }

    // Yield expression: yield* Sek('op', args)
    if (ts.isYieldExpression(node)) {
      this.handleYieldExpression(node);
    }

    // Visit children
    ts.forEachChild(node, (child) => this.visitNode(child));
  }

  private handleVariableStatement(node: ts.VariableStatement) {
    for (const decl of node.declarationList.declarations) {
      const name = decl.name.getText();
      const typeNode = decl.type;
      const type = typeNode ? typeNode.getText() : 'any';
      const initializer = decl.initializer;

      if (!initializer) continue;

      // Check for π() call
      if (ts.isCallExpression(initializer)) {
        const expr = initializer.expression;
        if (ts.isIdentifier(expr) && expr.text === 'π') {
          const value = this.evaluateExpression(initializer.arguments[0]);
          this.πBindings.set(name, { value, type });
          continue;
        }

        // Check for τ() call
        if (ts.isIdentifier(expr) && expr.text === 'τ') {
          const value = this.evaluateExpression(initializer.arguments[0]);
          this.τBindings.set(name, { initialValue: value, type, updates: [] });
          continue;
        }
      }
    }
  }

  private handleFunctionDeclaration(node: ts.FunctionDeclaration) {
    const name = node.name?.getText() || 'anonymous';
    const parameters = node.parameters.map(p => p.getText());
    const returnType = node.type ? node.type.getText() : 'void';
    const isGenerator = !!node.asteriskToken;
    const body = node.body ? node.body.getText() : '';

    this.functions.push({
      name,
      parameters,
      returnType,
      isGenerator,
      body,
    });
  }

  private handleInterfaceDeclaration(node: ts.InterfaceDeclaration) {
    const name = node.name.getText();
    const properties: PropertySignature[] = [];

    for (const member of node.members) {
      if (ts.isPropertySignature(member)) {
        const propName = member.name.getText();
        const propType = member.type ? member.type.getText() : 'any';
        const optional = !!member.questionToken;

        properties.push({
          name: propName,
          type: propType,
          optional,
        });
      }
    }

    this.interfaces.push({ name, properties });
  }

  private handleYieldExpression(node: ts.YieldExpression) {
    if (!node.expression || !ts.isCallExpression(node.expression)) {
      return;
    }

    const call = node.expression;
    const expr = call.expression;

    if (!ts.isIdentifier(expr)) {
      return;
    }

    const glyphName = expr.text as GlyphCall['glyph'];
    const validGlyphs = ['Sek', 'Pop', 'Wo', 'Ch\'en', 'Yax', 'Xul'];

    if (!validGlyphs.includes(glyphName)) {
      return;
    }

    const args = call.arguments.map(arg => this.evaluateExpression(arg));
    const source = node.getText();

    this.glyphCalls.push({
      glyph: glyphName,
      args,
      position: node.getStart(),
      source,
    });
  }

  private evaluateExpression(node: ts.Expression | undefined): any {
    if (!node) return undefined;

    const text = node.getText();

    // Numeric literal
    if (ts.isNumericLiteral(node)) {
      return parseFloat(text);
    }

    // String literal
    if (ts.isStringLiteral(node)) {
      return text.slice(1, -1);
    }

    // Array literal
    if (ts.isArrayLiteralExpression(node)) {
      return node.elements.map(el => this.evaluateExpression(el));
    }

    // Object literal
    if (ts.isObjectLiteralExpression(node)) {
      const obj: any = {};
      for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop)) {
          const key = prop.name.getText();
          obj[key] = this.evaluateExpression(prop.initializer);
        }
      }
      return obj;
    }

    // Boolean literal
    if (text === 'true') return true;
    if (text === 'false') return false;

    // Null/undefined
    if (text === 'null') return null;
    if (text === 'undefined') return undefined;

    // Return as string (variable reference or complex expression)
    return text;
  }

  private generateTransformedCode(source: string): string {
    let code = `
// ============================================
// KUHUL TypeScript Compiled Output
// Generated: ${new Date().toISOString()}
// π-Bindings: ${this.πBindings.size}
// τ-Bindings: ${this.τBindings.size}
// Glyph Calls: ${this.glyphCalls.length}
// ============================================

import { KUHULRuntime } from '@kuhul/ts-runtime';

// ----- π-BINDINGS (Immutable) -----
`;

    // Generate π-bindings
    this.πBindings.forEach((binding, name) => {
      code += `const __π_${name} = Object.freeze(${JSON.stringify(binding.value)});\n`;
    });

    code += '\n// ----- τ-BINDINGS (Temporal) -----\n';

    // Generate τ-bindings
    this.τBindings.forEach((binding, name) => {
      code += `let __τ_${name} = ${JSON.stringify(binding.initialValue)};\n`;
      code += `const __τ_${name}_history: Array<{frame: number, value: any}> = [];\n`;
    });

    code += '\n// ----- GLYPH EXECUTION -----\n';
    code += 'const glyphQueue: Array<{glyph: string, args: any[], timestamp: number}> = [];\n';
    code += 'const glyphResults = new Map<number, any>();\n\n';

    // Generate glyph queue
    this.glyphCalls.forEach((call, index) => {
      const args = call.args.map(arg => 
        typeof arg === 'string' && !['true', 'false', 'null', 'undefined'].includes(arg) && 
        isNaN(parseFloat(arg)) && !arg.startsWith('[') && !arg.startsWith('{')
          ? `"${arg}"`
          : JSON.stringify(arg)
      ).join(', ');

      code += `// Original: ${call.source}\n`;
      code += `glyphQueue.push({\n`;
      code += `  id: ${index},\n`;
      code += `  glyph: '${call.glyph}',\n`;
      code += `  args: [${args}],\n`;
      code += `  timestamp: Date.now()\n`;
      code += `});\n\n`;
    });

    // Generate XJSON programs for binaries
    if (Object.keys(this.options.binaries).length > 0) {
      code += '\n// ----- XJSON PROGRAMS -----\n';
      code += 'const xjsonPrograms = [\n';
      
      // Generate XJSON for binary calls
      const binaryCalls = this.glyphCalls.filter(call => 
        call.glyph === 'Sek' && call.args[0] === 'exec_binary'
      );

      for (const call of binaryCalls) {
        const binaryName = call.args[1];
        const config = call.args[2] || {};
        
        code += `  {\n`;
        code += `    name: '${binaryName}_program',\n`;
        code += `    executable: '${this.options.binaries[binaryName] || binaryName + '.exe'}',\n`;
        code += `    config: ${JSON.stringify(config)},\n`;
        code += `  },\n`;
      }
      
      code += '];\n';
    }

    // Generate runtime execution
    code += `
// ----- RUNTIME EXECUTION -----\n
const runtime = new KUHULRuntime({
  deterministic: ${this.options.deterministic},
  hashChain: ${this.options.hashChain},
  replayEnabled: ${this.options.replayEnabled},
  cssVER: ${this.options.cssVER},
  svg3D: ${this.options.svg3D},
});

// Initialize π-bindings
${Array.from(this.πBindings.keys()).map(name => 
  `runtime.π.set('${name}', __π_${name});`
).join('\n')}

// Initialize τ-bindings
${Array.from(this.τBindings.keys()).map(name => 
  `runtime.τ.set('${name}', __τ_${name});\nruntime.τHistory.set('${name}', __τ_${name}_history);`
).join('\n')}

// Execute glyph queue
(async () => {
  await runtime.executeGlyphQueue(glyphQueue);
  console.log('Execution complete. Hash chain length:', runtime.hashChain.length);
})();

export { runtime };
`;

    return code;
  }

  compileFile(inputPath: string, outputPath?: string): KUHULProgram {
    const source = fs.readFileSync(inputPath, 'utf-8');
    const result = this.compile(source, inputPath);

    const output = outputPath || inputPath.replace('.kuhl.ts', '.js');
    fs.writeFileSync(output, result.transformedCode);

    console.log(`✓ Compiled ${inputPath} → ${output}`);
    console.log(`  π-Bindings: ${result.πBindings.size}`);
    console.log(`  τ-Bindings: ${result.τBindings.size}`);
    console.log(`  Glyph Calls: ${result.glyphCalls.length}`);

    return result;
  }
}

// Export for CLI usage
export function compile(source: string, options?: Partial<KUHULCompileOptions>): KUHULProgram {
  const compiler = new KUHULTypeScriptCompiler(options);
  return compiler.compile(source);
}

export function compileFile(inputPath: string, outputPath?: string, options?: Partial<KUHULCompileOptions>): KUHULProgram {
  const compiler = new KUHULTypeScriptCompiler(options);
  return compiler.compileFile(inputPath, outputPath);
}
