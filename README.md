# KUHUL TypeScript (KUHUL-TS)

**TypeScript syntax with KUHUL deterministic semantics**

## Quick Start

```typescript
// main.kuhl.ts
import { π, τ, Sek, Pop, Wo } from '@kuhul/ts-runtime';

// Immutable π-binding (like const but tracked)
const gravity: [number, number, number] = π([0, 9.81, 0]);

// Temporal τ-binding (changes with physics)
let frame: number = τ(0);

// Generator function for glyph execution
function* initializeWorld() {
  yield* Sek('log', 'Initializing physics world...');
  
  const world = {
    bodies: [] as Body[],
    fields: [] as Field[]
  };
  
  // Add gravity field
  yield* Sek('add_field', world, {
    type: 'gravity',
    strength: gravity[1]
  });
  
  return world;
}

// Physics body interface
interface Body {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  mass: number;
}

// Deterministic physics update
function* updatePhysics(world: any, dt: number) {
  for (const body of world.bodies) {
    // Apply gravity
    body.velocity[1] += gravity[1] * dt;
    
    // Update position
    body.position[0] += body.velocity[0] * dt;
    body.position[1] += body.velocity[1] * dt;
  }
  
  // Hash state for deterministic replay
  const stateHash = yield* Sek('hash_state', world);
  yield* Pop(stateHash);
}

// Main execution
async function main() {
  const world = yield* initializeWorld();
  
  // Physics loop
  while (world.active) {
    yield* updatePhysics(world, 0.016);
    frame = τ(frame + 1);
  }
}

main();
```

## Compile & Run

```bash
# Install
npm install -g @kuhul/ts

# Initialize project
kuhul-ts init my-physics-app

# Compile
kuhul-ts compile src/main.kuhl.ts -o dist/bundle.js

# Run
kuhul-ts run src/main.kuhl.ts

# Development (watch mode)
kuhul-ts dev src/
```

## Key Concepts

### π-Bindings (Immutable)
```typescript
// Traditional TypeScript
const MAX_BODIES = 1000;

// KUHUL TypeScript
const MAX_BODIES: number = π(1000);
// Tracked as immutable, included in state hash
```

### τ-Bindings (Temporal)
```typescript
// Traditional TypeScript
let frameCount = 0;

// KUHUL TypeScript
let frameCount: number = τ(0);
// Tracked as temporal, recorded in history for replay
```

### Glyph Execution
```typescript
// All side effects through glyphs
yield* Sek('log', message);           // Log operation
yield* Sek('add_body', world, body);  // Add physics body
yield* Pop(result);                    // Return value
yield* Wo('set_state', key, value);   // State mutation
```

### @-Directives (Deterministic Control)
```typescript
@if (condition) {
  // Deterministic branch
} @else {
  // Alternative branch
}

@for (const body of world.bodies) {
  // Deterministic iteration
}

@while (world.active) {
  // Deterministic loop
}
```

## Type System Extensions

```typescript
// π-type (immutable tracked)
type π<T> = T & { __kuhul_π: true };

// τ-type (temporal tracked)
type τ<T> = T & { __kuhul_τ: true };

// Glyph type
type Glyph<T extends any[], R> = (...args: T) => Generator<R>;

// Sek glyph signature
declare function Sek<T extends any[]>(
  op: string,
  ...args: T
): Generator<any>;

// Pop glyph signature
declare function Pop<T>(value: T): Generator<T>;

// Wo glyph signature
declare function Wo<T extends any[]>(
  op: string,
  ...args: T
): Generator<any>;
```

## Integration with Binaries

```typescript
// Call atomizer.exe
const atoms = yield* Sek('exec_binary', 'atomizer', {
  input: text,
  output: 'atoms.bin'
});

// Call mesh.exe for SVG-3D
const svgMesh = yield* Sek('exec_binary', 'mesh', {
  graph: attentionGraph,
  svg3d: true
});

// Call linear_fold.exe
const structure = yield* Sek('exec_binary', 'linear_fold', {
  sequence: tokenSequence
});

// Call micronaut.exe for evolution
const evolvedModel = yield* Sek('exec_binary', 'micronaut', {
  config: evolutionConfig,
  generations: 50
});
```

## CSS-VER Integration

```typescript
// Define CSS micro-agent
const buttonAgent = {
  element: document.querySelector('[data-asx-id="btn"]'),
  cssVars: new Map([
    ['--π-x', '0px'],
    ['--π-y', '0px'],
    ['--π-scale', '1'],
    ['--π-rotation', '0deg']
  ])
};

// Update from physics
function* updateFromPhysics(body: Body) {
  buttonAgent.cssVars.set('--π-x', `${body.position[0]}px`);
  buttonAgent.cssVars.set('--π-y', `${body.position[1]}px`);
  
  yield* Sek('update_css', buttonAgent);
}
```

## Project Structure

```
my-kuhul-app/
├── src/
│   ├── main.kuhl.ts        # Entry point
│   ├── physics.kuhl.ts     # Physics logic
│   ├── glyphs.kuhl.ts      # Custom glyphs
│   └── types.kuhl.ts       # Type definitions
├── dist/
│   ├── bundle.js           # Compiled JavaScript
│   ├── bundle.d.ts         # Type definitions
│   └── glyphs.xjson        # XJSON glyph programs
├── package.json
└── kuhul.config.json       # KUHUL configuration
```

## Configuration

```json
// kuhul.config.json
{
  "target": "es2022",
  "module": "esnext",
  "kuhul": {
    "deterministic": true,
    "hashChain": true,
    "replayEnabled": true,
    "cssVER": true,
    "svg3D": true
  },
  "binaries": {
    "atomizer": "./bin/atomizer.exe",
    "mesh": "./bin/mesh.exe",
    "linear_fold": "./bin/linear_fold.exe",
    "micronaut": "./bin/micronaut.exe",
    "micronaut_xjson": "./bin/micronaut_xjson.exe"
  }
}
```

## Why TypeScript?

1. **Type Safety** - Full TypeScript type checking
2. **Familiar Syntax** - No new syntax to learn
3. **Tooling** - Works with VS Code, ESLint, Prettier
4. **Gradual Adoption** - Mix with existing TypeScript code
5. **KUHUL Semantics** - Deterministic, physics-first, replayable

## The Trojan Horse

Developers think they're writing TypeScript, but they're actually writing KUHUL:

```typescript
// Looks like TypeScript
const x: number = π(10);

// But has KUHUL semantics
// - Immutable π-binding
// - Tracked in state hash
// - Deterministic replay
// - Physics-first execution
```
