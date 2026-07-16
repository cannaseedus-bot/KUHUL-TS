/**
 * KUHUL TypeScript Runtime
 * 
 * Provides deterministic execution, state hashing, and CSS-VER integration
 * for KUHUL-TS compiled programs
 */

export interface KUHULRuntimeOptions {
  deterministic: boolean;
  hashChain: boolean;
  replayEnabled: boolean;
  cssVER: boolean;
  svg3D: boolean;
}

export interface GlyphCall {
  id: number;
  glyph: string;
  args: any[];
  timestamp: number;
}

export interface StateSnapshot {
  frame: number;
  π: Map<string, any>;
  τ: Map<string, any>;
  τHistory: Map<string, any[]>;
  hash: string;
}

export class KUHULRuntime {
  public π: Map<string, any> = new Map();
  public τ: Map<string, any> = new Map();
  public τHistory: Map<string, Array<{frame: number, value: any}>> = new Map();
  public frame: number = 0;
  public hashChain: string[] = [];
  public world: any = { bodies: [], fields: [], active: true };
  
  private options: KUHULRuntimeOptions;
  private eventHandlers: Map<string, Function[]> = new Map();
  private cssVER: CSSVER | null = null;

  constructor(options: Partial<KUHULRuntimeOptions> = {}) {
    this.options = {
      deterministic: options.deterministic ?? true,
      hashChain: options.hashChain ?? true,
      replayEnabled: options.replayEnabled ?? true,
      cssVER: options.cssVER ?? true,
      svg3D: options.svg3D ?? true,
    };

    if (this.options.cssVER) {
      this.cssVER = new CSSVER();
    }
  }

  // Event system
  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  // Execute glyph queue
  async executeGlyphQueue(queue: GlyphCall[]) {
    for (const call of queue) {
      const result = await this.executeGlyph(call.glyph, call.args);
      
      // Update τ bindings if result contains updates
      if (result && result.updateTau) {
        for (const [key, value] of Object.entries(result.updateTau)) {
          if (this.τ.has(key)) {
            const history = this.τHistory.get(key)!;
            history.push({
              frame: this.frame,
              value: value,
              hash: this.hashValue(value)
            });
            this.τ.set(key, value);
          }
        }
      }

      // Hash state for deterministic replay
      if (this.options.hashChain) {
        const stateHash = this.hashState({
          frame: this.frame,
          glyph: call.glyph,
          args: call.args,
          result: result,
          π: Object.fromEntries(this.π),
          τ: Object.fromEntries(this.τ)
        });
        
        this.hashChain.push(stateHash);
        this.emit('hash', { frame: this.frame, hash: stateHash });
      }

      this.frame++;
      this.emit('frame_update', this.frame);

      // Small delay for animation
      await new Promise(resolve => setTimeout(resolve, 16));
    }

    this.emit('complete', {
      frame: this.frame,
      hashChain: this.hashChain,
      πBindings: this.π.size,
      τBindings: this.τ.size
    });
  }

  // Execute individual glyph
  async executeGlyph(glyph: string, args: any[]) {
    switch (glyph) {
      case 'Sek':
        return await this.executeSek(...args);
      case 'Pop':
        return await this.executePop(...args);
      case 'Wo':
        return await this.executeWo(...args);
      case 'Ch\'en':
        return await this.executeChen(...args);
      case 'Yax':
        return await this.executeYax(...args);
      case 'Xul':
        return await this.executeXul(...args);
      default:
        console.warn('Unknown glyph:', glyph);
        return null;
    }
  }

  // Sek glyph - Side effects and knowledge
  async executeSek(operation: string, ...args: any[]) {
    this.emit('log', `[Sek] ${operation}: ${JSON.stringify(args)}`);

    switch (operation) {
      case 'log':
        console.log('[KUHUL]', ...args);
        return { message: args.join(' ') };

      case 'exec_binary':
        // Execute external binary (atomizer, mesh, linear_fold, micronaut)
        const [binaryName, config] = args;
        return await this.executeBinary(binaryName, config);

      case 'add_body':
        const [world, body] = args;
        world.bodies.push(body);
        this.emit('body_created', body);
        if (this.cssVER) {
          this.cssVER.createAgent(body);
        }
        return { body };

      case 'update_physics':
        const [world2, dt] = args;
        world2.bodies.forEach((body: any) => {
          body.velocity[1] += 9.81 * dt * 0.1;
          body.position[0] += body.velocity[0] * dt;
          body.position[1] += body.velocity[1] * dt;
          
          // Boundary collision
          if (body.position[0] < 0 || body.position[0] > 800) {
            body.velocity[0] *= -0.9;
          }
          if (body.position[1] < 0 || body.position[1] > 400) {
            body.velocity[1] *= -0.9;
          }
        });
        
        if (this.cssVER) {
          this.cssVER.updateFromPhysics(world2.bodies);
        }
        
        return { dt, bodyCount: world2.bodies.length };

      case 'hash_state':
        const [state] = args;
        const hash = this.hashState(state);
        return { hash };

      case 'add_field':
        const [world3, field] = args;
        world3.fields.push(field);
        return { field };

      case 'start_physics':
        const [world4, fps] = args;
        world4.active = true;
        return { started: true, fps: fps || 60 };

      case 'update_css':
        const [agent] = args;
        if (this.cssVER) {
          this.cssVER.updateElement(agent);
        }
        return { updated: true };

      case 'render_frame':
        this.emit('render', this.world.bodies);
        return { rendered: true };

      default:
        return { operation, args, note: 'Not implemented' };
    }
  }

  // Pop glyph - Return values
  async executePop(value: any) {
    this.emit('log', `[Pop] ${value}`);
    return { value };
  }

  // Wo glyph - World operations
  async executeWo(operation: string, ...args: any[]) {
    this.emit('log', `[Wo] ${operation}: ${JSON.stringify(args)}`);

    if (operation === 'set') {
      const [key, value] = args;
      if (this.τ.has(key)) {
        return { updateTau: { [key]: value } };
      }
    }

    return { operation, args };
  }

  // Ch'en glyph - Reading data
  async executeChen(source: string, ...args: any[]) {
    this.emit('log', `[Ch'en] Reading from ${source}: ${JSON.stringify(args)}`);
    return { source, data: 'sample data', timestamp: Date.now() };
  }

  // Yax glyph - Conditional
  async executeYax(condition: boolean, value: any) {
    this.emit('log', `[Yax] Condition: ${condition}, Value: ${value}`);
    const result = condition ? value : null;
    return { condition, value: result };
  }

  // Xul glyph - Stop execution
  async executeXul() {
    this.emit('log', '[Xul] Stopping execution');
    this.world.active = false;
    return { stopped: true };
  }

  // Execute external binary
  async executeBinary(binaryName: string, config: any) {
    const { spawn } = await import('child_process');
    const binaryPath = `${binaryName}.exe`;

    return new Promise((resolve) => {
      const proc = spawn(binaryPath, [JSON.stringify(config)]);
      let output = '';
      let error = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        error += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve({ binary: binaryName, result });
          } catch {
            resolve({ binary: binaryName, output });
          }
        } else {
          resolve({ binary: binaryName, error, code });
        }
      });

      proc.on('error', (err) => {
        resolve({ binary: binaryName, error: err.message });
      });
    });
  }

  // Hash state for deterministic replay
  hashState(state: any): string {
    const str = JSON.stringify(state);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  hashValue(value: any): string {
    return this.hashState({ value });
  }

  // Save state snapshot for replay
  saveSnapshot(): StateSnapshot {
    return {
      frame: this.frame,
      π: new Map(this.π),
      τ: new Map(this.τ),
      τHistory: new Map(this.τHistory),
      hash: this.hashChain[this.hashChain.length - 1] || ''
    };
  }

  // Replay from snapshot
  replayFrom(snapshot: StateSnapshot) {
    this.frame = snapshot.frame;
    this.π = new Map(snapshot.π);
    this.τ = new Map(snapshot.τ);
    this.τHistory = new Map(snapshot.τHistory);
    
    this.emit('replay', { frame: this.frame });
    return { replaying: true, frame: this.frame };
  }
}

// CSS-VER Integration
export class CSSVER {
  private agents: Map<string, any> = new Map();
  private cssVariables: Map<string, string> = new Map();

  createAgent(body: any) {
    const agent = {
      element: typeof document !== 'undefined' 
        ? document.querySelector(`[data-asx-id="${body.id}"]`)
        : null,
      bodyId: body.id,
      cssVars: new Map([
        ['--π-x', '0px'],
        ['--π-y', '0px'],
        ['--π-z', '0px'],
        ['--π-scale', '1'],
        ['--π-rotation', '0deg']
      ])
    };

    this.agents.set(body.id, agent);
    
    if (agent.element) {
      this.updateElement(agent);
    }

    return agent;
  }

  updateFromPhysics(bodies: any[]) {
    for (const body of bodies) {
      const agent = this.agents.get(body.id);
      if (agent) {
        agent.cssVars.set('--π-x', `${body.position[0]}px`);
        agent.cssVars.set('--π-y', `${body.position[1]}px`);
        agent.cssVars.set('--π-z', `${body.position[2] || 0}px`);
        
        if (agent.element) {
          this.updateElement(agent);
        }
      }
    }
  }

  updateElement(agent: any) {
    if (!agent.element) return;
    
    for (const [prop, value] of agent.cssVars) {
      agent.element.style.setProperty(prop, value);
    }
  }
}

// Type declarations for KUHUL-TS
declare global {
  function π<T>(value: T): T;
  function τ<T>(value: T): T;
  function Sek<T extends any[]>(op: string, ...args: T): Generator<any>;
  function Pop<T>(value: T): Generator<T>;
  function Wo<T extends any[]>(op: string, ...args: T): Generator<any>;
  function Ch'en<T extends any[]>(source: string, ...args: T): Generator<any>;
  function Yax<T>(condition: boolean, value: T): Generator<T>;
  function Xul(): Generator<any>;
}

export { π, τ, Sek, Pop, Wo, Ch'en, Yax, Xul };

// Runtime function implementations (for type checking)
function π<T>(value: T): T { return Object.freeze(value); }
function τ<T>(value: T): T { return value; }
function* Sek<T extends any[]>(op: string, ...args: T): Generator<any> { yield { op, args }; }
function* Pop<T>(value: T): Generator<T> { yield value; return value; }
function* Wo<T extends any[]>(op: string, ...args: T): Generator<any> { yield { op, args }; }
function* Ch'en<T extends any[]>(source: string, ...args: T): Generator<any> { yield { source, args }; }
function* Yax<T>(condition: boolean, value: T): Generator<T> { yield condition ? value : null!; }
function* Xul(): Generator<any> { yield { stopped: true }; }
