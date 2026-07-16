/**
 * SCXQ2 Demo - Show π → SCXQ2 → Backend compilation
 * 
 * This demonstrates the new architecture:
 *   π (KUHUL semantics) → SCXQ2 IR → WGSL/HLSL/OpenCL
 */

import { SCXQ2Builder, createPhysicsModule } from '../scxq2/SCXQ2_IR';
import { WGSLCompiler } from '../scxq2/backends/WGSLCompiler';
import { HLSLCompiler } from '../scxq2/backends/HLSLCompiler';
import { OpenCLCompiler } from '../scxq2/backends/OpenCLCompiler';
import { KuhulRuntime } from '../KuhulRuntime';

async function main() {
  console.log('='.repeat(80));
  console.log('SCXQ2 DEMONSTRATION - π → SCXQ2 IR → Backend');
  console.log('='.repeat(80));
  console.log('');

  // ============================================================
  // 1. Create SCXQ2 module directly
  // ============================================================
  console.log('1️⃣  Creating SCXQ2 Physics Module...');
  console.log('');
  
  const physicsModule = createPhysicsModule();
  
  console.log(`   Module: ${physicsModule.name}`);
  console.log(`   Version: ${physicsModule.version}`);
  console.log(`   π-Hash: ${physicsModule.πHash}`);
  console.log(`   Functions: ${physicsModule.functions.length}`);
  console.log(`   Constants: ${physicsModule.constants.length}`);
  console.log('');

  // ============================================================
  // 2. Compile to WGSL (WebGPU)
  // ============================================================
  console.log('2️⃣  Compiling to WGSL (WebGPU)...');
  console.log('');
  
  const wgslCompiler = new WGSLCompiler();
  const wgslResult = await wgslCompiler.compile(physicsModule);
  
  console.log(`   Language: ${wgslResult.sourceLanguage}`);
  console.log(`   Entry point: ${wgslResult.entryPoint}`);
  console.log(`   Code size: ${wgslResult.code.length} bytes`);
  console.log(`   Resources: ${wgslResult.resources.length}`);
  console.log('');
  
  // Show first 500 chars of WGSL
  console.log('   --- WGSL Preview ---');
  console.log(wgslResult.code.substring(0, 500) + '...');
  console.log('');

  // ============================================================
  // 3. Compile to HLSL (D3D11)
  // ============================================================
  console.log('3️⃣  Compiling to HLSL (D3D11)...');
  console.log('');
  
  const hlslCompiler = new HLSLCompiler();
  const hlslResult = await hlslCompiler.compile(physicsModule);
  
  console.log(`   Language: ${hlslResult.sourceLanguage}`);
  console.log(`   Entry point: ${hlslResult.entryPoint}`);
  console.log(`   Code size: ${hlslResult.code.length} bytes`);
  console.log(`   Resources: ${hlslResult.resources.length}`);
  console.log('');
  
  // Show first 500 chars of HLSL
  console.log('   --- HLSL Preview ---');
  console.log(hlslResult.code.substring(0, 500) + '...');
  console.log('');

  // ============================================================
  // 4. Compile to OpenCL C
  // ============================================================
  console.log('4️⃣  Compiling to OpenCL C...');
  console.log('');
  
  const openclCompiler = new OpenCLCompiler();
  const openclResult = await openclCompiler.compile(physicsModule);
  
  console.log(`   Language: ${openclResult.sourceLanguage}`);
  console.log(`   Entry point: ${openclResult.entryPoint}`);
  console.log(`   Code size: ${openclResult.code.length} bytes`);
  console.log(`   Resources: ${openclResult.resources.length}`);
  console.log('');
  
  // Show first 500 chars of OpenCL
  console.log('   --- OpenCL C Preview ---');
  console.log(openclResult.code.substring(0, 500) + '...');
  console.log('');

  // ============================================================
  // 5. Run KUHUL Runtime with XCFE loop
  // ============================================================
  console.log('5️⃣  Running KUHUL Runtime (XCFE Loop)...');
  console.log('');
  
  const runtime = new KuhulRuntime({
    deterministic: true,
    replayEnabled: true,
    maxFolds: 3  // Just 3 folds for demo
  });
  
  await runtime.start({
    bodies: [],
    fields: []
  });
  
  console.log('');
  console.log('   Runtime Stats:');
  const stats = runtime.getStats();
  console.log(`     Total folds: ${stats.totalFolds}`);
  console.log(`     SCXQ2 modules: ${stats.artifactsEmitted}`);
  console.log(`     Hash chain: ${stats.hashChainLength}`);
  console.log('');

  // ============================================================
  // 6. Summary
  // ============================================================
  console.log('='.repeat(80));
  console.log('✅ SCXQ2 DEMONSTRATION COMPLETE');
  console.log('='.repeat(80));
  console.log('');
  console.log('   Architecture:');
  console.log('     π (KUHUL semantics)');
  console.log('       ↓');
  console.log('     SCXQ2 IR (backend-independent)');
  console.log('       ↓');
  console.log('     WGSL | HLSL | OpenCL C');
  console.log('       ↓');
  console.log('     WebGPU | D3D11 | OpenCL');
  console.log('');
  console.log('   Key Insight: π never knows about GPU APIs!');
  console.log('');
}

main().catch(console.error);
