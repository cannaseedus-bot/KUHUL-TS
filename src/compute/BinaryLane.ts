/**
 * Binary Lane - Spawns native executables (atomizer, mesh, linear_fold, micronaut)
 * 
 * This lane bridges KUHUL-TS to your existing C++ binaries
 */

import { ComputeOperation, ComputeResult, LaneStatus } from '../core/compute-bridge';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface BinaryLaneConfig {
  id: string;
  type: 'atomizer' | 'mesh' | 'linear_fold' | 'micronaut' | 'micronaut_xjson' | 'moe_gguf';
  executable: string;
  workingDir: string;
  maxConcurrent: number;
  timeout: number;
}

export class BinaryLane {
  public id: string;
  public type: string;
  private executable: string;
  private workingDir: string;
  private maxConcurrent: number;
  private timeout: number;
  
  private runningProcesses: Set<ChildProcess> = new Set();
  private pendingOperations: number = 0;
  private lastHeartbeat: number = Date.now();
  private totalExecutions: number = 0;

  constructor(config: BinaryLaneConfig) {
    this.id = config.id;
    this.type = config.type;
    this.executable = config.executable;
    this.workingDir = config.workingDir;
    this.maxConcurrent = config.maxConcurrent;
    this.timeout = config.timeout;
    
    console.log(`  Binary Lane initialized: ${this.id} → ${this.executable}`);
  }

  /**
   * Check if lane can accept more work
   */
  isAvailable(): boolean {
    return this.runningProcesses.size < this.maxConcurrent;
  }

  /**
   * Get current load
   */
  getLoad(): number {
    return this.runningProcesses.size / this.maxConcurrent;
  }

  /**
   * Get lane status
   */
  getStatus(): LaneStatus {
    return {
      id: this.id,
      available: this.isAvailable(),
      load: this.getLoad(),
      memory: 0, // Would track actual memory
      pending: this.pendingOperations,
      lastHeartbeat: this.lastHeartbeat
    };
  }

  /**
   * Execute binary operation
   */
  async execute(operation: ComputeOperation): Promise<ComputeResult> {
    const startTime = performance.now();
    this.pendingOperations++;
    this.lastHeartbeat = Date.now();

    return new Promise<ComputeResult>((resolve, reject) => {
      // Check if executable exists
      if (!fs.existsSync(this.executable)) {
        this.pendingOperations--;
        resolve({
          id: `bin-${Date.now()}`,
          operationId: operation.id,
          laneId: this.id,
          data: null,
          πHash: this.generateπHash({ error: 'executable_not_found' }),
          duration: performance.now() - startTime,
          memory: 0,
          timestamp: Date.now(),
          success: false,
          error: new Error(`Executable not found: ${this.executable}`)
        });
        return;
      }

      // Build command line arguments
      const args = this.buildArgs(operation);

      console.log(`  [${this.id}] Spawning: ${this.executable} ${args.join(' ')}`);

      // Spawn process
      const proc = spawn(this.executable, args, {
        cwd: this.workingDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
      });

      this.runningProcesses.add(proc);

      let stdout = '';
      let stderr = '';

      // Collect stdout
      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // Collect stderr
      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
        console.log(`  [${this.id}] stderr: ${data.toString().trim()}`);
      });

      // Handle process exit
      proc.on('close', (code: number) => {
        this.runningProcesses.delete(proc);
        this.pendingOperations--;
        this.totalExecutions++;

        const duration = performance.now() - startTime;

        if (code === 0 || stdout.length > 0) {
          // Success - parse output
          const result = this.parseOutput(operation, stdout, stderr);
          
          resolve({
            id: `bin-${Date.now()}`,
            operationId: operation.id,
            laneId: this.id,
            data: result.data,
            πHash: this.generateπHash(result.data),
            duration,
            memory: result.memory || 0,
            timestamp: Date.now(),
            success: true
          });
        } else {
          // Failure
          resolve({
            id: `bin-${Date.now()}`,
            operationId: operation.id,
            laneId: this.id,
            data: null,
            πHash: this.generateπHash({ error: stderr }),
            duration,
            memory: 0,
            timestamp: Date.now(),
            success: false,
            error: new Error(stderr || `Exit code ${code}`)
          });
        }
      });

      // Handle process error
      proc.on('error', (err: Error) => {
        this.runningProcesses.delete(proc);
        this.pendingOperations--;

        resolve({
          id: `bin-${Date.now()}`,
          operationId: operation.id,
          laneId: this.id,
          data: null,
          πHash: this.generateπHash({ error: err.message }),
          duration: performance.now() - startTime,
          memory: 0,
          timestamp: Date.now(),
          success: false,
          error: err
        });
      });

      // Send input data if provided
      if (operation.payload.input) {
        proc.stdin.write(operation.payload.input);
        proc.stdin.end();
      }

      // Timeout handling
      setTimeout(() => {
        if (this.runningProcesses.has(proc)) {
          proc.kill('SIGTERM');
          reject(new Error(`Binary lane timeout after ${this.timeout}ms`));
        }
      }, this.timeout);
    });
  }

  /**
   * Build command line arguments based on operation type
   */
  private buildArgs(operation: ComputeOperation): string[] {
    const payload = operation.payload;

    switch (this.type) {
      case 'atomizer':
        return this.buildAtomizerArgs(payload);
      case 'mesh':
        return this.buildMeshArgs(payload);
      case 'linear_fold':
        return this.buildLinearFoldArgs(payload);
      case 'micronaut':
        return this.buildMicronautArgs(payload);
      case 'micronaut_xjson':
        return this.buildMicronautXJSONArgs(payload);
      case 'moe_gguf':
        return this.buildMoEGGUFArgs(payload);
      default:
        return [];
    }
  }

  /**
   * Atomizer.exe arguments
   */
  private buildAtomizerArgs(payload: any): string[] {
    const args: string[] = [];

    if (payload.input) {
      args.push('--input', payload.input);
    }
    if (payload.output) {
      args.push('--output', payload.output);
    }
    if (payload.vocab) {
      args.push('--vocab', payload.vocab);
    }
    if (payload.mode) {
      args.push('--mode', payload.mode);
    }

    return args;
  }

  /**
   * Mesh.exe arguments
   */
  private buildMeshArgs(payload: any): string[] {
    const args: string[] = [];

    if (payload.graph) {
      args.push('--graph', payload.graph);
    }
    if (payload.output) {
      args.push('--output', payload.output);
    }
    if (payload.svg3d) {
      args.push('--svg3d');
    }
    if (payload.format) {
      args.push('--format', payload.format);
    }

    return args;
  }

  /**
   * Linear_fold.exe arguments
   */
  private buildLinearFoldArgs(payload: any): string[] {
    const args: string[] = [];

    if (payload.sequence) {
      args.push('--sequence', payload.sequence);
    }
    if (payload.output) {
      args.push('--output', payload.output);
    }
    if (payload.format) {
      args.push('--format', payload.format);
    }

    return args;
  }

  /**
   * Micronaut.exe arguments
   */
  private buildMicronautArgs(payload: any): string[] {
    const args: string[] = [];

    if (payload.config) {
      args.push('--config', payload.config);
    }
    if (payload.population) {
      args.push('--population', payload.population.toString());
    }
    if (payload.generations) {
      args.push('--generations', payload.generations.toString());
    }
    if (payload.output) {
      args.push('--output', payload.output);
    }

    return args;
  }

  /**
   * Micronaut_xjson.exe arguments
   */
  private buildMicronautXJSONArgs(payload: any): string[] {
    const args: string[] = [];

    if (payload.program) {
      args.push(payload.program);
    }
    if (payload.output) {
      args.push('--output', payload.output);
    }

    return args;
  }

  /**
   * Moe_gguf_runtime.exe arguments
   */
  private buildMoEGGUFArgs(payload: any): string[] {
    const args: string[] = [];

    if (payload.model) {
      args.push('--model', payload.model);
    }
    if (payload.prompt) {
      args.push('--prompt', payload.prompt);
    }
    if (payload.maxTokens) {
      args.push('--max-tokens', payload.maxTokens.toString());
    }
    if (payload.temperature) {
      args.push('--temperature', payload.temperature.toString());
    }

    return args;
  }

  /**
   * Parse binary output
   */
  private parseOutput(operation: ComputeOperation, stdout: string, stderr: string): { data: any, memory?: number } {
    switch (this.type) {
      case 'atomizer':
        return this.parseAtomizerOutput(stdout);
      case 'mesh':
        return this.parseMeshOutput(stdout);
      case 'linear_fold':
        return this.parseLinearFoldOutput(stdout);
      case 'micronaut':
        return this.parseMicronautOutput(stdout);
      case 'micronaut_xjson':
        return this.parseMicronautXJSONOutput(stdout);
      case 'moe_gguf':
        return this.parseMoEGGUFOutput(stdout);
      default:
        return { data: stdout };
    }
  }

  private parseAtomizerOutput(stdout: string): { data: any, memory?: number } {
    // Parse atomizer output (binary or JSON)
    try {
      const lines = stdout.split('\n').filter(l => l.trim());
      const lastLine = lines[lines.length - 1];
      
      // Try to parse JSON summary
      if (lastLine.startsWith('{')) {
        return { data: JSON.parse(lastLine) };
      }
      
      // Otherwise return raw output
      return { data: { atoms: lines, count: lines.length } };
    } catch {
      return { data: { raw: stdout } };
    }
  }

  private parseMeshOutput(stdout: string): { data: any, memory?: number } {
    try {
      // Parse mesh output (vertices, faces, SVG)
      const lines = stdout.split('\n');
      const vertices: any[] = [];
      const faces: any[] = [];
      
      for (const line of lines) {
        if (line.startsWith('v ')) {
          const parts = line.slice(2).split(' ').map(Number);
          vertices.push({ x: parts[0], y: parts[1], z: parts[2] || 0 });
        } else if (line.startsWith('f ')) {
          const parts = line.slice(2).split(' ').map(Number);
          faces.push(parts);
        }
      }
      
      return { 
        data: { vertices, faces, svg: stdout.includes('<svg') ? stdout : null },
        memory: vertices.length * 12 + faces.length * 12
      };
    } catch {
      return { data: { raw: stdout } };
    }
  }

  private parseLinearFoldOutput(stdout: string): { data: any, memory?: number } {
    try {
      // Parse dot-bracket notation
      const lines = stdout.split('\n');
      let sequence = '';
      let structure = '';
      
      for (const line of lines) {
        if (line.startsWith('>')) {
          sequence = line.slice(1).trim();
        } else if (line.match(/^[().]+$/)) {
          structure = line.trim();
        }
      }
      
      return { 
        data: { sequence, structure, pairs: this.parseDotBracket(structure) }
      };
    } catch {
      return { data: { raw: stdout } };
    }
  }

  private parseDotBracket(structure: string): Array<{open: number, close: number}> {
    const pairs: Array<{open: number, close: number}> = [];
    const stack: number[] = [];
    
    for (let i = 0; i < structure.length; i++) {
      if (structure[i] === '(') {
        stack.push(i);
      } else if (structure[i] === ')') {
        const open = stack.pop();
        if (open !== undefined) {
          pairs.push({ open, close: i });
        }
      }
    }
    
    return pairs;
  }

  private parseMicronautOutput(stdout: string): { data: any, memory?: number } {
    try {
      // Parse evolution results
      const lines = stdout.split('\n');
      const bestModel = lines.find(l => l.includes('best')) || lines[lines.length - 1];
      
      return { 
        data: { 
          bestModel,
          generations: lines.length,
          raw: stdout
        }
      };
    } catch {
      return { data: { raw: stdout } };
    }
  }

  private parseMicronautXJSONOutput(stdout: string): { data: any, memory?: number } {
    try {
      // Parse XJSON result
      return { data: JSON.parse(stdout) };
    } catch {
      return { data: { raw: stdout } };
    }
  }

  private parseMoEGGUFOutput(stdout: string): { data: any, memory?: number } {
    try {
      // Parse MoE inference output
      const lines = stdout.split('\n');
      const outputLine = lines.find(l => l.includes('Output:')) || '';
      const text = outputLine.replace('Output:', '').trim();
      
      return { 
        data: { 
          text,
          tokens: text.split(/\s+/),
          raw: stdout
        }
      };
    } catch {
      return { data: { raw: stdout } };
    }
  }

  /**
   * Generate π-hash for result
   */
  private generateπHash(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return '0x' + (hash >>> 0).toString(16).padStart(8, '0');
  }

  /**
   * Kill all running processes
   */
  killAll(): void {
    for (const proc of this.runningProcesses) {
      proc.kill('SIGTERM');
    }
    this.runningProcesses.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      id: this.id,
      type: this.type,
      running: this.runningProcesses.size,
      pending: this.pendingOperations,
      totalExecutions: this.totalExecutions,
      maxConcurrent: this.maxConcurrent
    };
  }
}
