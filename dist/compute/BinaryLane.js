/**
 * Binary Lane - Spawns native executables (atomizer, mesh, linear_fold, micronaut)
 *
 * This lane bridges KUHUL-TS to your existing C++ binaries
 */
import { spawn } from 'child_process';
import * as fs from 'fs';
export class BinaryLane {
    id;
    type;
    executable;
    workingDir;
    maxConcurrent;
    timeout;
    runningProcesses = new Set();
    pendingOperations = 0;
    lastHeartbeat = Date.now();
    totalExecutions = 0;
    constructor(config) {
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
    isAvailable() {
        return this.runningProcesses.size < this.maxConcurrent;
    }
    /**
     * Get current load
     */
    getLoad() {
        return this.runningProcesses.size / this.maxConcurrent;
    }
    /**
     * Get lane status
     */
    getStatus() {
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
    async execute(operation) {
        const startTime = performance.now();
        this.pendingOperations++;
        this.lastHeartbeat = Date.now();
        return new Promise((resolve, reject) => {
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
            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            // Collect stderr
            proc.stderr.on('data', (data) => {
                stderr += data.toString();
                console.log(`  [${this.id}] stderr: ${data.toString().trim()}`);
            });
            // Handle process exit
            proc.on('close', (code) => {
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
                }
                else {
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
            proc.on('error', (err) => {
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
    buildArgs(operation) {
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
    buildAtomizerArgs(payload) {
        const args = [];
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
    buildMeshArgs(payload) {
        const args = [];
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
    buildLinearFoldArgs(payload) {
        const args = [];
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
    buildMicronautArgs(payload) {
        const args = [];
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
    buildMicronautXJSONArgs(payload) {
        const args = [];
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
    buildMoEGGUFArgs(payload) {
        const args = [];
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
    parseOutput(operation, stdout, stderr) {
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
    parseAtomizerOutput(stdout) {
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
        }
        catch {
            return { data: { raw: stdout } };
        }
    }
    parseMeshOutput(stdout) {
        try {
            // Parse mesh output (vertices, faces, SVG)
            const lines = stdout.split('\n');
            const vertices = [];
            const faces = [];
            for (const line of lines) {
                if (line.startsWith('v ')) {
                    const parts = line.slice(2).split(' ').map(Number);
                    vertices.push({ x: parts[0], y: parts[1], z: parts[2] || 0 });
                }
                else if (line.startsWith('f ')) {
                    const parts = line.slice(2).split(' ').map(Number);
                    faces.push(parts);
                }
            }
            return {
                data: { vertices, faces, svg: stdout.includes('<svg') ? stdout : null },
                memory: vertices.length * 12 + faces.length * 12
            };
        }
        catch {
            return { data: { raw: stdout } };
        }
    }
    parseLinearFoldOutput(stdout) {
        try {
            // Parse dot-bracket notation
            const lines = stdout.split('\n');
            let sequence = '';
            let structure = '';
            for (const line of lines) {
                if (line.startsWith('>')) {
                    sequence = line.slice(1).trim();
                }
                else if (line.match(/^[().]+$/)) {
                    structure = line.trim();
                }
            }
            return {
                data: { sequence, structure, pairs: this.parseDotBracket(structure) }
            };
        }
        catch {
            return { data: { raw: stdout } };
        }
    }
    parseDotBracket(structure) {
        const pairs = [];
        const stack = [];
        for (let i = 0; i < structure.length; i++) {
            if (structure[i] === '(') {
                stack.push(i);
            }
            else if (structure[i] === ')') {
                const open = stack.pop();
                if (open !== undefined) {
                    pairs.push({ open, close: i });
                }
            }
        }
        return pairs;
    }
    parseMicronautOutput(stdout) {
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
        }
        catch {
            return { data: { raw: stdout } };
        }
    }
    parseMicronautXJSONOutput(stdout) {
        try {
            // Parse XJSON result
            return { data: JSON.parse(stdout) };
        }
        catch {
            return { data: { raw: stdout } };
        }
    }
    parseMoEGGUFOutput(stdout) {
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
        }
        catch {
            return { data: { raw: stdout } };
        }
    }
    /**
     * Generate π-hash for result
     */
    generateπHash(data) {
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
    killAll() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmluYXJ5TGFuZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21wdXRlL0JpbmFyeUxhbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7R0FJRztBQUdILE9BQU8sRUFBRSxLQUFLLEVBQWdCLE1BQU0sZUFBZSxDQUFDO0FBRXBELE9BQU8sS0FBSyxFQUFFLE1BQU0sSUFBSSxDQUFDO0FBV3pCLE1BQU0sT0FBTyxVQUFVO0lBQ2QsRUFBRSxDQUFTO0lBQ1gsSUFBSSxDQUFTO0lBQ1osVUFBVSxDQUFTO0lBQ25CLFVBQVUsQ0FBUztJQUNuQixhQUFhLENBQVM7SUFDdEIsT0FBTyxDQUFTO0lBRWhCLGdCQUFnQixHQUFzQixJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2hELGlCQUFpQixHQUFXLENBQUMsQ0FBQztJQUM5QixhQUFhLEdBQVcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ25DLGVBQWUsR0FBVyxDQUFDLENBQUM7SUFFcEMsWUFBWSxNQUF3QjtRQUNsQyxJQUFJLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDcEIsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUNwQyxJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDcEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO1FBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUU5QixPQUFPLENBQUMsR0FBRyxDQUFDLDhCQUE4QixJQUFJLENBQUMsRUFBRSxNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFFRDs7T0FFRztJQUNILFdBQVc7UUFDVCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJ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QyxDQUFDLENBQUM7WUFDaEQsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7UUFDckIsQ0FBQztRQUNELE9BQU8sSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRDs7T0FFRztJQUNILE9BQU87UUFDTCxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdkIsQ0FBQztRQUNELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxRQUFRO1FBQ04sT0FBTztZQUNMLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRTtZQUNYLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLE9BQU8sRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSTtZQUNuQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGlCQUFpQjtZQUMvQixlQUFlLEVBQUUsSUFBSSxDQUFDLGVBQWU7WUFDckMsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1NBQ2xDLENBQUM7SUFDSixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEJpbmFyeSBMYW5lIC0gU3Bhd25zIG5hdGl2ZSBleGVjdXRhYmxlcyAoYXRvbWl6ZXIsIG1lc2gsIGxpbmVhcl9mb2xkLCBtaWNyb25hdXQpXG4gKiBcbiAqIFRoaXMgbGFuZSBicmlkZ2VzIEtVSFVMLVRTIHRvIHlvdXIgZXhpc3RpbmcgQysrIGJpbmFyaWVzXG4gKi9cblxuaW1wb3J0IHsgQ29tcHV0ZU9wZXJhdGlvbiwgQ29tcHV0ZVJlc3VsdCwgTGFuZVN0YXR1cyB9IGZyb20gJy4uL2NvcmUvY29tcHV0ZS1icmlkZ2UnO1xuaW1wb3J0IHsgc3Bhd24sIENoaWxkUHJvY2VzcyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcblxuZXhwb3J0IGludGVyZmFjZSBCaW5hcnlMYW5lQ29uZmlnIHtcbiAgaWQ6IHN0cmluZztcbiAgdHlwZTogJ2F0b21pemVyJyB8ICdtZXNoJyB8ICdsaW5lYXJfZm9sZCcgfCAnbWljcm9uYXV0JyB8ICdtaWNyb25hdXRfeGpzb24nIHwgJ21vZV9nZ3VmJztcbiAgZXhlY3V0YWJsZTogc3RyaW5nO1xuICB3b3JraW5nRGlyOiBzdHJpbmc7XG4gIG1heENvbmN1cnJlbnQ6IG51bWJlcjtcbiAgdGltZW91dDogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgQmluYXJ5TGFuZSB7XG4gIHB1YmxpYyBpZDogc3RyaW5nO1xuICBwdWJsaWMgdHlwZTogc3RyaW5nO1xuICBwcml2YXRlIGV4ZWN1dGFibGU6IHN0cmluZztcbiAgcHJpdmF0ZSB3b3JraW5nRGlyOiBzdHJpbmc7XG4gIHByaXZhdGUgbWF4Q29uY3VycmVudDogbnVtYmVyO1xuICBwcml2YXRlIHRpbWVvdXQ6IG51bWJlcjtcbiAgXG4gIHByaXZhdGUgcnVubmluZ1Byb2Nlc3NlczogU2V0PENoaWxkUHJvY2Vzcz4gPSBuZXcgU2V0KCk7XG4gIHByaXZhdGUgcGVuZGluZ09wZXJhdGlvbnM6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgbGFzdEhlYXJ0YmVhdDogbnVtYmVyID0gRGF0ZS5ub3coKTtcbiAgcHJpdmF0ZSB0b3RhbEV4ZWN1dGlvbnM6IG51bWJlciA9IDA7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBCaW5hcnlMYW5lQ29uZmlnKSB7XG4gICAgdGhpcy5pZCA9IGNvbmZpZy5pZDtcbiAgICB0aGlzLnR5cGUgPSBjb25maWcudHlwZTtcbiAgICB0aGlzLmV4ZWN1dGFibGUgPSBjb25maWcuZXhlY3V0YWJsZTtcbiAgICB0aGlzLndvcmtpbmdEaXIgPSBjb25maWcud29ya2luZ0RpcjtcbiAgICB0aGlzLm1heENvbmN1cnJlbnQgPSBjb25maWcubWF4Q29uY3VycmVudDtcbiAgICB0aGlzLnRpbWVvdXQgPSBjb25maWcudGltZW91dDtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgICBCaW5hcnkgTGFuZSBpbml0aWFsaXplZDogJHt0aGlzLmlkfSDihpIgJHt0aGlzLmV4ZWN1dGFibGV9YCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgbGFuZSBjYW4gYWNjZXB0IG1vcmUgd29ya1xuICAgKi9cbiAgaXNBdmFpbGFibGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMucnVubmluZ1Byb2Nlc3Nlcy5zaXplIDwgdGhpcy5tYXhDb25jdXJyZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBjdXJyZW50IGxvYWRcbiAgICovXG4gIGdldExvYWQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5ydW5uaW5nUHJvY2Vzc2VzLnNpemUgLyB0aGlzLm1heENvbmN1cnJlbnQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGxhbmUgc3RhdHVzXG4gICAqL1xuICBnZXRTdGF0dXMoKTogTGFuZVN0YXR1cyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgYXZhaWxhYmxlOiB0aGlzLmlzQXZhaWxhYmxlKCksXG4gICAgICBsb2FkOiB0aGlzLmdldExvYWQoKSxcbiAgICAgIG1lbW9yeTogMCwgLy8gV291bGQgdHJhY2sgYWN0dWFsIG1lbW9yeVxuICAgICAgcGVuZGluZzogdGhpcy5wZW5kaW5nT3BlcmF0aW9ucyxcbiAgICAgIGxhc3RIZWFydGJlYXQ6IHRoaXMubGFzdEhlYXJ0YmVhdFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBiaW5hcnkgb3BlcmF0aW9uXG4gICAqL1xuICBhc3luYyBleGVjdXRlKG9wZXJhdGlvbjogQ29tcHV0ZU9wZXJhdGlvbik6IFByb21pc2U8Q29tcHV0ZVJlc3VsdD4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIHRoaXMucGVuZGluZ09wZXJhdGlvbnMrKztcbiAgICB0aGlzLmxhc3RIZWFydGJlYXQgPSBEYXRlLm5vdygpO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPENvbXB1dGVSZXN1bHQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIC8vIENoZWNrIGlmIGV4ZWN1dGFibGUgZXhpc3RzXG4gICAgICBpZiAoIWZzLmV4aXN0c1N5bmModGhpcy5leGVjdXRhYmxlKSkge1xuICAgICAgICB0aGlzLnBlbmRpbmdPcGVyYXRpb25zLS07XG4gICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgIGlkOiBgYmluLSR7RGF0ZS5ub3coKX1gLFxuICAgICAgICAgIG9wZXJhdGlvbklkOiBvcGVyYXRpb24uaWQsXG4gICAgICAgICAgbGFuZUlkOiB0aGlzLmlkLFxuICAgICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgICAgz4BIYXNoOiB0aGlzLmdlbmVyYXRlz4BIYXNoKHsgZXJyb3I6ICdleGVjdXRhYmxlX25vdF9mb3VuZCcgfSksXG4gICAgICAgICAgZHVyYXRpb246IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRUaW1lLFxuICAgICAgICAgIG1lbW9yeTogMCxcbiAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IG5ldyBFcnJvcihgRXhlY3V0YWJsZSBub3QgZm91bmQ6ICR7dGhpcy5leGVjdXRhYmxlfWApXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIEJ1aWxkIGNvbW1hbmQgbGluZSBhcmd1bWVudHNcbiAgICAgIGNvbnN0IGFyZ3MgPSB0aGlzLmJ1aWxkQXJncyhvcGVyYXRpb24pO1xuXG4gICAgICBjb25zb2xlLmxvZyhgICBbJHt0aGlzLmlkfV0gU3Bhd25pbmc6ICR7dGhpcy5leGVjdXRhYmxlfSAke2FyZ3Muam9pbignICcpfWApO1xuXG4gICAgICAvLyBTcGF3biBwcm9jZXNzXG4gICAgICBjb25zdCBwcm9jID0gc3Bhd24odGhpcy5leGVjdXRhYmxlLCBhcmdzLCB7XG4gICAgICAgIGN3ZDogdGhpcy53b3JraW5nRGlyLFxuICAgICAgICBzdGRpbzogWydwaXBlJywgJ3BpcGUnLCAncGlwZSddLFxuICAgICAgICB3aW5kb3dzSGlkZTogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMucnVubmluZ1Byb2Nlc3Nlcy5hZGQocHJvYyk7XG5cbiAgICAgIGxldCBzdGRvdXQgPSAnJztcbiAgICAgIGxldCBzdGRlcnIgPSAnJztcblxuICAgICAgLy8gQ29sbGVjdCBzdGRvdXRcbiAgICAgIHByb2Muc3Rkb3V0Lm9uKCdkYXRhJywgKGRhdGE6IEJ1ZmZlcikgPT4ge1xuICAgICAgICBzdGRvdXQgKz0gZGF0YS50b1N0cmluZygpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIENvbGxlY3Qgc3RkZXJyXG4gICAgICBwcm9jLnN0ZGVyci5vbignZGF0YScsIChkYXRhOiBCdWZmZXIpID0+IHtcbiAgICAgICAgc3RkZXJyICs9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgWyR7dGhpcy5pZH1dIHN0ZGVycjogJHtkYXRhLnRvU3RyaW5nKCkudHJpbSgpfWApO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIEhhbmRsZSBwcm9jZXNzIGV4aXRcbiAgICAgIHByb2Mub24oJ2Nsb3NlJywgKGNvZGU6IG51bWJlcikgPT4ge1xuICAgICAgICB0aGlzLnJ1bm5pbmdQcm9jZXNzZXMuZGVsZXRlKHByb2MpO1xuICAgICAgICB0aGlzLnBlbmRpbmdPcGVyYXRpb25zLS07XG4gICAgICAgIHRoaXMudG90YWxFeGVjdXRpb25zKys7XG5cbiAgICAgICAgY29uc3QgZHVyYXRpb24gPSBwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0VGltZTtcblxuICAgICAgICBpZiAoY29kZSA9PT0gMCB8fCBzdGRvdXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgIC8vIFN1Y2Nlc3MgLSBwYXJzZSBvdXRwdXRcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLnBhcnNlT3V0cHV0KG9wZXJhdGlvbiwgc3Rkb3V0LCBzdGRlcnIpO1xuICAgICAgICAgIFxuICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgaWQ6IGBiaW4tJHtEYXRlLm5vdygpfWAsXG4gICAgICAgICAgICBvcGVyYXRpb25JZDogb3BlcmF0aW9uLmlkLFxuICAgICAgICAgICAgbGFuZUlkOiB0aGlzLmlkLFxuICAgICAgICAgICAgZGF0YTogcmVzdWx0LmRhdGEsXG4gICAgICAgICAgICDPgEhhc2g6IHRoaXMuZ2VuZXJhdGXPgEhhc2gocmVzdWx0LmRhdGEpLFxuICAgICAgICAgICAgZHVyYXRpb24sXG4gICAgICAgICAgICBtZW1vcnk6IHJlc3VsdC5tZW1vcnkgfHwgMCxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBGYWlsdXJlXG4gICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICBpZDogYGJpbi0ke0RhdGUubm93KCl9YCxcbiAgICAgICAgICAgIG9wZXJhdGlvbklkOiBvcGVyYXRpb24uaWQsXG4gICAgICAgICAgICBsYW5lSWQ6IHRoaXMuaWQsXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICAgICAgz4BIYXNoOiB0aGlzLmdlbmVyYXRlz4BIYXNoKHsgZXJyb3I6IHN0ZGVyciB9KSxcbiAgICAgICAgICAgIGR1cmF0aW9uLFxuICAgICAgICAgICAgbWVtb3J5OiAwLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogbmV3IEVycm9yKHN0ZGVyciB8fCBgRXhpdCBjb2RlICR7Y29kZX1gKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gSGFuZGxlIHByb2Nlc3MgZXJyb3JcbiAgICAgIHByb2Mub24oJ2Vycm9yJywgKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgdGhpcy5ydW5uaW5nUHJvY2Vzc2VzLmRlbGV0ZShwcm9jKTtcbiAgICAgICAgdGhpcy5wZW5kaW5nT3BlcmF0aW9ucy0tO1xuXG4gICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgIGlkOiBgYmluLSR7RGF0ZS5ub3coKX1gLFxuICAgICAgICAgIG9wZXJhdGlvbklkOiBvcGVyYXRpb24uaWQsXG4gICAgICAgICAgbGFuZUlkOiB0aGlzLmlkLFxuICAgICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgICAgz4BIYXNoOiB0aGlzLmdlbmVyYXRlz4BIYXNoKHsgZXJyb3I6IGVyci5tZXNzYWdlIH0pLFxuICAgICAgICAgIGR1cmF0aW9uOiBwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgICBtZW1vcnk6IDAsXG4gICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBlcnJcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gU2VuZCBpbnB1dCBkYXRhIGlmIHByb3ZpZGVkXG4gICAgICBpZiAob3BlcmF0aW9uLnBheWxvYWQuaW5wdXQpIHtcbiAgICAgICAgcHJvYy5zdGRpbi53cml0ZShvcGVyYXRpb24ucGF5bG9hZC5pbnB1dCk7XG4gICAgICAgIHByb2Muc3RkaW4uZW5kKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRpbWVvdXQgaGFuZGxpbmdcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5ydW5uaW5nUHJvY2Vzc2VzLmhhcyhwcm9jKSkge1xuICAgICAgICAgIHByb2Mua2lsbCgnU0lHVEVSTScpO1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYEJpbmFyeSBsYW5lIHRpbWVvdXQgYWZ0ZXIgJHt0aGlzLnRpbWVvdXR9bXNgKSk7XG4gICAgICAgIH1cbiAgICAgIH0sIHRoaXMudGltZW91dCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgY29tbWFuZCBsaW5lIGFyZ3VtZW50cyBiYXNlZCBvbiBvcGVyYXRpb24gdHlwZVxuICAgKi9cbiAgcHJpdmF0ZSBidWlsZEFyZ3Mob3BlcmF0aW9uOiBDb21wdXRlT3BlcmF0aW9uKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHBheWxvYWQgPSBvcGVyYXRpb24ucGF5bG9hZDtcblxuICAgIHN3aXRjaCAodGhpcy50eXBlKSB7XG4gICAgICBjYXNlICdhdG9taXplcic6XG4gICAgICAgIHJldHVybiB0aGlzLmJ1aWxkQXRvbWl6ZXJBcmdzKHBheWxvYWQpO1xuICAgICAgY2FzZSAnbWVzaCc6XG4gICAgICAgIHJldHVybiB0aGlzLmJ1aWxkTWVzaEFyZ3MocGF5bG9hZCk7XG4gICAgICBjYXNlICdsaW5lYXJfZm9sZCc6XG4gICAgICAgIHJldHVybiB0aGlzLmJ1aWxkTGluZWFyRm9sZEFyZ3MocGF5bG9hZCk7XG4gICAgICBjYXNlICdtaWNyb25hdXQnOlxuICAgICAgICByZXR1cm4gdGhpcy5idWlsZE1pY3JvbmF1dEFyZ3MocGF5bG9hZCk7XG4gICAgICBjYXNlICdtaWNyb25hdXRfeGpzb24nOlxuICAgICAgICByZXR1cm4gdGhpcy5idWlsZE1pY3JvbmF1dFhKU09OQXJncyhwYXlsb2FkKTtcbiAgICAgIGNhc2UgJ21vZV9nZ3VmJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuYnVpbGRNb0VHR1VGQXJncyhwYXlsb2FkKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXRvbWl6ZXIuZXhlIGFyZ3VtZW50c1xuICAgKi9cbiAgcHJpdmF0ZSBidWlsZEF0b21pemVyQXJncyhwYXlsb2FkOiBhbnkpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgYXJnczogc3RyaW5nW10gPSBbXTtcblxuICAgIGlmIChwYXlsb2FkLmlucHV0KSB7XG4gICAgICBhcmdzLnB1c2goJy0taW5wdXQnLCBwYXlsb2FkLmlucHV0KTtcbiAgICB9XG4gICAgaWYgKHBheWxvYWQub3V0cHV0KSB7XG4gICAgICBhcmdzLnB1c2goJy0tb3V0cHV0JywgcGF5bG9hZC5vdXRwdXQpO1xuICAgIH1cbiAgICBpZiAocGF5bG9hZC52b2NhYikge1xuICAgICAgYXJncy5wdXNoKCctLXZvY2FiJywgcGF5bG9hZC52b2NhYik7XG4gICAgfVxuICAgIGlmIChwYXlsb2FkLm1vZGUpIHtcbiAgICAgIGFyZ3MucHVzaCgnLS1tb2RlJywgcGF5bG9hZC5tb2RlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJncztcbiAgfVxuXG4gIC8qKlxuICAgKiBNZXNoLmV4ZSBhcmd1bWVudHNcbiAgICovXG4gIHByaXZhdGUgYnVpbGRNZXNoQXJncyhwYXlsb2FkOiBhbnkpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgYXJnczogc3RyaW5nW10gPSBbXTtcblxuICAgIGlmIChwYXlsb2FkLmdyYXBoKSB7XG4gICAgICBhcmdzLnB1c2goJy0tZ3JhcGgnLCBwYXlsb2FkLmdyYXBoKTtcbiAgICB9XG4gICAgaWYgKHBheWxvYWQub3V0cHV0KSB7XG4gICAgICBhcmdzLnB1c2goJy0tb3V0cHV0JywgcGF5bG9hZC5vdXRwdXQpO1xuICAgIH1cbiAgICBpZiAocGF5bG9hZC5zdmczZCkge1xuICAgICAgYXJncy5wdXNoKCctLXN2ZzNkJyk7XG4gICAgfVxuICAgIGlmIChwYXlsb2FkLmZvcm1hdCkge1xuICAgICAgYXJncy5wdXNoKCctLWZvcm1hdCcsIHBheWxvYWQuZm9ybWF0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJncztcbiAgfVxuXG4gIC8qKlxuICAgKiBMaW5lYXJfZm9sZC5leGUgYXJndW1lbnRzXG4gICAqL1xuICBwcml2YXRlIGJ1aWxkTGluZWFyRm9sZEFyZ3MocGF5bG9hZDogYW55KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGFyZ3M6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAocGF5bG9hZC5zZXF1ZW5jZSkge1xuICAgICAgYXJncy5wdXNoKCctLXNlcXVlbmNlJywgcGF5bG9hZC5zZXF1ZW5jZSk7XG4gICAgfVxuICAgIGlmIChwYXlsb2FkLm91dHB1dCkge1xuICAgICAgYXJncy5wdXNoKCctLW91dHB1dCcsIHBheWxvYWQub3V0cHV0KTtcbiAgICB9XG4gICAgaWYgKHBheWxvYWQuZm9ybWF0KSB7XG4gICAgICBhcmdzLnB1c2goJy0tZm9ybWF0JywgcGF5bG9hZC5mb3JtYXQpO1xuICAgIH1cblxuICAgIHJldHVybiBhcmdzO1xuICB9XG5cbiAgLyoqXG4gICAqIE1pY3JvbmF1dC5leGUgYXJndW1lbnRzXG4gICAqL1xuICBwcml2YXRlIGJ1aWxkTWljcm9uYXV0QXJncyhwYXlsb2FkOiBhbnkpOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgYXJnczogc3RyaW5nW10gPSBbXTtcblxuICAgIGlmIChwYXlsb2FkLmNvbmZpZykge1xuICAgICAgYXJncy5wdXNoKCctLWNvbmZpZycsIHBheWxvYWQuY29uZmlnKTtcbiAgICB9XG4gICAgaWYgKHBheWxvYWQucG9wdWxhdGlvbikge1xuICAgICAgYXJncy5wdXNoKCctLXBvcHVsYXRpb24nLCBwYXlsb2FkLnBvcHVsYXRpb24udG9TdHJpbmcoKSk7XG4gICAgfVxuICAgIGlmIChwYXlsb2FkLmdlbmVyYXRpb25zKSB7XG4gICAgICBhcmdzLnB1c2goJy0tZ2VuZXJhdGlvbnMnLCBwYXlsb2FkLmdlbmVyYXRpb25zLnRvU3RyaW5nKCkpO1xuICAgIH1cbiAgICBpZiAocGF5bG9hZC5vdXRwdXQpIHtcbiAgICAgIGFyZ3MucHVzaCgnLS1vdXRwdXQnLCBwYXlsb2FkLm91dHB1dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFyZ3M7XG4gIH1cblxuICAvKipcbiAgICogTWljcm9uYXV0X3hqc29uLmV4ZSBhcmd1bWVudHNcbiAgICovXG4gIHByaXZhdGUgYnVpbGRNaWNyb25hdXRYSlNPTkFyZ3MocGF5bG9hZDogYW55KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGFyZ3M6IHN0cmluZ1tdID0gW107XG5cbiAgICBpZiAocGF5bG9hZC5wcm9ncmFtKSB7XG4gICAgICBhcmdzLnB1c2gocGF5bG9hZC5wcm9ncmFtKTtcbiAgICB9XG4gICAgaWYgKHBheWxvYWQub3V0cHV0KSB7XG4gICAgICBhcmdzLnB1c2goJy0tb3V0cHV0JywgcGF5bG9hZC5vdXRwdXQpO1xuICAgIH1cblxuICAgIHJldHVybiBhcmdzO1xuICB9XG5cbiAgLyoqXG4gICAqIE1vZV9nZ3VmX3J1bnRpbWUuZXhlIGFyZ3VtZW50c1xuICAgKi9cbiAgcHJpdmF0ZSBidWlsZE1vRUdHVUZBcmdzKHBheWxvYWQ6IGFueSk6IHN0cmluZ1tdIHtcbiAgICBjb25zdCBhcmdzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgaWYgKHBheWxvYWQubW9kZWwpIHtcbiAgICAgIGFyZ3MucHVzaCgnLS1tb2RlbCcsIHBheWxvYWQubW9kZWwpO1xuICAgIH1cbiAgICBpZiAocGF5bG9hZC5wcm9tcHQpIHtcbiAgICAgIGFyZ3MucHVzaCgnLS1wcm9tcHQnLCBwYXlsb2FkLnByb21wdCk7XG4gICAgfVxuICAgIGlmIChwYXlsb2FkLm1heFRva2Vucykge1xuICAgICAgYXJncy5wdXNoKCctLW1heC10b2tlbnMnLCBwYXlsb2FkLm1heFRva2Vucy50b1N0cmluZygpKTtcbiAgICB9XG4gICAgaWYgKHBheWxvYWQudGVtcGVyYXR1cmUpIHtcbiAgICAgIGFyZ3MucHVzaCgnLS10ZW1wZXJhdHVyZScsIHBheWxvYWQudGVtcGVyYXR1cmUudG9TdHJpbmcoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFyZ3M7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2UgYmluYXJ5IG91dHB1dFxuICAgKi9cbiAgcHJpdmF0ZSBwYXJzZU91dHB1dChvcGVyYXRpb246IENvbXB1dGVPcGVyYXRpb24sIHN0ZG91dDogc3RyaW5nLCBzdGRlcnI6IHN0cmluZyk6IHsgZGF0YTogYW55LCBtZW1vcnk/OiBudW1iZXIgfSB7XG4gICAgc3dpdGNoICh0aGlzLnR5cGUpIHtcbiAgICAgIGNhc2UgJ2F0b21pemVyJzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VBdG9taXplck91dHB1dChzdGRvdXQpO1xuICAgICAgY2FzZSAnbWVzaCc6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlTWVzaE91dHB1dChzdGRvdXQpO1xuICAgICAgY2FzZSAnbGluZWFyX2ZvbGQnOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUxpbmVhckZvbGRPdXRwdXQoc3Rkb3V0KTtcbiAgICAgIGNhc2UgJ21pY3JvbmF1dCc6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlTWljcm9uYXV0T3V0cHV0KHN0ZG91dCk7XG4gICAgICBjYXNlICdtaWNyb25hdXRfeGpzb24nOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU1pY3JvbmF1dFhKU09OT3V0cHV0KHN0ZG91dCk7XG4gICAgICBjYXNlICdtb2VfZ2d1Zic6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlTW9FR0dVRk91dHB1dChzdGRvdXQpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHsgZGF0YTogc3Rkb3V0IH07XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZUF0b21pemVyT3V0cHV0KHN0ZG91dDogc3RyaW5nKTogeyBkYXRhOiBhbnksIG1lbW9yeT86IG51bWJlciB9IHtcbiAgICAvLyBQYXJzZSBhdG9taXplciBvdXRwdXQgKGJpbmFyeSBvciBKU09OKVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBsaW5lcyA9IHN0ZG91dC5zcGxpdCgnXFxuJykuZmlsdGVyKGwgPT4gbC50cmltKCkpO1xuICAgICAgY29uc3QgbGFzdExpbmUgPSBsaW5lc1tsaW5lcy5sZW5ndGggLSAxXTtcbiAgICAgIFxuICAgICAgLy8gVHJ5IHRvIHBhcnNlIEpTT04gc3VtbWFyeVxuICAgICAgaWYgKGxhc3RMaW5lLnN0YXJ0c1dpdGgoJ3snKSkge1xuICAgICAgICByZXR1cm4geyBkYXRhOiBKU09OLnBhcnNlKGxhc3RMaW5lKSB9O1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBPdGhlcndpc2UgcmV0dXJuIHJhdyBvdXRwdXRcbiAgICAgIHJldHVybiB7IGRhdGE6IHsgYXRvbXM6IGxpbmVzLCBjb3VudDogbGluZXMubGVuZ3RoIH0gfTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiB7IGRhdGE6IHsgcmF3OiBzdGRvdXQgfSB9O1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGFyc2VNZXNoT3V0cHV0KHN0ZG91dDogc3RyaW5nKTogeyBkYXRhOiBhbnksIG1lbW9yeT86IG51bWJlciB9IHtcbiAgICB0cnkge1xuICAgICAgLy8gUGFyc2UgbWVzaCBvdXRwdXQgKHZlcnRpY2VzLCBmYWNlcywgU1ZHKVxuICAgICAgY29uc3QgbGluZXMgPSBzdGRvdXQuc3BsaXQoJ1xcbicpO1xuICAgICAgY29uc3QgdmVydGljZXM6IGFueVtdID0gW107XG4gICAgICBjb25zdCBmYWNlczogYW55W10gPSBbXTtcbiAgICAgIFxuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoJ3YgJykpIHtcbiAgICAgICAgICBjb25zdCBwYXJ0cyA9IGxpbmUuc2xpY2UoMikuc3BsaXQoJyAnKS5tYXAoTnVtYmVyKTtcbiAgICAgICAgICB2ZXJ0aWNlcy5wdXNoKHsgeDogcGFydHNbMF0sIHk6IHBhcnRzWzFdLCB6OiBwYXJ0c1syXSB8fCAwIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKGxpbmUuc3RhcnRzV2l0aCgnZiAnKSkge1xuICAgICAgICAgIGNvbnN0IHBhcnRzID0gbGluZS5zbGljZSgyKS5zcGxpdCgnICcpLm1hcChOdW1iZXIpO1xuICAgICAgICAgIGZhY2VzLnB1c2gocGFydHMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiB7IFxuICAgICAgICBkYXRhOiB7IHZlcnRpY2VzLCBmYWNlcywgc3ZnOiBzdGRvdXQuaW5jbHVkZXMoJzxzdmcnKSA/IHN0ZG91dCA6IG51bGwgfSxcbiAgICAgICAgbWVtb3J5OiB2ZXJ0aWNlcy5sZW5ndGggKiAxMiArIGZhY2VzLmxlbmd0aCAqIDEyXG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIHsgZGF0YTogeyByYXc6IHN0ZG91dCB9IH07XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZUxpbmVhckZvbGRPdXRwdXQoc3Rkb3V0OiBzdHJpbmcpOiB7IGRhdGE6IGFueSwgbWVtb3J5PzogbnVtYmVyIH0ge1xuICAgIHRyeSB7XG4gICAgICAvLyBQYXJzZSBkb3QtYnJhY2tldCBub3RhdGlvblxuICAgICAgY29uc3QgbGluZXMgPSBzdGRvdXQuc3BsaXQoJ1xcbicpO1xuICAgICAgbGV0IHNlcXVlbmNlID0gJyc7XG4gICAgICBsZXQgc3RydWN0dXJlID0gJyc7XG4gICAgICBcbiAgICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgICAgICBpZiAobGluZS5zdGFydHNXaXRoKCc+JykpIHtcbiAgICAgICAgICBzZXF1ZW5jZSA9IGxpbmUuc2xpY2UoMSkudHJpbSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGxpbmUubWF0Y2goL15bKCkuXSskLykpIHtcbiAgICAgICAgICBzdHJ1Y3R1cmUgPSBsaW5lLnRyaW0oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4geyBcbiAgICAgICAgZGF0YTogeyBzZXF1ZW5jZSwgc3RydWN0dXJlLCBwYWlyczogdGhpcy5wYXJzZURvdEJyYWNrZXQoc3RydWN0dXJlKSB9XG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIHsgZGF0YTogeyByYXc6IHN0ZG91dCB9IH07XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZURvdEJyYWNrZXQoc3RydWN0dXJlOiBzdHJpbmcpOiBBcnJheTx7b3BlbjogbnVtYmVyLCBjbG9zZTogbnVtYmVyfT4ge1xuICAgIGNvbnN0IHBhaXJzOiBBcnJheTx7b3BlbjogbnVtYmVyLCBjbG9zZTogbnVtYmVyfT4gPSBbXTtcbiAgICBjb25zdCBzdGFjazogbnVtYmVyW10gPSBbXTtcbiAgICBcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0cnVjdHVyZS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHN0cnVjdHVyZVtpXSA9PT0gJygnKSB7XG4gICAgICAgIHN0YWNrLnB1c2goaSk7XG4gICAgICB9IGVsc2UgaWYgKHN0cnVjdHVyZVtpXSA9PT0gJyknKSB7XG4gICAgICAgIGNvbnN0IG9wZW4gPSBzdGFjay5wb3AoKTtcbiAgICAgICAgaWYgKG9wZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHBhaXJzLnB1c2goeyBvcGVuLCBjbG9zZTogaSB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gcGFpcnM7XG4gIH1cblxuICBwcml2YXRlIHBhcnNlTWljcm9uYXV0T3V0cHV0KHN0ZG91dDogc3RyaW5nKTogeyBkYXRhOiBhbnksIG1lbW9yeT86IG51bWJlciB9IHtcbiAgICB0cnkge1xuICAgICAgLy8gUGFyc2UgZXZvbHV0aW9uIHJlc3VsdHNcbiAgICAgIGNvbnN0IGxpbmVzID0gc3Rkb3V0LnNwbGl0KCdcXG4nKTtcbiAgICAgIGNvbnN0IGJlc3RNb2RlbCA9IGxpbmVzLmZpbmQobCA9PiBsLmluY2x1ZGVzKCdiZXN0JykpIHx8IGxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdO1xuICAgICAgXG4gICAgICByZXR1cm4geyBcbiAgICAgICAgZGF0YTogeyBcbiAgICAgICAgICBiZXN0TW9kZWwsXG4gICAgICAgICAgZ2VuZXJhdGlvbnM6IGxpbmVzLmxlbmd0aCxcbiAgICAgICAgICByYXc6IHN0ZG91dFxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIHsgZGF0YTogeyByYXc6IHN0ZG91dCB9IH07XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZU1pY3JvbmF1dFhKU09OT3V0cHV0KHN0ZG91dDogc3RyaW5nKTogeyBkYXRhOiBhbnksIG1lbW9yeT86IG51bWJlciB9IHtcbiAgICB0cnkge1xuICAgICAgLy8gUGFyc2UgWEpTT04gcmVzdWx0XG4gICAgICByZXR1cm4geyBkYXRhOiBKU09OLnBhcnNlKHN0ZG91dCkgfTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiB7IGRhdGE6IHsgcmF3OiBzdGRvdXQgfSB9O1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGFyc2VNb0VHR1VGT3V0cHV0KHN0ZG91dDogc3RyaW5nKTogeyBkYXRhOiBhbnksIG1lbW9yeT86IG51bWJlciB9IHtcbiAgICB0cnkge1xuICAgICAgLy8gUGFyc2UgTW9FIGluZmVyZW5jZSBvdXRwdXRcbiAgICAgIGNvbnN0IGxpbmVzID0gc3Rkb3V0LnNwbGl0KCdcXG4nKTtcbiAgICAgIGNvbnN0IG91dHB1dExpbmUgPSBsaW5lcy5maW5kKGwgPT4gbC5pbmNsdWRlcygnT3V0cHV0OicpKSB8fCAnJztcbiAgICAgIGNvbnN0IHRleHQgPSBvdXRwdXRMaW5lLnJlcGxhY2UoJ091dHB1dDonLCAnJykudHJpbSgpO1xuICAgICAgXG4gICAgICByZXR1cm4geyBcbiAgICAgICAgZGF0YTogeyBcbiAgICAgICAgICB0ZXh0LFxuICAgICAgICAgIHRva2VuczogdGV4dC5zcGxpdCgvXFxzKy8pLFxuICAgICAgICAgIHJhdzogc3Rkb3V0XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4geyBkYXRhOiB7IHJhdzogc3Rkb3V0IH0gfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgz4AtaGFzaCBmb3IgcmVzdWx0XG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlz4BIYXNoKGRhdGE6IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3Qgc3RyID0gSlNPTi5zdHJpbmdpZnkoZGF0YSk7XG4gICAgbGV0IGhhc2ggPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgKyBzdHIuY2hhckNvZGVBdChpKTtcbiAgICAgIGhhc2ggPSBoYXNoICYgaGFzaDtcbiAgICB9XG4gICAgcmV0dXJuICcweCcgKyAoaGFzaCA+Pj4gMCkudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDgsICcwJyk7XG4gIH1cblxuICAvKipcbiAgICogS2lsbCBhbGwgcnVubmluZyBwcm9jZXNzZXNcbiAgICovXG4gIGtpbGxBbGwoKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBwcm9jIG9mIHRoaXMucnVubmluZ1Byb2Nlc3Nlcykge1xuICAgICAgcHJvYy5raWxsKCdTSUdURVJNJyk7XG4gICAgfVxuICAgIHRoaXMucnVubmluZ1Byb2Nlc3Nlcy5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBzdGF0aXN0aWNzXG4gICAqL1xuICBnZXRTdGF0cygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBydW5uaW5nOiB0aGlzLnJ1bm5pbmdQcm9jZXNzZXMuc2l6ZSxcbiAgICAgIHBlbmRpbmc6IHRoaXMucGVuZGluZ09wZXJhdGlvbnMsXG4gICAgICB0b3RhbEV4ZWN1dGlvbnM6IHRoaXMudG90YWxFeGVjdXRpb25zLFxuICAgICAgbWF4Q29uY3VycmVudDogdGhpcy5tYXhDb25jdXJyZW50XG4gICAgfTtcbiAgfVxufVxuIl19