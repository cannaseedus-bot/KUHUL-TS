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
export declare class KUHULRuntime {
    π: Map<string, any>;
    τ: Map<string, any>;
    τHistory: Map<string, Array<{
        frame: number;
        value: any;
    }>>;
    frame: number;
    hashChain: string[];
    world: any;
    private options;
    private eventHandlers;
    private cssVER;
    constructor(options?: Partial<KUHULRuntimeOptions>);
    on(event: string, handler: Function): void;
    emit(event: string, data: any): void;
    executeGlyphQueue(queue: GlyphCall[]): Promise<void>;
    executeGlyph(glyph: string, args: any[]): Promise<unknown>;
    executeSek(operation: string, ...args: any[]): Promise<unknown>;
    executePop(value: any): Promise<{
        value: any;
    }>;
    executeWo(operation: string, ...args: any[]): Promise<{
        updateTau: {
            [x: number]: any;
        };
        operation?: undefined;
        args?: undefined;
    } | {
        operation: string;
        args: any[];
        updateTau?: undefined;
    }>;
    executeChen(source: string, ...args: any[]): Promise<{
        source: string;
        data: string;
        timestamp: number;
    }>;
    executeYax(condition: boolean, value: any): Promise<{
        condition: boolean;
        value: any;
    }>;
    executeXul(): Promise<{
        stopped: boolean;
    }>;
    executeBinary(binaryName: string, config: any): Promise<unknown>;
    hashState(state: any): string;
    hashValue(value: any): string;
    saveSnapshot(): StateSnapshot;
    replayFrom(snapshot: StateSnapshot): {
        replaying: boolean;
        frame: number;
    };
}
export declare class CSSVER {
    private agents;
    private cssVariables;
    createAgent(body: any): {
        element: Element | null;
        bodyId: any;
        cssVars: Map<string, string>;
    };
    updateFromPhysics(bodies: any[]): void;
    updateElement(agent: any): void;
}
declare global {
    function π<T>(value: T): T;
    function τ<T>(value: T): T;
    function Sek<T extends any[]>(op: string, ...args: T): Generator<any>;
    function Pop<T>(value: T): Generator<T>;
    function Wo<T extends any[]>(op: string, ...args: T): Generator<any>;
    function Ch(): any;
    function Yax<T>(condition: boolean, value: T): Generator<T>;
    function Xul(): Generator<any>;
}
export { π, τ, Sek, Pop, Wo, Ch, 'en, Yax, Xul };, function, π };
declare function τ<T>(value: T): T;
declare function Sek<T extends any[]>(op: string, ...args: T): Generator<any>;
declare function Pop<T>(value: T): Generator<T>;
declare function Wo<T extends any[]>(op: string, ...args: T): Generator<any>;
declare function Ch(): any;
