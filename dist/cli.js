#!/usr/bin/env node
/**
 * KUHUL TypeScript CLI
 *
 * Command-line interface for compiling and running KUHUL-TS programs
 */
import { Command } from 'commander';
import { KUHULTypeScriptCompiler } from './compiler';
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));
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
    fs.writeFileSync(path.join(projectDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
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
    fs.writeFileSync(path.join(projectDir, 'kuhul.config.json'), JSON.stringify(kuhulConfig, null, 2));
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
    fs.writeFileSync(path.join(projectDir, 'src', 'main.kuhl.ts'), exampleCode);
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
    fs.writeFileSync(path.join(projectDir, 'index.html'), htmlExample);
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
    fs.writeFileSync(path.join(projectDir, 'README.md'), readme);
    console.log(chalk.green(`✓ Created KUHUL TypeScript project: ${projectName}`));
    console.log(chalk.cyan('\nNext steps:'));
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan('  npm install'));
    console.log(chalk.cyan('  npm run dev'));
    console.log(chalk.cyan('\nThen open index.html in your browser!'));
});
program.parse(process.argv);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0E7Ozs7R0FJRztBQUVILE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFlLHVCQUF1QixFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ2xFLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDekMsT0FBTyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDekIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBRTFCLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFFOUIsT0FBTztLQUNKLElBQUksQ0FBQyxVQUFVLENBQUM7S0FDaEIsV0FBVyxDQUFDLHlFQUF5RSxDQUFDO0tBQ3RGLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUVwQixPQUFPO0tBQ0osT0FBTyxDQUFDLGlCQUFpQixDQUFDO0tBQzFCLFdBQVcsQ0FBQyw4QkFBOEIsQ0FBQztLQUMzQyxNQUFNLENBQUMscUJBQXFCLEVBQUUsYUFBYSxDQUFDO0tBQzVDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsbUJBQW1CLENBQUM7S0FDMUMsTUFBTSxDQUFDLG1CQUFtQixFQUFFLDRDQUE0QyxFQUFFLFFBQVEsQ0FBQztLQUNuRixNQUFNLENBQUMsb0JBQW9CLEVBQUUsNEJBQTRCLENBQUM7S0FDMUQsTUFBTSxDQUFDLGlCQUFpQixFQUFFLG9CQUFvQixDQUFDO0tBQy9DLE1BQU0sQ0FBQyxhQUFhLEVBQUUsZ0JBQWdCLENBQUM7S0FDdkMsTUFBTSxDQUFDLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQztLQUN6QyxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUMvQixJQUFJLENBQUM7UUFDSCxNQUFNLE1B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QyxDQUFDO0lBQy9FLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO0lBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMvQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztJQUN6QyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztJQUN6QyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMseUNBQXlDLENBQUMsQ0FBQyxDQUFDO0FBQ3JFLENBQUMsQ0FBQyxDQUFDO0FBRUwsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG4vKipcbiAqIEtVSFVMIFR5cGVTY3JpcHQgQ0xJXG4gKiBcbiAqIENvbW1hbmQtbGluZSBpbnRlcmZhY2UgZm9yIGNvbXBpbGluZyBhbmQgcnVubmluZyBLVUhVTC1UUyBwcm9ncmFtc1xuICovXG5cbmltcG9ydCB7IENvbW1hbmQgfSBmcm9tICdjb21tYW5kZXInO1xuaW1wb3J0IHsgY29tcGlsZUZpbGUsIEtVSFVMVHlwZVNjcmlwdENvbXBpbGVyIH0gZnJvbSAnLi9jb21waWxlcic7XG5pbXBvcnQgeyBLVUhVTFJ1bnRpbWUgfSBmcm9tICcuL3J1bnRpbWUnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5cbmNvbnN0IHByb2dyYW0gPSBuZXcgQ29tbWFuZCgpO1xuXG5wcm9ncmFtXG4gIC5uYW1lKCdrdWh1bC10cycpXG4gIC5kZXNjcmlwdGlvbignS1VIVUwgVHlwZVNjcmlwdCAtIFR5cGVTY3JpcHQgc3ludGF4IHdpdGggS1VIVUwgZGV0ZXJtaW5pc3RpYyBzZW1hbnRpY3MnKVxuICAudmVyc2lvbignMS4wLjAnKTtcblxucHJvZ3JhbVxuICAuY29tbWFuZCgnY29tcGlsZSA8aW5wdXQ+JylcbiAgLmRlc2NyaXB0aW9uKCdDb21waWxlIEtVSFVMLVRTIHNvdXJjZSBmaWxlJylcbiAgLm9wdGlvbignLW8sIC0tb3V0cHV0IDxmaWxlPicsICdPdXRwdXQgZmlsZScpXG4gIC5vcHRpb24oJy13LCAtLXdhdGNoJywgJ1dhdGNoIGZvciBjaGFuZ2VzJylcbiAgLm9wdGlvbignLS10YXJnZXQgPHRhcmdldD4nLCAnVHlwZVNjcmlwdCB0YXJnZXQgKGVzMjAyMCwgZXMyMDIyLCBlc25leHQpJywgJ2VzMjAyMicpXG4gIC5vcHRpb24oJy0tbm8tZGV0ZXJtaW5pc3RpYycsICdEaXNhYmxlIGRldGVybWluaXN0aWMgbW9kZScpXG4gIC5vcHRpb24oJy0tbm8taGFzaC1jaGFpbicsICdEaXNhYmxlIGhhc2ggY2hhaW4nKVxuICAub3B0aW9uKCctLW5vLXJlcGxheScsICdEaXNhYmxlIHJlcGxheScpXG4gIC5vcHRpb24oJy0tbm8tY3NzLXZlcicsICdEaXNhYmxlIENTUy1WRVInKVxuICAuYWN0aW9uKGFzeW5jIChpbnB1dCwgb3B0aW9ucykgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzb3VyY2UgPSBmcy5yZWFkRmlsZVN5bmMoaW5wdXQsICd1dGYtOCcpO1xuICAgICAgXG4gICAgICBjb25zdCBjb21waWxlciA9IG5ldyBLVUhVTFR5cGVTY3JpcHRDb21waWxlcih7XG4gICAgICAgIGRldGVybWluaXN0aWM6IG9wdGlvbnMuZGV0ZXJtaW5pc3RpYyAhPT0gZmFsc2UsXG4gICAgICAgIGhhc2hDaGFpbjogb3B0aW9ucy5oYXNoQ2hhaW4gIT09IGZhbHNlLFxuICAgICAgICByZXBsYXlFbmFibGVkOiBvcHRpb25zLnJlcGxheSAhPT0gZmFsc2UsXG4gICAgICAgIGNzc1ZFUjogb3B0aW9ucy5jc3NWZXIgIT09IGZhbHNlLFxuICAgICAgICBzdmczRDogdHJ1ZSxcbiAgICAgICAgYmluYXJpZXM6IHtcbiAgICAgICAgICBhdG9taXplcjogJy4vYmluL2F0b21pemVyLmV4ZScsXG4gICAgICAgICAgbWVzaDogJy4vYmluL21lc2guZXhlJyxcbiAgICAgICAgICBsaW5lYXJfZm9sZDogJy4vYmluL2xpbmVhcl9mb2xkLmV4ZScsXG4gICAgICAgICAgbWljcm9uYXV0OiAnLi9iaW4vbWljcm9uYXV0LmV4ZScsXG4gICAgICAgICAgbWljcm9uYXV0X3hqc29uOiAnLi9iaW4vbWljcm9uYXV0X3hqc29uLmV4ZScsXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHQgPSBjb21waWxlci5jb21waWxlKHNvdXJjZSwgaW5wdXQpO1xuICAgICAgXG4gICAgICBjb25zdCBvdXRwdXRGaWxlID0gb3B0aW9ucy5vdXRwdXQgfHwgaW5wdXQucmVwbGFjZSgnLmt1aGwudHMnLCAnLmpzJyk7XG4gICAgICBmcy53cml0ZUZpbGVTeW5jKG91dHB1dEZpbGUsIHJlc3VsdC50cmFuc2Zvcm1lZENvZGUpO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZyhjaGFsay5ncmVlbign4pyTIENvbXBpbGVkIHN1Y2Nlc3NmdWxseSEnKSk7XG4gICAgICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKGAgIElucHV0OiAke2lucHV0fWApKTtcbiAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oYCAgT3V0cHV0OiAke291dHB1dEZpbGV9YCkpO1xuICAgICAgY29uc29sZS5sb2coY2hhbGsuY3lhbihgICDPgC1CaW5kaW5nczogJHtyZXN1bHQuz4BCaW5kaW5ncy5zaXplfWApKTtcbiAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oYCAgz4QtQmluZGluZ3M6ICR7cmVzdWx0Ls+EQmluZGluZ3Muc2l6ZX1gKSk7XG4gICAgICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKGAgIEdseXBoIENhbGxzOiAke3Jlc3VsdC5nbHlwaENhbGxzLmxlbmd0aH1gKSk7XG4gICAgICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKGAgIEZ1bmN0aW9uczogJHtyZXN1bHQuZnVuY3Rpb25zLmxlbmd0aH1gKSk7XG4gICAgICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKGAgIEludGVyZmFjZXM6ICR7cmVzdWx0LmludGVyZmFjZXMubGVuZ3RofWApKTtcbiAgICAgIFxuICAgICAgaWYgKG9wdGlvbnMud2F0Y2gpIHtcbiAgICAgICAgY29uc29sZS5sb2coY2hhbGsueWVsbG93KCdcXG7wn5GB77iPICBXYXRjaGluZyBmb3IgY2hhbmdlcy4uLicpKTtcbiAgICAgICAgZnMud2F0Y2goaW5wdXQsIChldmVudFR5cGUpID0+IHtcbiAgICAgICAgICBpZiAoZXZlbnRUeXBlID09PSAnY2hhbmdlJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuYmx1ZSgnXFxu8J+UhCBGaWxlIGNoYW5nZWQsIHJlY29tcGlsaW5nLi4uJykpO1xuICAgICAgICAgICAgY29uc3QgbmV3U291cmNlID0gZnMucmVhZEZpbGVTeW5jKGlucHV0LCAndXRmLTgnKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld1Jlc3VsdCA9IGNvbXBpbGVyLmNvbXBpbGUobmV3U291cmNlLCBpbnB1dCk7XG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKG91dHB1dEZpbGUsIG5ld1Jlc3VsdC50cmFuc2Zvcm1lZENvZGUpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JlZW4oJ+KckyBSZWNvbXBpbGVkIScpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoY2hhbGsucmVkKCfinJcgQ29tcGlsYXRpb24gZmFpbGVkOicpLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgIGlmIChlcnJvci5zdGFjaykge1xuICAgICAgICBjb25zb2xlLmVycm9yKGNoYWxrLmdyYXkoZXJyb3Iuc3RhY2spKTtcbiAgICAgIH1cbiAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG4gIH0pO1xuXG5wcm9ncmFtXG4gIC5jb21tYW5kKCdydW4gPGlucHV0PicpXG4gIC5kZXNjcmlwdGlvbignQ29tcGlsZSBhbmQgcnVuIEtVSFVMLVRTIHNvdXJjZSBmaWxlJylcbiAgLm9wdGlvbignLS1sb2cnLCAnRW5hYmxlIGxvZ2dpbmcnKVxuICAub3B0aW9uKCctLXByb2ZpbGUnLCAnRW5hYmxlIHByb2ZpbGluZycpXG4gIC5hY3Rpb24oYXN5bmMgKGlucHV0LCBvcHRpb25zKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oJ+KnqyBLVUhVTCBUeXBlU2NyaXB0IFJ1bnRpbWUnKSk7XG4gICAgICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKGAgIFNvdXJjZTogJHtpbnB1dH1cXG5gKSk7XG4gICAgICBcbiAgICAgIGNvbnN0IHNvdXJjZSA9IGZzLnJlYWRGaWxlU3luYyhpbnB1dCwgJ3V0Zi04Jyk7XG4gICAgICBcbiAgICAgIGNvbnN0IGNvbXBpbGVyID0gbmV3IEtVSFVMVHlwZVNjcmlwdENvbXBpbGVyKHtcbiAgICAgICAgZGV0ZXJtaW5pc3RpYzogdHJ1ZSxcbiAgICAgICAgaGFzaENoYWluOiB0cnVlLFxuICAgICAgICByZXBsYXlFbmFibGVkOiB0cnVlLFxuICAgICAgICBjc3NWRVI6IGZhbHNlLCAvLyBEaXNhYmxlIENTUy1WRVIgaW4gTm9kZS5qc1xuICAgICAgICBzdmczRDogZmFsc2UsXG4gICAgICAgIGJpbmFyaWVzOiB7fVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGNvbXBpbGVyLmNvbXBpbGUoc291cmNlLCBpbnB1dCk7XG4gICAgICBcbiAgICAgIC8vIENyZWF0ZSBydW50aW1lXG4gICAgICBjb25zdCBydW50aW1lID0gbmV3IEtVSFVMUnVudGltZSh7XG4gICAgICAgIGRldGVybWluaXN0aWM6IHRydWUsXG4gICAgICAgIGhhc2hDaGFpbjogdHJ1ZSxcbiAgICAgICAgcmVwbGF5RW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgY3NzVkVSOiBmYWxzZSxcbiAgICAgICAgc3ZnM0Q6IGZhbHNlLFxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIFNldHVwIGxvZ2dpbmdcbiAgICAgIGlmIChvcHRpb25zLmxvZykge1xuICAgICAgICBydW50aW1lLm9uKCdsb2cnLCAobXNnKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuZ3JheShtc2cpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBydW50aW1lLm9uKCdmcmFtZV91cGRhdGUnLCAoZnJhbWUpID0+IHtcbiAgICAgICAgICBpZiAoZnJhbWUgJSA2MCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coY2hhbGsuYmx1ZShgRnJhbWU6ICR7ZnJhbWV9YCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIFBhcnNlIGFuZCBleGVjdXRlXG4gICAgICBjb25zb2xlLmxvZyhjaGFsay5ncmVlbign4pyTIENvbXBpbGVkJykpO1xuICAgICAgY29uc29sZS5sb2coY2hhbGsuY3lhbihgICDPgC1CaW5kaW5nczogJHtyZXN1bHQuz4BCaW5kaW5ncy5zaXplfWApKTtcbiAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oYCAgz4QtQmluZGluZ3M6ICR7cmVzdWx0Ls+EQmluZGluZ3Muc2l6ZX1gKSk7XG4gICAgICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKGAgIEdseXBoIENhbGxzOiAke3Jlc3VsdC5nbHlwaENhbGxzLmxlbmd0aH1cXG5gKSk7XG4gICAgICBcbiAgICAgIC8vIEluaXRpYWxpemUgYmluZGluZ3NcbiAgICAgIHJlc3VsdC7PgEJpbmRpbmdzLmZvckVhY2goKGJpbmRpbmcsIG5hbWUpID0+IHtcbiAgICAgICAgcnVudGltZS7PgC5zZXQobmFtZSwgYmluZGluZy52YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgcmVzdWx0Ls+EQmluZGluZ3MuZm9yRWFjaCgoYmluZGluZywgbmFtZSkgPT4ge1xuICAgICAgICBydW50aW1lLs+ELnNldChuYW1lLCBiaW5kaW5nLmluaXRpYWxWYWx1ZSk7XG4gICAgICAgIHJ1bnRpbWUuz4RIaXN0b3J5LnNldChuYW1lLCBbXSk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gRXhlY3V0ZVxuICAgICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgIGF3YWl0IHJ1bnRpbWUuZXhlY3V0ZUdseXBoUXVldWUocmVzdWx0LmdseXBoQ2FsbHMpO1xuICAgICAgY29uc3QgZW5kVGltZSA9IERhdGUubm93KCk7XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyZWVuKCdcXG7inJMgRXhlY3V0aW9uIGNvbXBsZXRlIScpKTtcbiAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oYCAgRnJhbWVzOiAke3J1bnRpbWUuZnJhbWV9YCkpO1xuICAgICAgY29uc29sZS5sb2coY2hhbGsuY3lhbihgICBIYXNoIGNoYWluOiAke3J1bnRpbWUuaGFzaENoYWluLmxlbmd0aH1gKSk7XG4gICAgICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKGAgIFRpbWU6ICR7ZW5kVGltZSAtIHN0YXJ0VGltZX1tc2ApKTtcbiAgICAgIFxuICAgICAgaWYgKG9wdGlvbnMucHJvZmlsZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhjaGFsay55ZWxsb3coJ1xcbvCfk4ogUHJvZmlsZTonKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oYCAgR2x5cGhzIGV4ZWN1dGVkOiAke3Jlc3VsdC5nbHlwaENhbGxzLmxlbmd0aH1gKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oYCAgQXZnIHRpbWUgcGVyIGdseXBoOiAkeyhlbmRUaW1lIC0gc3RhcnRUaW1lKSAvIHJlc3VsdC5nbHlwaENhbGxzLmxlbmd0aH1tc2ApKTtcbiAgICAgIH1cbiAgICAgIFxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoY2hhbGsucmVkKCfinJcgRXhlY3V0aW9uIGZhaWxlZDonKSwgZXJyb3IubWVzc2FnZSk7XG4gICAgICBpZiAoZXJyb3Iuc3RhY2spIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihjaGFsay5ncmF5KGVycm9yLnN0YWNrKSk7XG4gICAgICB9XG4gICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfVxuICB9KTtcblxucHJvZ3JhbVxuICAuY29tbWFuZCgnaW5pdCBbcHJvamVjdC1uYW1lXScpXG4gIC5kZXNjcmlwdGlvbignSW5pdGlhbGl6ZSBhIG5ldyBLVUhVTC1UUyBwcm9qZWN0JylcbiAgLmFjdGlvbigocHJvamVjdE5hbWUgPSAnbXkta3VodWwtYXBwJykgPT4ge1xuICAgIGNvbnN0IHByb2plY3REaXIgPSBwYXRoLnJlc29sdmUocHJvamVjdE5hbWUpO1xuICAgIFxuICAgIGlmIChmcy5leGlzdHNTeW5jKHByb2plY3REaXIpKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGNoYWxrLnJlZChgRGlyZWN0b3J5ICR7cHJvamVjdE5hbWV9IGFscmVhZHkgZXhpc3RzIWApKTtcbiAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9XG4gICAgXG4gICAgLy8gQ3JlYXRlIHByb2plY3Qgc3RydWN0dXJlXG4gICAgZnMubWtkaXJTeW5jKHByb2plY3REaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGZzLm1rZGlyU3luYyhwYXRoLmpvaW4ocHJvamVjdERpciwgJ3NyYycpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBcbiAgICAvLyBDcmVhdGUgcGFja2FnZS5qc29uXG4gICAgY29uc3QgcGFja2FnZUpzb24gPSB7XG4gICAgICBuYW1lOiBwcm9qZWN0TmFtZSxcbiAgICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgICB0eXBlOiAnbW9kdWxlJyxcbiAgICAgIHNjcmlwdHM6IHtcbiAgICAgICAgJ2Rldic6ICdrdWh1bC10cyBjb21waWxlIHNyYy9tYWluLmt1aGwudHMgLXcnLFxuICAgICAgICAnYnVpbGQnOiAna3VodWwtdHMgY29tcGlsZSBzcmMvbWFpbi5rdWhsLnRzIC1vIGRpc3QvYnVuZGxlLmpzJyxcbiAgICAgICAgJ3N0YXJ0JzogJ2t1aHVsLXRzIHJ1biBzcmMvbWFpbi5rdWhsLnRzJyxcbiAgICAgICAgJ3R5cGVjaGVjayc6ICd0c2MgLS1ub0VtaXQnXG4gICAgICB9LFxuICAgICAgZGV2RGVwZW5kZW5jaWVzOiB7XG4gICAgICAgICdAa3VodWwvdHMnOiAnXjEuMC4wJyxcbiAgICAgICAgJ3R5cGVzY3JpcHQnOiAnXjUuMi4yJ1xuICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgZnMud3JpdGVGaWxlU3luYyhcbiAgICAgIHBhdGguam9pbihwcm9qZWN0RGlyLCAncGFja2FnZS5qc29uJyksXG4gICAgICBKU09OLnN0cmluZ2lmeShwYWNrYWdlSnNvbiwgbnVsbCwgMilcbiAgICApO1xuICAgIFxuICAgIC8vIENyZWF0ZSB0c2NvbmZpZy5qc29uXG4gICAgY29uc3QgdHNjb25maWcgPSB7XG4gICAgICBjb21waWxlck9wdGlvbnM6IHtcbiAgICAgICAgdGFyZ2V0OiAnRVMyMDIyJyxcbiAgICAgICAgbW9kdWxlOiAnRVNOZXh0JyxcbiAgICAgICAgbGliOiBbJ0VTMjAyMicsICdET00nXSxcbiAgICAgICAgc3RyaWN0OiB0cnVlLFxuICAgICAgICBlc01vZHVsZUludGVyb3A6IHRydWUsXG4gICAgICAgIHNraXBMaWJDaGVjazogdHJ1ZSxcbiAgICAgICAgZm9yY2VDb25zaXN0ZW50Q2FzaW5nSW5GaWxlTmFtZXM6IHRydWUsXG4gICAgICAgIG91dERpcjogJy4vZGlzdCcsXG4gICAgICAgIHJvb3REaXI6ICcuL3NyYydcbiAgICAgIH0sXG4gICAgICBpbmNsdWRlOiBbJ3NyYy8qKi8qJ10sXG4gICAgICBleGNsdWRlOiBbJ25vZGVfbW9kdWxlcycsICdkaXN0J11cbiAgICB9O1xuICAgIFxuICAgIGZzLndyaXRlRmlsZVN5bmMoXG4gICAgICBwYXRoLmpvaW4ocHJvamVjdERpciwgJ3RzY29uZmlnLmpzb24nKSxcbiAgICAgIEpTT04uc3RyaW5naWZ5KHRzY29uZmlnLCBudWxsLCAyKVxuICAgICk7XG4gICAgXG4gICAgLy8gQ3JlYXRlIGt1aHVsLmNvbmZpZy5qc29uXG4gICAgY29uc3Qga3VodWxDb25maWcgPSB7XG4gICAgICB0YXJnZXQ6ICdlczIwMjInLFxuICAgICAgbW9kdWxlOiAnZXNuZXh0JyxcbiAgICAgIGt1aHVsOiB7XG4gICAgICAgIGRldGVybWluaXN0aWM6IHRydWUsXG4gICAgICAgIGhhc2hDaGFpbjogdHJ1ZSxcbiAgICAgICAgcmVwbGF5RW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgY3NzVkVSOiB0cnVlLFxuICAgICAgICBzdmczRDogdHJ1ZVxuICAgICAgfSxcbiAgICAgIGJpbmFyaWVzOiB7XG4gICAgICAgIGF0b21pemVyOiAnLi9iaW4vYXRvbWl6ZXIuZXhlJyxcbiAgICAgICAgbWVzaDogJy4vYmluL21lc2guZXhlJyxcbiAgICAgICAgbGluZWFyX2ZvbGQ6ICcuL2Jpbi9saW5lYXJfZm9sZC5leGUnLFxuICAgICAgICBtaWNyb25hdXQ6ICcuL2Jpbi9taWNyb25hdXQuZXhlJyxcbiAgICAgICAgbWljcm9uYXV0X3hqc29uOiAnLi9iaW4vbWljcm9uYXV0X3hqc29uLmV4ZSdcbiAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIGZzLndyaXRlRmlsZVN5bmMoXG4gICAgICBwYXRoLmpvaW4ocHJvamVjdERpciwgJ2t1aHVsLmNvbmZpZy5qc29uJyksXG4gICAgICBKU09OLnN0cmluZ2lmeShrdWh1bENvbmZpZywgbnVsbCwgMilcbiAgICApO1xuICAgIFxuICAgIC8vIENyZWF0ZSBleGFtcGxlIEtVSFVMLVRTIGZpbGVcbiAgICBjb25zdCBleGFtcGxlQ29kZSA9IGBcbi8vIG1haW4ua3VobC50cyAtIEtVSFVMIFR5cGVTY3JpcHQgRXhhbXBsZVxuaW1wb3J0IHsgz4AsIM+ELCBTZWssIFBvcCwgV28gfSBmcm9tICdAa3VodWwvdHMtcnVudGltZSc7XG5cbi8vIEltbXV0YWJsZSDPgC1iaW5kaW5nXG5jb25zdCBncmF2aXR5OiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl0gPSDPgChbMCwgOS44MSwgMF0pO1xuY29uc3Qgd29ybGQ6IGFueSA9IM+AKHtcbiAgYm9kaWVzOiBbXSBhcyBhbnlbXSxcbiAgZmllbGRzOiBbXSBhcyBhbnlbXSxcbiAgYWN0aXZlOiB0cnVlXG59KTtcblxuLy8gVGVtcG9yYWwgz4QtYmluZGluZ1xubGV0IGZyYW1lOiBudW1iZXIgPSDPhCgwKTtcbmxldCBmcHM6IG51bWJlciA9IM+EKDApO1xuXG4vLyBQaHlzaWNzIGJvZHkgaW50ZXJmYWNlXG5pbnRlcmZhY2UgQm9keSB7XG4gIGlkOiBzdHJpbmc7XG4gIHBvc2l0aW9uOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl07XG4gIHZlbG9jaXR5OiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl07XG4gIG1hc3M6IG51bWJlcjtcbn1cblxuLy8gQ3JlYXRlIHBoeXNpY3MgYm9kaWVzXG5mdW5jdGlvbiogY3JlYXRlQm9kaWVzKGNvdW50OiBudW1iZXIpIHtcbiAgeWllbGQqIFNlaygnbG9nJywgXFxgQ3JlYXRpbmcgXFwke2NvdW50fSBwaHlzaWNzIGJvZGllcy4uLlxcYCk7XG4gIFxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICBjb25zdCBib2R5OiBCb2R5ID0ge1xuICAgICAgaWQ6ICdib2R5XycgKyBpLFxuICAgICAgcG9zaXRpb246IFtNYXRoLnJhbmRvbSgpICogODAwLCBNYXRoLnJhbmRvbSgpICogNDAwLCAwXSxcbiAgICAgIHZlbG9jaXR5OiBbKE1hdGgucmFuZG9tKCkgLSAwLjUpICogNSwgKE1hdGgucmFuZG9tKCkgLSAwLjUpICogNSwgMF0sXG4gICAgICBtYXNzOiAxLjBcbiAgICB9O1xuICAgIFxuICAgIHlpZWxkKiBTZWsoJ2FkZF9ib2R5Jywgd29ybGQsIGJvZHkpO1xuICB9XG59XG5cbi8vIFBoeXNpY3MgdXBkYXRlXG5mdW5jdGlvbiogdXBkYXRlUGh5c2ljcyhkdDogbnVtYmVyKSB7XG4gIHlpZWxkKiBTZWsoJ3VwZGF0ZV9waHlzaWNzJywgd29ybGQsIGR0KTtcbn1cblxuLy8gTWFpbiBleGVjdXRpb25cbmFzeW5jIGZ1bmN0aW9uIG1haW4oKSB7XG4gIHlpZWxkKiBTZWsoJ2xvZycsICfwn5qAIFN0YXJ0aW5nIEtVSFVMIFR5cGVTY3JpcHQgUGh5c2ljcyBTaW11bGF0aW9uJyk7XG4gIHlpZWxkKiBjcmVhdGVCb2RpZXMoMjApO1xuICBcbiAgbGV0IGxhc3RUaW1lID0gRGF0ZS5ub3coKTtcbiAgXG4gIC8vIE1haW4gbG9vcFxuICB3aGlsZSAod29ybGQuYWN0aXZlKSB7XG4gICAgY29uc3QgY3VycmVudFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIGNvbnN0IGR0ID0gKGN1cnJlbnRUaW1lIC0gbGFzdFRpbWUpIC8gMTAwMDtcbiAgICBsYXN0VGltZSA9IGN1cnJlbnRUaW1lO1xuICAgIFxuICAgIGZwcyA9IM+EKDEgLyBkdCk7XG4gICAgXG4gICAgeWllbGQqIHVwZGF0ZVBoeXNpY3MoZHQpO1xuICAgIHlpZWxkKiBTZWsoJ3JlbmRlcl9mcmFtZScpO1xuICAgIFxuICAgIGZyYW1lID0gz4QoZnJhbWUgKyAxKTtcbiAgICBcbiAgICBpZiAoZnJhbWUgJSA2MCA9PT0gMCkge1xuICAgICAgeWllbGQqIFNlaygnbG9nJywgXFxgRnJhbWU6IFxcJHtmcmFtZX0sIEZQUzogXFwke2Zwcy50b0ZpeGVkKDEpfVxcYCk7XG4gICAgfVxuICAgIFxuICAgIC8vIFN0b3AgYWZ0ZXIgNjAwIGZyYW1lc1xuICAgIGlmIChmcmFtZSA+PSA2MDApIHtcbiAgICAgIHlpZWxkKiBTZWsoJ2xvZycsICdTaW11bGF0aW9uIGNvbXBsZXRlIScpO1xuICAgICAgeWllbGQqIFNlaygnaGFzaF9zdGF0ZScsIHsgZnJhbWUsIGZwcyB9KTtcbiAgICAgIHlpZWxkKiBYdWwoKTtcbiAgICB9XG4gIH1cbn1cblxubWFpbigpO1xuYC50cmltKCk7XG4gICAgXG4gICAgZnMud3JpdGVGaWxlU3luYyhcbiAgICAgIHBhdGguam9pbihwcm9qZWN0RGlyLCAnc3JjJywgJ21haW4ua3VobC50cycpLFxuICAgICAgZXhhbXBsZUNvZGVcbiAgICApO1xuICAgIFxuICAgIC8vIENyZWF0ZSBIVE1MIGV4YW1wbGVcbiAgICBjb25zdCBodG1sRXhhbXBsZSA9IGBcbjwhRE9DVFlQRSBodG1sPlxuPGh0bWwgbGFuZz1cImVuXCI+XG48aGVhZD5cbiAgPG1ldGEgY2hhcnNldD1cIlVURi04XCI+XG4gIDxtZXRhIG5hbWU9XCJ2aWV3cG9ydFwiIGNvbnRlbnQ9XCJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wXCI+XG4gIDx0aXRsZT4ke3Byb2plY3ROYW1lfSAtIEtVSFVMIFR5cGVTY3JpcHQ8L3RpdGxlPlxuICA8c3R5bGU+XG4gICAgYm9keSB7XG4gICAgICBtYXJnaW46IDA7XG4gICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgZm9udC1mYW1pbHk6IC1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgJ1NlZ29lIFVJJywgUm9ib3RvLCBzYW5zLXNlcmlmO1xuICAgICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZywgIzY2N2VlYSAwJSwgIzc2NGJhMiAxMDAlKTtcbiAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgIG1pbi1oZWlnaHQ6IDEwMHZoO1xuICAgIH1cbiAgICBcbiAgICAuY29udGFpbmVyIHtcbiAgICAgIG1heC13aWR0aDogODAwcHg7XG4gICAgICBtYXJnaW46IDAgYXV0bztcbiAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgIGJhY2tkcm9wLWZpbHRlcjogYmx1cigxMHB4KTtcbiAgICAgIGJvcmRlci1yYWRpdXM6IDIwcHg7XG4gICAgICBwYWRkaW5nOiA0MHB4O1xuICAgICAgYm94LXNoYWRvdzogMCAyMHB4IDYwcHggcmdiYSgwLCAwLCAwLCAwLjMpO1xuICAgIH1cbiAgICBcbiAgICBoMSB7XG4gICAgICBtYXJnaW4tdG9wOiAwO1xuICAgICAgZm9udC1zaXplOiAyLjVlbTtcbiAgICAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCg0NWRlZywgI2YwOTNmYiAwJSwgI2Y1NTc2YyAxMDAlKTtcbiAgICAgIC13ZWJraXQtYmFja2dyb3VuZC1jbGlwOiB0ZXh0O1xuICAgICAgLXdlYmtpdC10ZXh0LWZpbGwtY29sb3I6IHRyYW5zcGFyZW50O1xuICAgIH1cbiAgICBcbiAgICAuc3RhdHMge1xuICAgICAgZGlzcGxheTogZ3JpZDtcbiAgICAgIGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KDMsIDFmcik7XG4gICAgICBnYXA6IDIwcHg7XG4gICAgICBtYXJnaW4tdG9wOiAzMHB4O1xuICAgIH1cbiAgICBcbiAgICAuc3RhdCB7XG4gICAgICBiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSk7XG4gICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICB9XG4gICAgXG4gICAgLnN0YXQtdmFsdWUge1xuICAgICAgZm9udC1zaXplOiAyZW07XG4gICAgICBmb250LXdlaWdodDogYm9sZDtcbiAgICAgIGNvbG9yOiAjNGZkMWM1O1xuICAgIH1cbiAgICBcbiAgICAuY29uc29sZSB7XG4gICAgICBiYWNrZ3JvdW5kOiByZ2JhKDAsIDAsIDAsIDAuMyk7XG4gICAgICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICAgICAgcGFkZGluZzogMjBweDtcbiAgICAgIG1hcmdpbi10b3A6IDMwcHg7XG4gICAgICBmb250LWZhbWlseTogJ0NvdXJpZXIgTmV3JywgbW9ub3NwYWNlO1xuICAgICAgaGVpZ2h0OiAyMDBweDtcbiAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgfVxuICA8L3N0eWxlPlxuPC9oZWFkPlxuPGJvZHk+XG4gIDxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICA8aDE+8J+noCAke3Byb2plY3ROYW1lfTwvaDE+XG4gICAgPHA+S1VIVUwgVHlwZVNjcmlwdCBQaHlzaWNzIFNpbXVsYXRpb248L3A+XG4gICAgXG4gICAgPGRpdiBjbGFzcz1cInN0YXRzXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwic3RhdFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC1sYWJlbFwiPs+ALUJpbmRpbmdzPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LXZhbHVlXCIgaWQ9XCJwaS1jb3VudFwiPjA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInN0YXRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtbGFiZWxcIj7PhC1CaW5kaW5nczwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC12YWx1ZVwiIGlkPVwidGF1LWNvdW50XCI+MDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwic3RhdFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC1sYWJlbFwiPkZyYW1lPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LXZhbHVlXCIgaWQ9XCJmcmFtZS1jb3VudFwiPjA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICAgIFxuICAgIDxkaXYgY2xhc3M9XCJjb25zb2xlXCIgaWQ9XCJjb25zb2xlXCI+PC9kaXY+XG4gIDwvZGl2PlxuICBcbiAgPHNjcmlwdCB0eXBlPVwibW9kdWxlXCI+XG4gICAgaW1wb3J0IHsgS1VIVUxSdW50aW1lIH0gZnJvbSAnaHR0cHM6Ly91bnBrZy5jb20vQGt1aHVsL3RzLXJ1bnRpbWVAMS4wLjAvZGlzdC9ydW50aW1lLmpzJztcbiAgICBcbiAgICBjb25zdCBydW50aW1lID0gbmV3IEtVSFVMUnVudGltZSgpO1xuICAgIFxuICAgIHJ1bnRpbWUub24oJ2xvZycsIChtZXNzYWdlKSA9PiB7XG4gICAgICBjb25zdCBjb25zb2xlRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29uc29sZScpO1xuICAgICAgY29uc29sZUVsLmlubmVySFRNTCArPSAnPGRpdj4nICsgbWVzc2FnZSArICc8L2Rpdj4nO1xuICAgICAgY29uc29sZUVsLnNjcm9sbFRvcCA9IGNvbnNvbGVFbC5zY3JvbGxIZWlnaHQ7XG4gICAgfSk7XG4gICAgXG4gICAgcnVudGltZS5vbignZnJhbWVfdXBkYXRlJywgKGZyYW1lKSA9PiB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZnJhbWUtY291bnQnKS50ZXh0Q29udGVudCA9IGZyYW1lO1xuICAgIH0pO1xuICAgIFxuICAgIHJ1bnRpbWUub24oJ2NvbXBsZXRlJywgKHN0YXRzKSA9PiB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGktY291bnQnKS50ZXh0Q29udGVudCA9IHN0YXRzLs+AQmluZGluZ3M7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGF1LWNvdW50JykudGV4dENvbnRlbnQgPSBzdGF0cy7PhEJpbmRpbmdzO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIEV4YW1wbGUgS1VIVUwtVFMgY29kZSB3b3VsZCBiZSBjb21waWxlZCBhbmQgcnVuIGhlcmVcbiAgICBjb25zb2xlLmxvZygnS1VIVUwgVHlwZVNjcmlwdCBSdW50aW1lIFJlYWR5Jyk7XG4gIDwvc2NyaXB0PlxuPC9ib2R5PlxuPC9odG1sPlxuYC50cmltKCk7XG4gICAgXG4gICAgZnMud3JpdGVGaWxlU3luYyhcbiAgICAgIHBhdGguam9pbihwcm9qZWN0RGlyLCAnaW5kZXguaHRtbCcpLFxuICAgICAgaHRtbEV4YW1wbGVcbiAgICApO1xuICAgIFxuICAgIC8vIENyZWF0ZSBSRUFETUVcbiAgICBjb25zdCByZWFkbWUgPSBgXG4jICR7cHJvamVjdE5hbWV9XG5cbkEgS1VIVUwgVHlwZVNjcmlwdCBwcm9qZWN0XG5cbiMjIFF1aWNrIFN0YXJ0XG5cblxcYFxcYFxcYGJhc2hcbiMgSW5zdGFsbCBkZXBlbmRlbmNpZXNcbm5wbSBpbnN0YWxsXG5cbiMgRGV2ZWxvcG1lbnQgKHdhdGNoIG1vZGUpXG5ucG0gcnVuIGRldlxuXG4jIEJ1aWxkXG5ucG0gcnVuIGJ1aWxkXG5cbiMgUnVuXG5ucG0gc3RhcnRcblxuIyBUeXBlIGNoZWNrXG5ucG0gcnVuIHR5cGVjaGVja1xuXFxgXFxgXFxgXG5cbiMjIFByb2plY3QgU3RydWN0dXJlXG5cblxcYFxcYFxcYFxuc3JjL1xuICBtYWluLmt1aGwudHMgICAgIyBFbnRyeSBwb2ludFxuZGlzdC9cbiAgYnVuZGxlLmpzICAgICAgICMgQ29tcGlsZWQgb3V0cHV0XG5wYWNrYWdlLmpzb25cbnRzY29uZmlnLmpzb25cbmt1aHVsLmNvbmZpZy5qc29uXG5cXGBcXGBcXGBcblxuIyMgS1VIVUwtVFMgU3ludGF4XG5cblxcYFxcYFxcYHR5cGVzY3JpcHRcbmltcG9ydCB7IM+ALCDPhCwgU2VrLCBQb3AsIFdvIH0gZnJvbSAnQGt1aHVsL3RzLXJ1bnRpbWUnO1xuXG4vLyBJbW11dGFibGUgz4AtYmluZGluZ1xuY29uc3QgeDogbnVtYmVyID0gz4AoMTApO1xuXG4vLyBUZW1wb3JhbCDPhC1iaW5kaW5nXG5sZXQgZnJhbWU6IG51bWJlciA9IM+EKDApO1xuXG4vLyBHbHlwaCBleGVjdXRpb25cbmZ1bmN0aW9uKiBtYWluKCkge1xuICB5aWVsZCogU2VrKCdsb2cnLCAnSGVsbG8gS1VIVUwhJyk7XG4gIHlpZWxkKiBQb3AocmVzdWx0KTtcbn1cblxcYFxcYFxcYFxuXG4jIyBMZWFybiBNb3JlXG5cbi0gW0tVSFVMIFR5cGVTY3JpcHQgRG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9rdWh1bC5kZXYvdHMpXG4tIFtSdW50aW1lIEFQSV0oaHR0cHM6Ly9rdWh1bC5kZXYvdHMvcnVudGltZSlcbi0gW0NvbXBpbGVyIE9wdGlvbnNdKGh0dHBzOi8va3VodWwuZGV2L3RzL2NvbXBpbGVyKVxuYC50cmltKCk7XG4gICAgXG4gICAgZnMud3JpdGVGaWxlU3luYyhcbiAgICAgIHBhdGguam9pbihwcm9qZWN0RGlyLCAnUkVBRE1FLm1kJyksXG4gICAgICByZWFkbWVcbiAgICApO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKGNoYWxrLmdyZWVuKGDinJMgQ3JlYXRlZCBLVUhVTCBUeXBlU2NyaXB0IHByb2plY3Q6ICR7cHJvamVjdE5hbWV9YCkpO1xuICAgIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oJ1xcbk5leHQgc3RlcHM6JykpO1xuICAgIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oYCAgY2QgJHtwcm9qZWN0TmFtZX1gKSk7XG4gICAgY29uc29sZS5sb2coY2hhbGsuY3lhbignICBucG0gaW5zdGFsbCcpKTtcbiAgICBjb25zb2xlLmxvZyhjaGFsay5jeWFuKCcgIG5wbSBydW4gZGV2JykpO1xuICAgIGNvbnNvbGUubG9nKGNoYWxrLmN5YW4oJ1xcblRoZW4gb3BlbiBpbmRleC5odG1sIGluIHlvdXIgYnJvd3NlciEnKSk7XG4gIH0pO1xuXG5wcm9ncmFtLnBhcnNlKHByb2Nlc3MuYXJndik7XG4iXX0=