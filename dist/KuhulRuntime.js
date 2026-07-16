"use strict";
/**
 * KUHUL Runtime - Complete Fold Lifecycle
 *
 * XCFE controls the loop:
 *   while (runtime.active()) {
 *     runtime.pop();
 *   }
 *
 * Pop() internally sequences:
 *   Pop → Wo → Yax → Sek → Ch'en → Xul
 *
 * π produces SCXQ2 IR, which is compiled to backends.
 * π never knows about WebGL/OpenCL/D3D11.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.KuhulRuntime = void 0;
const SCXQ2_IR_1 = require("./scxq2/SCXQ2_IR");
const WGSLCompiler_1 = require("./scxq2/backends/WGSLCompiler");
const HLSLCompiler_1 = require("./scxq2/backends/HLSLCompiler");
const OpenCLCompiler_1 = require("./scxq2/backends/OpenCLCompiler");
class KuhulRuntime {
    constructor(config = {}) {
        this.active = false;
        this.foldCount = 0;
        this.scx2Modules = [];
        // Backend compilers
        this.wgslCompiler = new WGSLCompiler_1.WGSLCompiler();
        this.hlslCompiler = new HLSLCompiler_1.HLSLCompiler();
        this.openclCompiler = new OpenCLCompiler_1.OpenCLCompiler();
        this.config = {
            deterministic: config.deterministic ?? true,
            replayEnabled: config.replayEnabled ?? true,
            hashChain: config.hashChain ?? true,
            maxFolds: config.maxFolds ?? 1000,
            checkpointInterval: config.checkpointInterval ?? 60
        };
        // Initialize SCXQ2 builder
        this.scx2Builder = new SCXQ2_IR_1.SCXQ2Builder();
        console.log('⧫ KUHUL Runtime Initializing...');
        console.log(`  Deterministic: ${this.config.deterministic}`);
        console.log(`  Replay Enabled: ${this.config.replayEnabled}`);
        console.log(`  Max Folds: ${this.config.maxFolds}`);
        console.log('  IR: SCXQ2 (backend-independent)');
        console.log('  Backends: WGSL, HLSL, OpenCL C');
        console.log('');
    }
    /**
     * Start runtime - XCFE loop
     *
     * while (this.active) {
     *   this.pop();  // Executes: Pop → Wo → Yax → Sek → Ch'en → Xul
     * }
     */
    async start(initialState) {
        console.log('🚀 KUHUL Runtime Starting (XCFE Loop)...\n');
        this.active = true;
        this.foldCount = 0;
        this.scx2Modules = [];
        const startTime = Date.now();
        // XCFE control loop
        while (this.active && this.foldCount < this.config.maxFolds) {
            try {
                // Execute one fold via Pop()
                await this.pop(initialState);
                this.foldCount++;
            }
            catch (error) {
                console.error(`❌ Fold ${this.foldCount} failed:`, error.message);
                // XCFE recovery: retry Pop
                if (this.config.replayEnabled) {
                    console.log('🔄 XCFE: Repeating Pop...');
                    await this.pop(initialState);
                }
                else {
                    this.active = false;
                    break;
                }
            }
        }
        const totalTime = Date.now() - startTime;
        console.log('\n✅ KUHUL Runtime Complete (XCFE)');
        console.log(`  Total folds: ${this.foldCount}`);
        console.log(`  Total time: ${totalTime}ms`);
        console.log(`  SCXQ2 modules: ${this.scx2Modules.length}`);
        return this.getStats();
    }
    /**
     * Pop() - The ONLY external entry point
     *
     * Internally sequences:
     *   Pop → Wo → Yax → Sek → Ch'en → Xul
     *
     * This is NOT a loop in π. It's the runtime invoking semantic folds.
     * XCFE controls the loop externally.
     */
    async pop(initialState) {
        console.log(`⧫ Fold ${this.foldCount + 1} starting (Pop)...`);
        // Build SCXQ2 IR for this fold
        const bindings = new Map();
        bindings.set('GRAVITY', [0, -9.81, 0]);
        bindings.set('TIMESTEP', 0.016);
        bindings.set('MAX_FOLDS', this.config.maxFolds);
        const fold = this.scx2Builder.buildFold(
        // π-bindings (immutable)
        bindings, 
        // World state (τ-bindings)
        initialState || { bodies: [], fields: [], active: true }, 
        // Operations (Sek phase)
        [
            { op: 'update_physics', args: [initialState, 0.016] },
            { op: 'matmul', args: [] }
        ]);
        // Build SCXQ2 module
        const module = this.scx2Builder.buildModule(`fold_${this.foldCount}`, [fold]);
        this.scx2Modules.push(module);
        console.log(`  ✓ SCXQ2 IR generated`);
        console.log(`    π-Hash: ${module.πHash}`);
        console.log(`    Instructions: ${fold.instructions.length}`);
        // Compile to backends (optional, for execution)
        const wgsl = await this.wgslCompiler.compile(module);
        const hlsl = await this.hlslCompiler.compile(module);
        const opencl = await this.openclCompiler.compile(module);
        console.log(`  ✓ Backends compiled:`);
        console.log(`    WGSL: ${wgsl.code.length} bytes`);
        console.log(`    HLSL: ${hlsl.code.length} bytes`);
        console.log(`    OpenCL: ${opencl.code.length} bytes`);
        console.log('');
    }
    /**
     * Stop runtime
     */
    stop() {
        this.active = false;
        console.log('🛑 KUHUL Runtime stopped');
    }
    /**
     * Get runtime statistics
     */
    getStats() {
        return {
            totalFolds: this.foldCount,
            totalPhases: this.foldCount * 6, // 6 phases per fold
            averageFoldTime: 0, // Would track timing
            hashChainLength: this.foldCount, // One hash per fold
            τBindingsCount: 0, // Would track from SCXQ2
            artifactsEmitted: this.scx2Modules.length
        };
    }
    /**
     * Export SCXQ2 modules
     */
    exportState() {
        return {
            config: this.config,
            foldCount: this.foldCount,
            scx2Modules: this.scx2Modules.map(m => ({
                name: m.name,
                πHash: m.πHash,
                functionCount: m.functions.length
            }))
        };
    }
    /**
     * Check if runtime is active
     */
    isActive() {
        return this.active;
    }
}
exports.KuhulRuntime = KuhulRuntime;
