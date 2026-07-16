#!/usr/bin/env node
/**
 * KUHUL TypeScript CLI
 * 
 * Command-line interface for compiling and running KUHUL-TS programs
 */

import { Command } from 'commander';
import { compileFile, KUHULTypeScriptCompiler } from './compiler';
import { KUHULRuntime } from './runtime';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

const program = new Command();

program
  .name('kuhul-ts')
  .description('KUHUL TypeScript - TypeScript syntax with KUHUL deterministic semantics')
  .version('1.0.0');

program
  .command('compile <input>')
  .description('Compile KUHUL-TS source file')
  .option('-o, --output <file>', 'Output file')
  .option('-w, --watch', 'Watch for changes')
  .option('--target <target>', 'TypeScript target (es2020, es2022, esnext)', 'es2022')
  .option('--no-deterministic', 'Disable deterministic mode')
  .option('--no-hash-chain', 'Disable hash chain')
  .option('--no-replay', 'Disable replay')
  .option('--no-css-ver', 'Disable CSS-VER')
  .action(async (input, options) => {
    try {
      const source = fs.readFileSync(input, 'utf-8');
      
      const compiler = new KUHULTypeScriptCompiler({
        deterministic: options.deterministic !== false,
        hashChain: options.hashChain !== false,
        replayEnabled: options.replay !== false,
        cssVER: options.cssVer !== false,
        svg3D: true,
        binaries: {
          atomizer: './bin/atomizer.exe',
          mesh: './bin/mesh.exe',
          linear_fold: './bin/linear_fold.exe',
          micronaut: './bin/micronaut.exe',
          micronaut_xjson: './bin/micronaut_xjson.exe',
        }
      });
      
      const result = compiler.compile(source, input);
      
      const outputFile = options.output || input.replace('.kuhl.ts', '.js');
      fs.writeFileSync(outputFile, result.transformedCode);
      
      console.log(chalk.green('✓ Compiled successfully!'));
      console.log(chalk.cyan(`  Input: ${input}`));
      console.log(chalk.cyan(`  Output: ${outputFile}`));
      console.log(chalk.cyan(`  π-Bindings: ${result.πBindings.size}`));
      console.log(chalk.cyan(`  τ-Bindings: ${result.τBindings.size}`));
      console.log(chalk.cyan(`  Glyph Calls: ${result.glyphCalls.length}`));
      console.log(chalk.cyan(`  Functions: ${result.functions.length}`));
      console.log(chalk.cyan(`  Interfaces: ${result.interfaces.length}`));
      
      if (options.watch) {
        console.log(chalk.yellow('\n👁️  Watching for changes...'));
        fs.watch(input, (eventType) => {
          if (eventType === 'change') {
            console.log(chalk.blue('\n🔄 File changed, recompiling...'));
            const newSource = fs.readFileSync(input, 'utf-8');
            const newResult = compiler.compile(newSource, input);
            fs.writeFileSync(outputFile, newResult.transformedCode);
            console.log(chalk.green('✓ Recompiled!'));
          }
        });
      }
    } catch (error: any) {
      console.error(chalk.red('✗ Compilation failed:'), error.message);
      if (error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

program
  .command('run <input>')
  .description('Compile and run KUHUL-TS source file')
  .option('--log', 'Enable logging')
  .option('--profile', 'Enable profiling')
  .action(async (input, options) => {
    try {
      console.log(chalk.cyan('⧫ KUHUL TypeScript Runtime'));
      console.log(chalk.cyan(`  Source: ${input}\n`));
      
      const source = fs.readFileSync(input, 'utf-8');
      
      const compiler = new KUHULTypeScriptCompiler({
        deterministic: true,
        hashChain: true,
        replayEnabled: true,
        cssVER: false, // Disable CSS-VER in Node.js
        svg3D: false,
        binaries: {}
      });
      
      const result = compiler.compile(source, input);
      
      // Create runtime
      const runtime = new KUHULRuntime({
        deterministic: true,
        hashChain: true,
        replayEnabled: true,
        cssVER: false,
        svg3D: false,
      });
      
      // Setup logging
      if (options.log) {
        runtime.on('log', (msg) => {
          console.log(chalk.gray(msg));
        });
        
        runtime.on('frame_update', (frame) => {
          if (frame % 60 === 0) {
            console.log(chalk.blue(`Frame: ${frame}`));
          }
        });
      }
      
      // Parse and execute
      console.log(chalk.green('✓ Compiled'));
      console.log(chalk.cyan(`  π-Bindings: ${result.πBindings.size}`));
      console.log(chalk.cyan(`  τ-Bindings: ${result.τBindings.size}`));
      console.log(chalk.cyan(`  Glyph Calls: ${result.glyphCalls.length}\n`));
      
      // Initialize bindings
      result.πBindings.forEach((binding, name) => {
        runtime.π.set(name, binding.value);
      });
      
      result.τBindings.forEach((binding, name) => {
        runtime.τ.set(name, binding.initialValue);
        runtime.τHistory.set(name, []);
      });
      
      // Execute
      const startTime = Date.now();
      await runtime.executeGlyphQueue(result.glyphCalls);
      const endTime = Date.now();
      
      console.log(chalk.green('\n✓ Execution complete!'));
      console.log(chalk.cyan(`  Frames: ${runtime.frame}`));
      console.log(chalk.cyan(`  Hash chain: ${runtime.hashChain.length}`));
      console.log(chalk.cyan(`  Time: ${endTime - startTime}ms`));
      
      if (options.profile) {
        console.log(chalk.yellow('\n📊 Profile:'));
        console.log(chalk.cyan(`  Glyphs executed: ${result.glyphCalls.length}`));
        console.log(chalk.cyan(`  Avg time per glyph: ${(endTime - startTime) / result.glyphCalls.length}ms`));
      }
      
    } catch (error: any) {
      console.error(chalk.red('✗ Execution failed:'), error.message);
      if (error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

program
  .command('init [project-name]')
  .description('Initialize a new KUHUL-TS project')
  .action((projectName = 'my-kuhul-app') => {
    const projectDir = path.resolve(projectName);
    
    if (fs.existsSync(projectDir)) {
      console.error(chalk.red(`Directory ${projectName} already exists!`));
      process.exit(1);
    }
    
    // Create project structure
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });
    
    // Create package.json
    const packageJson = {
      name: projectName,
      version: '1.0.0',
      type: 'module',
      scripts: {
        'dev': 'kuhul-ts compile src/main.kuhl.ts -w',
        'build': 'kuhul-ts compile src/main.kuhl.ts -o dist/bundle.js',
        'start': 'kuhul-ts run src/main.kuhl.ts',
        'typecheck': 'tsc --noEmit'
      },
      devDependencies: {
        '@kuhul/ts': '^1.0.0',
        'typescript': '^5.2.2'
      }
    };
    
    fs.writeFileSync(
      path.join(projectDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Create tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        lib: ['ES2022', 'DOM'],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        outDir: './dist',
        rootDir: './src'
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };
    
    fs.writeFileSync(
      path.join(projectDir, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2)
    );
    
    // Create kuhul.config.json
    const kuhulConfig = {
      target: 'es2022',
      module: 'esnext',
      kuhul: {
        deterministic: true,
        hashChain: true,
        replayEnabled: true,
        cssVER: true,
        svg3D: true
      },
      binaries: {
        atomizer: './bin/atomizer.exe',
        mesh: './bin/mesh.exe',
        linear_fold: './bin/linear_fold.exe',
        micronaut: './bin/micronaut.exe',
        micronaut_xjson: './bin/micronaut_xjson.exe'
      }
    };
    
    fs.writeFileSync(
      path.join(projectDir, 'kuhul.config.json'),
      JSON.stringify(kuhulConfig, null, 2)
    );
    
    // Create example KUHUL-TS file
    const exampleCode = `
// main.kuhl.ts - KUHUL TypeScript Example
import { π, τ, Sek, Pop, Wo } from '@kuhul/ts-runtime';

// Immutable π-binding
const gravity: [number, number, number] = π([0, 9.81, 0]);
const world: any = π({
  bodies: [] as any[],
  fields: [] as any[],
  active: true
});

// Temporal τ-binding
let frame: number = τ(0);
let fps: number = τ(0);

// Physics body interface
interface Body {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  mass: number;
}

// Create physics bodies
function* createBodies(count: number) {
  yield* Sek('log', \`Creating \${count} physics bodies...\`);
  
  for (let i = 0; i < count; i++) {
    const body: Body = {
      id: 'body_' + i,
      position: [Math.random() * 800, Math.random() * 400, 0],
      velocity: [(Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, 0],
      mass: 1.0
    };
    
    yield* Sek('add_body', world, body);
  }
}

// Physics update
function* updatePhysics(dt: number) {
  yield* Sek('update_physics', world, dt);
}

// Main execution
async function main() {
  yield* Sek('log', '🚀 Starting KUHUL TypeScript Physics Simulation');
  yield* createBodies(20);
  
  let lastTime = Date.now();
  
  // Main loop
  while (world.active) {
    const currentTime = Date.now();
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    fps = τ(1 / dt);
    
    yield* updatePhysics(dt);
    yield* Sek('render_frame');
    
    frame = τ(frame + 1);
    
    if (frame % 60 === 0) {
      yield* Sek('log', \`Frame: \${frame}, FPS: \${fps.toFixed(1)}\`);
    }
    
    // Stop after 600 frames
    if (frame >= 600) {
      yield* Sek('log', 'Simulation complete!');
      yield* Sek('hash_state', { frame, fps });
      yield* Xul();
    }
  }
}

main();
`.trim();
    
    fs.writeFileSync(
      path.join(projectDir, 'src', 'main.kuhl.ts'),
      exampleCode
    );
    
    // Create HTML example
    const htmlExample = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} - KUHUL TypeScript</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    h1 {
      margin-top: 0;
      font-size: 2.5em;
      background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 30px;
    }
    
    .stat {
      background: rgba(255, 255, 255, 0.1);
      padding: 20px;
      border-radius: 10px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #4fd1c5;
    }
    
    .console {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 10px;
      padding: 20px;
      margin-top: 30px;
      font-family: 'Courier New', monospace;
      height: 200px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧠 ${projectName}</h1>
    <p>KUHUL TypeScript Physics Simulation</p>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-label">π-Bindings</div>
        <div class="stat-value" id="pi-count">0</div>
      </div>
      <div class="stat">
        <div class="stat-label">τ-Bindings</div>
        <div class="stat-value" id="tau-count">0</div>
      </div>
      <div class="stat">
        <div class="stat-label">Frame</div>
        <div class="stat-value" id="frame-count">0</div>
      </div>
    </div>
    
    <div class="console" id="console"></div>
  </div>
  
  <script type="module">
    import { KUHULRuntime } from 'https://unpkg.com/@kuhul/ts-runtime@1.0.0/dist/runtime.js';
    
    const runtime = new KUHULRuntime();
    
    runtime.on('log', (message) => {
      const consoleEl = document.getElementById('console');
      consoleEl.innerHTML += '<div>' + message + '</div>';
      consoleEl.scrollTop = consoleEl.scrollHeight;
    });
    
    runtime.on('frame_update', (frame) => {
      document.getElementById('frame-count').textContent = frame;
    });
    
    runtime.on('complete', (stats) => {
      document.getElementById('pi-count').textContent = stats.πBindings;
      document.getElementById('tau-count').textContent = stats.τBindings;
    });
    
    // Example KUHUL-TS code would be compiled and run here
    console.log('KUHUL TypeScript Runtime Ready');
  </script>
</body>
</html>
`.trim();
    
    fs.writeFileSync(
      path.join(projectDir, 'index.html'),
      htmlExample
    );
    
    // Create README
    const readme = `
# ${projectName}

A KUHUL TypeScript project

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Development (watch mode)
npm run dev

# Build
npm run build

# Run
npm start

# Type check
npm run typecheck
\`\`\`

## Project Structure

\`\`\`
src/
  main.kuhl.ts    # Entry point
dist/
  bundle.js       # Compiled output
package.json
tsconfig.json
kuhul.config.json
\`\`\`

## KUHUL-TS Syntax

\`\`\`typescript
import { π, τ, Sek, Pop, Wo } from '@kuhul/ts-runtime';

// Immutable π-binding
const x: number = π(10);

// Temporal τ-binding
let frame: number = τ(0);

// Glyph execution
function* main() {
  yield* Sek('log', 'Hello KUHUL!');
  yield* Pop(result);
}
\`\`\`

## Learn More

- [KUHUL TypeScript Documentation](https://kuhul.dev/ts)
- [Runtime API](https://kuhul.dev/ts/runtime)
- [Compiler Options](https://kuhul.dev/ts/compiler)
`.trim();
    
    fs.writeFileSync(
      path.join(projectDir, 'README.md'),
      readme
    );
    
    console.log(chalk.green(`✓ Created KUHUL TypeScript project: ${projectName}`));
    console.log(chalk.cyan('\nNext steps:'));
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan('  npm install'));
    console.log(chalk.cyan('  npm run dev'));
    console.log(chalk.cyan('\nThen open index.html in your browser!'));
  });

program.parse(process.argv);
