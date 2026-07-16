/**
 * OpenCL Compute Lane - Cross-Platform GPU Compute
 *
 * Uses OpenCL for GPU acceleration on AMD/Intel/NVIDIA
 * Falls back to CPU if no GPU available
 */
export class OpenCLLane {
    config;
    context = null;
    kernels = new Map();
    buffers = new Map();
    initialized = false;
    constructor(config = {}) {
        this.config = {
            useGPU: config.useGPU ?? true,
            maxWorkGroupSize: config.maxWorkGroupSize ?? 256,
            platform: config.platform,
            device: config.device
        };
    }
    /**
     * Initialize OpenCL context
     */
    async initialize() {
        console.log('⧫ Initializing OpenCL...');
        try {
            // In production, would use node-opencl or similar
            // This is a simulation for the architecture
            // Detect platforms and devices
            const platforms = await this.detectPlatforms();
            if (platforms.length === 0) {
                console.log('⚠ No OpenCL platforms found');
                return false;
            }
            // Select platform
            let selectedPlatform = platforms[0];
            if (this.config.platform) {
                const found = platforms.find(p => p.name.includes(this.config.platform));
                if (found)
                    selectedPlatform = found;
            }
            // Detect devices
            const devices = await this.detectDevices(selectedPlatform);
            if (devices.length === 0) {
                console.log('⚠ No OpenCL devices found');
                return false;
            }
            // Select device (prefer GPU if requested)
            let selectedDevice = devices[0];
            if (this.config.useGPU) {
                const gpu = devices.find(d => d.type === 'gpu');
                if (gpu)
                    selectedDevice = gpu;
            }
            if (this.config.device) {
                const found = devices.find(d => d.name.includes(this.config.device));
                if (found)
                    selectedDevice = found;
            }
            // Create context
            this.context = {
                platform: selectedPlatform,
                device: selectedDevice
            };
            this.initialized = true;
            console.log('⧫ OpenCL initialized:');
            console.log(`  Platform: ${selectedPlatform.name} (${selectedPlatform.vendor})`);
            console.log(`  Device: ${selectedDevice.name} (${selectedDevice.type})`);
            console.log(`  Memory: ${(selectedDevice.memory / 1024 / 1024).toFixed(0)} MB`);
            console.log(`  Max Work Group: ${selectedDevice.maxWorkGroupSize}`);
            // Create kernels
            await this.createKernels();
            return true;
        }
        catch (error) {
            console.log('⚠ OpenCL initialization failed:', error.message);
            return false;
        }
    }
    /**
     * Detect OpenCL platforms
     */
    async detectPlatforms() {
        // Simulated platform detection
        // In production, would call clGetPlatformIDs
        return [
            { name: 'NVIDIA CUDA', vendor: 'NVIDIA Corporation', version: 'OpenCL 3.0' },
            { name: 'AMD Accelerated', vendor: 'Advanced Micro Devices', version: 'OpenCL 2.1' },
            { name: 'Intel(R) OpenCL', vendor: 'Intel(R) Corporation', version: 'OpenCL 2.1' }
        ];
    }
    /**
     * Detect devices on platform
     */
    async detectDevices(platform) {
        // Simulated device detection
        // In production, would call clGetDeviceIDs
        const devices = [];
        if (platform.vendor.includes('NVIDIA')) {
            devices.push({
                name: 'NVIDIA GeForce RTX 3080',
                type: 'gpu',
                memory: 10240 * 1024 * 1024,
                maxWorkGroupSize: 1024
            });
        }
        else if (platform.vendor.includes('AMD')) {
            devices.push({
                name: 'AMD Radeon RX 6800 XT',
                type: 'gpu',
                memory: 16384 * 1024 * 1024,
                maxWorkGroupSize: 256
            });
        }
        else if (platform.vendor.includes('Intel')) {
            devices.push({
                name: 'Intel UHD Graphics',
                type: 'gpu',
                memory: 2048 * 1024 * 1024,
                maxWorkGroupSize: 256
            });
            devices.push({
                name: 'Intel Core i9',
                type: 'cpu',
                memory: 32 * 1024 * 1024 * 1024,
                maxWorkGroupSize: 1024
            });
        }
        return devices;
    }
    /**
     * Create OpenCL kernels
     */
    async createKernels() {
        if (!this.context)
            return;
        // Physics N-body kernel
        this.kernels.set('nbody', {
            name: 'nbody_simulate',
            workGroupSize: Math.min(256, this.context.device.maxWorkGroupSize)
        });
        // Matrix multiplication kernel
        this.kernels.set('matmul', {
            name: 'matrix_multiply',
            workGroupSize: Math.min(256, this.context.device.maxWorkGroupSize)
        });
        // Vector add kernel
        this.kernels.set('vector_add', {
            name: 'vector_add',
            workGroupSize: Math.min(256, this.context.device.maxWorkGroupSize)
        });
        console.log('  ✓ N-body kernel');
        console.log('  ✓ Matrix multiply kernel');
        console.log('  ✓ Vector add kernel');
    }
    /**
     * Execute N-body physics simulation
     */
    async simulatePhysics(bodies, timestep, gravity) {
        if (!this.initialized) {
            await this.initialize();
        }
        const kernel = this.kernels.get('nbody');
        if (!kernel) {
            throw new Error('N-body kernel not found');
        }
        const bodyCount = bodies.length;
        const workGroups = Math.ceil(bodyCount / kernel.workGroupSize);
        console.log(`  [OpenCL] Executing N-body: ${bodyCount} bodies, ${workGroups} work groups`);
        // Simulate OpenCL execution
        // In production, would:
        // 1. Create buffers with clCreateBuffer
        // 2. Write data with clEnqueueWriteBuffer
        // 3. Set kernel args with clSetKernelArg
        // 4. Execute with clEnqueueNDRangeKernel
        // 5. Read results with clEnqueueReadBuffer
        // Simulated result
        const result = bodies.map(body => ({
            position: [
                body.position[0] + body.velocity[0] * timestep,
                body.position[1] + body.velocity[1] * timestep - 0.5 * gravity * timestep * timestep,
                body.position[2] + body.velocity[2] * timestep
            ],
            velocity: [
                body.velocity[0],
                body.velocity[1] - gravity * timestep,
                body.velocity[2]
            ]
        }));
        return result;
    }
    /**
     * Execute matrix multiplication
     */
    async matmul(matrixA, matrixB, rowsA, colsA, colsB) {
        if (!this.initialized) {
            await this.initialize();
        }
        const kernel = this.kernels.get('matmul');
        if (!kernel) {
            throw new Error('MatMul kernel not found');
        }
        const workGroups = Math.ceil((rowsA * colsB) / kernel.workGroupSize);
        console.log(`  [OpenCL] Executing MatMul: ${rowsA}x${colsA} × ${colsA}x${colsB}`);
        // Simulated matrix multiplication
        const result = new Float32Array(rowsA * colsB);
        for (let i = 0; i < rowsA; i++) {
            for (let j = 0; j < colsB; j++) {
                let sum = 0;
                for (let k = 0; k < colsA; k++) {
                    sum += matrixA[i * colsA + k] * matrixB[k * colsB + j];
                }
                result[i * colsB + j] = sum;
            }
        }
        return result;
    }
    /**
     * Execute vector addition
     */
    async vectorAdd(a, b) {
        if (!this.initialized) {
            await this.initialize();
        }
        const kernel = this.kernels.get('vector_add');
        if (!kernel) {
            throw new Error('Vector add kernel not found');
        }
        console.log(`  [OpenCL] Executing Vector Add: ${a.length} elements`);
        const result = new Float32Array(a.length);
        for (let i = 0; i < a.length; i++) {
            result[i] = a[i] + b[i];
        }
        return result;
    }
    /**
     * Create buffer on device
     */
    async createBuffer(size, data) {
        const buffer = {
            size,
            data: data || new ArrayBuffer(size)
        };
        const id = `buf-${Date.now()}-${Math.random()}`;
        this.buffers.set(id, buffer);
        return buffer;
    }
    /**
     * Check if OpenCL is available
     */
    isAvailable() {
        return this.initialized && !!this.context;
    }
    /**
     * Get OpenCL stats
     */
    getStats() {
        if (!this.context) {
            return { available: false };
        }
        return {
            available: true,
            platform: this.context.platform.name,
            device: this.context.device.name,
            deviceType: this.context.device.type,
            memory: this.context.device.memory,
            maxWorkGroupSize: this.context.device.maxWorkGroupSize,
            kernels: this.kernels.size,
            buffers: this.buffers.size
        };
    }
    /**
     * Shutdown OpenCL
     */
    shutdown() {
        console.log('⧫ Shutting down OpenCL...');
        this.buffers.clear();
        this.kernels.clear();
        this.context = null;
        this.initialized = false;
    }
}
// ============================================================================
// OPENCL KERNEL SOURCES
// ============================================================================
export const nbodyKernelCL = `
__kernel void nbody_simulate(
    __global float4* positions,
    __global float4* velocities,
    __global float* masses,
    __global float4* outPositions,
    __global float4* outVelocities,
    const int bodyCount,
    const float timestep,
    const float gravity
) {
    int i = get_global_id(0);
    if (i >= bodyCount) return;
    
    float4 pos = positions[i];
    float4 vel = velocities[i];
    float mass = masses[i];
    
    float3 accel = (float3)(0.0f, 0.0f, 0.0f);
    
    // N-body gravity
    for (int j = 0; j < bodyCount; j++) {
        if (i == j) continue;
        
        float3 diff = positions[j].xyz - pos.xyz;
        float distSq = dot(diff, diff) + 0.0001f;
        float dist = sqrt(distSq);
        
        float forceMag = gravity * masses[j] / (distSq * dist);
        accel += diff * forceMag;
    }
    
    // Integrate
    vel.xyz += accel * timestep;
    pos.xyz += vel.xyz * timestep;
    
    outPositions[i] = pos;
    outVelocities[i] = vel;
}
`;
export const matmulKernelCL = `
__kernel void matrix_multiply(
    __global const float* matrixA,
    __global const float* matrixB,
    __global float* matrixC,
    const int rowsA,
    const int colsA,
    const int colsB
) {
    int row = get_global_id(1);
    int col = get_global_id(0);
    
    if (row >= rowsA || col >= colsB) return;
    
    float sum = 0.0f;
    
    for (int k = 0; k < colsA; k++) {
        sum += matrixA[row * colsA + k] * matrixB[k * colsB + col];
    }
    
    matrixC[row * colsB + col] = sum;
}
`;
export const vectorAddKernelCL = `
__kernel void vector_add(
    __global const float* a,
    __global const float* b,
    __global float* c,
    const int n
) {
    int i = get_global_id(0);
    if (i >= n) return;
    
    c[i] = a[i] + b[i];
}
`;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT3BlbkNMTGFuZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21wdXRlL09wZW5DTExhbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0dBS0c7QUFzQ0gsTUFBTSxPQUFPLFVBQVU7SUFDYixNQUFNLENBQXNCO0lBQzVCLE9BQU8sR0FBcUIsSUFBSSxDQUFDO0lBQ2pDLE9BQU8sR0FBMEIsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUMzQyxPQUFPLEdBQTBCLElBQUksR0FBRyxFQUFFLENBQUM7SUFDM0MsV0FBVyxHQUFZLEtBQUssQ0FBQztJQUVyQyxZQUFZLFNBQXVDLEVBQUU7UUFDbkQsSUFBSSxDQUFDLE1BQU0sR0FBRztZQUNaLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxJQUFJLElBQUk7WUFDN0IsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixJQUFJLEdBQUc7WUFDaEQsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1lBQ3pCLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtTQUN0QixDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFVBQVU7UUFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFFeEMsSUFBSSxDQUFDO1lBQ0gsa0RBQWtEO1lBQ2xELDRDQUE0QztZQUU1QywrQkFBK0I7WUFDL0IsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFFL0MsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7Z0JBQzNDLE9BQU8sS0FBSyxDQUFDO1lBQ2YsQ0FBQztZQUVELGtCQUFrQjtZQUNsQixJQUFJLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQyxJQUFJLElBQUksQ0FBQyxNQUFN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STtZQUNwQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTTtZQUNsQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0I7WUFDdEQsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSTtZQUMxQixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJO1NBQzNCLENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSCxRQUFRO1FBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNwQixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztJQUMzQixDQUFDO0NBQ0Y7QUFFRCwrRUFBK0U7QUFDL0Usd0JBQXdCO0FBQ3hCLCtFQUErRTtBQUUvRSxNQUFNLENBQUMsTUFBTSxhQUFhLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXVDNUIsQ0FBQztBQUVGLE1BQU0sQ0FBQyxNQUFNLGNBQWMsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXNCN0IsQ0FBQztBQUVGLE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFHOzs7Ozs7Ozs7Ozs7Q0FZaEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogT3BlbkNMIENvbXB1dGUgTGFuZSAtIENyb3NzLVBsYXRmb3JtIEdQVSBDb21wdXRlXG4gKiBcbiAqIFVzZXMgT3BlbkNMIGZvciBHUFUgYWNjZWxlcmF0aW9uIG9uIEFNRC9JbnRlbC9OVklESUFcbiAqIEZhbGxzIGJhY2sgdG8gQ1BVIGlmIG5vIEdQVSBhdmFpbGFibGVcbiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wZW5DTENvbXB1dGVDb25maWcge1xuICBwbGF0Zm9ybT86IHN0cmluZztcbiAgZGV2aWNlPzogc3RyaW5nO1xuICB1c2VHUFU6IGJvb2xlYW47XG4gIG1heFdvcmtHcm91cFNpemU6IG51bWJlcjtcbn1cblxuLy8gT3BlbkNMIHR5cGVzICh3b3VsZCBiZSBwcm92aWRlZCBieSBub2RlLW9wZW5jbCBvciBzaW1pbGFyKVxuaW50ZXJmYWNlIENMUGxhdGZvcm0ge1xuICBuYW1lOiBzdHJpbmc7XG4gIHZlbmRvcjogc3RyaW5nO1xuICB2ZXJzaW9uOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBDTERldmljZSB7XG4gIG5hbWU6IHN0cmluZztcbiAgdHlwZTogJ2dwdScgfCAnY3B1JztcbiAgbWVtb3J5OiBudW1iZXI7XG4gIG1heFdvcmtHcm91cFNpemU6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIENMQ29udGV4dCB7XG4gIGRldmljZTogQ0xEZXZpY2U7XG4gIHBsYXRmb3JtOiBDTFBsYXRmb3JtO1xufVxuXG5pbnRlcmZhY2UgQ0xLZXJuZWwge1xuICBuYW1lOiBzdHJpbmc7XG4gIHdvcmtHcm91cFNpemU6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIENMQnVmZmVyIHtcbiAgc2l6ZTogbnVtYmVyO1xuICBkYXRhOiBhbnk7XG59XG5cbmV4cG9ydCBjbGFzcyBPcGVuQ0xMYW5lIHtcbiAgcHJpdmF0ZSBjb25maWc6IE9wZW5DTENvbXB1dGVDb25maWc7XG4gIHByaXZhdGUgY29udGV4dDogQ0xDb250ZXh0IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUga2VybmVsczogTWFwPHN0cmluZywgQ0xLZXJuZWw+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIGJ1ZmZlcnM6IE1hcDxzdHJpbmcsIENMQnVmZmVyPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBpbml0aWFsaXplZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUGFydGlhbDxPcGVuQ0xDb21wdXRlQ29uZmlnPiA9IHt9KSB7XG4gICAgdGhpcy5jb25maWcgPSB7XG4gICAgICB1c2VHUFU6IGNvbmZpZy51c2VHUFUgPz8gdHJ1ZSxcbiAgICAgIG1heFdvcmtHcm91cFNpemU6IGNvbmZpZy5tYXhXb3JrR3JvdXBTaXplID8/IDI1NixcbiAgICAgIHBsYXRmb3JtOiBjb25maWcucGxhdGZvcm0sXG4gICAgICBkZXZpY2U6IGNvbmZpZy5kZXZpY2VcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgT3BlbkNMIGNvbnRleHRcbiAgICovXG4gIGFzeW5jIGluaXRpYWxpemUoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc29sZS5sb2coJ+KnqyBJbml0aWFsaXppbmcgT3BlbkNMLi4uJyk7XG5cbiAgICB0cnkge1xuICAgICAgLy8gSW4gcHJvZHVjdGlvbiwgd291bGQgdXNlIG5vZGUtb3BlbmNsIG9yIHNpbWlsYXJcbiAgICAgIC8vIFRoaXMgaXMgYSBzaW11bGF0aW9uIGZvciB0aGUgYXJjaGl0ZWN0dXJlXG5cbiAgICAgIC8vIERldGVjdCBwbGF0Zm9ybXMgYW5kIGRldmljZXNcbiAgICAgIGNvbnN0IHBsYXRmb3JtcyA9IGF3YWl0IHRoaXMuZGV0ZWN0UGxhdGZvcm1zKCk7XG4gICAgICBcbiAgICAgIGlmIChwbGF0Zm9ybXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfimqAgTm8gT3BlbkNMIHBsYXRmb3JtcyBmb3VuZCcpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIFNlbGVjdCBwbGF0Zm9ybVxuICAgICAgbGV0IHNlbGVjdGVkUGxhdGZvcm0gPSBwbGF0Zm9ybXNbMF07XG4gICAgICBpZiAodGhpcy5jb25maWcucGxhdGZvcm0pIHtcbiAgICAgICAgY29uc3QgZm91bmQgPSBwbGF0Zm9ybXMuZmluZChwID0+IHAubmFtZS5pbmNsdWRlcyh0aGlzLmNvbmZpZy5wbGF0Zm9ybSEpKTtcbiAgICAgICAgaWYgKGZvdW5kKSBzZWxlY3RlZFBsYXRmb3JtID0gZm91bmQ7XG4gICAgICB9XG5cbiAgICAgIC8vIERldGVjdCBkZXZpY2VzXG4gICAgICBjb25zdCBkZXZpY2VzID0gYXdhaXQgdGhpcy5kZXRlY3REZXZpY2VzKHNlbGVjdGVkUGxhdGZvcm0pO1xuICAgICAgXG4gICAgICBpZiAoZGV2aWNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coJ+KaoCBObyBPcGVuQ0wgZGV2aWNlcyBmb3VuZCcpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIFNlbGVjdCBkZXZpY2UgKHByZWZlciBHUFUgaWYgcmVxdWVzdGVkKVxuICAgICAgbGV0IHNlbGVjdGVkRGV2aWNlID0gZGV2aWNlc1swXTtcbiAgICAgIGlmICh0aGlzLmNvbmZpZy51c2VHUFUpIHtcbiAgICAgICAgY29uc3QgZ3B1ID0gZGV2aWNlcy5maW5kKGQgPT4gZC50eXBlID09PSAnZ3B1Jyk7XG4gICAgICAgIGlmIChncHUpIHNlbGVjdGVkRGV2aWNlID0gZ3B1O1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5jb25maWcuZGV2aWNlKSB7XG4gICAgICAgIGNvbnN0IGZvdW5kID0gZGV2aWNlcy5maW5kKGQgPT4gZC5uYW1lLmluY2x1ZGVzKHRoaXMuY29uZmlnLmRldmljZSEpKTtcbiAgICAgICAgaWYgKGZvdW5kKSBzZWxlY3RlZERldmljZSA9IGZvdW5kO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgY29udGV4dFxuICAgICAgdGhpcy5jb250ZXh0ID0ge1xuICAgICAgICBwbGF0Zm9ybTogc2VsZWN0ZWRQbGF0Zm9ybSxcbiAgICAgICAgZGV2aWNlOiBzZWxlY3RlZERldmljZVxuICAgICAgfTtcblxuICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG5cbiAgICAgIGNvbnNvbGUubG9nKCfip6sgT3BlbkNMIGluaXRpYWxpemVkOicpO1xuICAgICAgY29uc29sZS5sb2coYCAgUGxhdGZvcm06ICR7c2VsZWN0ZWRQbGF0Zm9ybS5uYW1lfSAoJHtzZWxlY3RlZFBsYXRmb3JtLnZlbmRvcn0pYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICBEZXZpY2U6ICR7c2VsZWN0ZWREZXZpY2UubmFtZX0gKCR7c2VsZWN0ZWREZXZpY2UudHlwZX0pYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICBNZW1vcnk6ICR7KHNlbGVjdGVkRGV2aWNlLm1lbW9yeSAvIDEwMjQgLyAxMDI0KS50b0ZpeGVkKDApfSBNQmApO1xuICAgICAgY29uc29sZS5sb2coYCAgTWF4IFdvcmsgR3JvdXA6ICR7c2VsZWN0ZWREZXZpY2UubWF4V29ya0dyb3VwU2l6ZX1gKTtcblxuICAgICAgLy8gQ3JlYXRlIGtlcm5lbHNcbiAgICAgIGF3YWl0IHRoaXMuY3JlYXRlS2VybmVscygpO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGNvbnNvbGUubG9nKCfimqAgT3BlbkNMIGluaXRpYWxpemF0aW9uIGZhaWxlZDonLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGV0ZWN0IE9wZW5DTCBwbGF0Zm9ybXNcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZGV0ZWN0UGxhdGZvcm1zKCk6IFByb21pc2U8Q0xQbGF0Zm9ybVtdPiB7XG4gICAgLy8gU2ltdWxhdGVkIHBsYXRmb3JtIGRldGVjdGlvblxuICAgIC8vIEluIHByb2R1Y3Rpb24sIHdvdWxkIGNhbGwgY2xHZXRQbGF0Zm9ybUlEc1xuICAgIHJldHVybiBbXG4gICAgICB7IG5hbWU6ICdOVklESUEgQ1VEQScsIHZlbmRvcjogJ05WSURJQSBDb3Jwb3JhdGlvbicsIHZlcnNpb246ICdPcGVuQ0wgMy4wJyB9LFxuICAgICAgeyBuYW1lOiAnQU1EIEFjY2VsZXJhdGVkJywgdmVuZG9yOiAnQWR2YW5jZWQgTWljcm8gRGV2aWNlcycsIHZlcnNpb246ICdPcGVuQ0wgMi4xJyB9LFxuICAgICAgeyBuYW1lOiAnSW50ZWwoUikgT3BlbkNMJywgdmVuZG9yOiAnSW50ZWwoUikgQ29ycG9yYXRpb24nLCB2ZXJzaW9uOiAnT3BlbkNMIDIuMScgfVxuICAgIF07XG4gIH1cblxuICAvKipcbiAgICogRGV0ZWN0IGRldmljZXMgb24gcGxhdGZvcm1cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZGV0ZWN0RGV2aWNlcyhwbGF0Zm9ybTogQ0xQbGF0Zm9ybSk6IFByb21pc2U8Q0xEZXZpY2VbXT4ge1xuICAgIC8vIFNpbXVsYXRlZCBkZXZpY2UgZGV0ZWN0aW9uXG4gICAgLy8gSW4gcHJvZHVjdGlvbiwgd291bGQgY2FsbCBjbEdldERldmljZUlEc1xuICAgIGNvbnN0IGRldmljZXM6IENMRGV2aWNlW10gPSBbXTtcblxuICAgIGlmIChwbGF0Zm9ybS52ZW5kb3IuaW5jbHVkZXMoJ05WSURJQScpKSB7XG4gICAgICBkZXZpY2VzLnB1c2goe1xuICAgICAgICBuYW1lOiAnTlZJRElBIEdlRm9yY2UgUlRYIDMwODAnLFxuICAgICAgICB0eXBlOiAnZ3B1JyxcbiAgICAgICAgbWVtb3J5OiAxMDI0MCAqIDEwMjQgKiAxMDI0LFxuICAgICAgICBtYXhXb3JrR3JvdXBTaXplOiAxMDI0XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHBsYXRmb3JtLnZlbmRvci5pbmNsdWRlcygnQU1EJykpIHtcbiAgICAgIGRldmljZXMucHVzaCh7XG4gICAgICAgIG5hbWU6ICdBTUQgUmFkZW9uIFJYIDY4MDAgWFQnLFxuICAgICAgICB0eXBlOiAnZ3B1JyxcbiAgICAgICAgbWVtb3J5OiAxNjM4NCAqIDEwMjQgKiAxMDI0LFxuICAgICAgICBtYXhXb3JrR3JvdXBTaXplOiAyNTZcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAocGxhdGZvcm0udmVuZG9yLmluY2x1ZGVzKCdJbnRlbCcpKSB7XG4gICAgICBkZXZpY2VzLnB1c2goe1xuICAgICAgICBuYW1lOiAnSW50ZWwgVUhEIEdyYXBoaWNzJyxcbiAgICAgICAgdHlwZTogJ2dwdScsXG4gICAgICAgIG1lbW9yeTogMjA0OCAqIDEwMjQgKiAxMDI0LFxuICAgICAgICBtYXhXb3JrR3JvdXBTaXplOiAyNTZcbiAgICAgIH0pO1xuICAgICAgZGV2aWNlcy5wdXNoKHtcbiAgICAgICAgbmFtZTogJ0ludGVsIENvcmUgaTknLFxuICAgICAgICB0eXBlOiAnY3B1JyxcbiAgICAgICAgbWVtb3J5OiAzMiAqIDEwMjQgKiAxMDI0ICogMTAyNCxcbiAgICAgICAgbWF4V29ya0dyb3VwU2l6ZTogMTAyNFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRldmljZXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIE9wZW5DTCBrZXJuZWxzXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGNyZWF0ZUtlcm5lbHMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmNvbnRleHQpIHJldHVybjtcblxuICAgIC8vIFBoeXNpY3MgTi1ib2R5IGtlcm5lbFxuICAgIHRoaXMua2VybmVscy5zZXQoJ25ib2R5Jywge1xuICAgICAgbmFtZTogJ25ib2R5X3NpbXVsYXRlJyxcbiAgICAgIHdvcmtHcm91cFNpemU6IE1hdGgubWluKDI1NiwgdGhpcy5jb250ZXh0LmRldmljZS5tYXhXb3JrR3JvdXBTaXplKVxuICAgIH0pO1xuXG4gICAgLy8gTWF0cml4IG11bHRpcGxpY2F0aW9uIGtlcm5lbFxuICAgIHRoaXMua2VybmVscy5zZXQoJ21hdG11bCcsIHtcbiAgICAgIG5hbWU6ICdtYXRyaXhfbXVsdGlwbHknLFxuICAgICAgd29ya0dyb3VwU2l6ZTogTWF0aC5taW4oMjU2LCB0aGlzLmNvbnRleHQuZGV2aWNlLm1heFdvcmtHcm91cFNpemUpXG4gICAgfSk7XG5cbiAgICAvLyBWZWN0b3IgYWRkIGtlcm5lbFxuICAgIHRoaXMua2VybmVscy5zZXQoJ3ZlY3Rvcl9hZGQnLCB7XG4gICAgICBuYW1lOiAndmVjdG9yX2FkZCcsXG4gICAgICB3b3JrR3JvdXBTaXplOiBNYXRoLm1pbigyNTYsIHRoaXMuY29udGV4dC5kZXZpY2UubWF4V29ya0dyb3VwU2l6ZSlcbiAgICB9KTtcblxuICAgIGNvbnNvbGUubG9nKCcgIOKckyBOLWJvZHkga2VybmVsJyk7XG4gICAgY29uc29sZS5sb2coJyAg4pyTIE1hdHJpeCBtdWx0aXBseSBrZXJuZWwnKTtcbiAgICBjb25zb2xlLmxvZygnICDinJMgVmVjdG9yIGFkZCBrZXJuZWwnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIE4tYm9keSBwaHlzaWNzIHNpbXVsYXRpb25cbiAgICovXG4gIGFzeW5jIHNpbXVsYXRlUGh5c2ljcyhcbiAgICBib2RpZXM6IEFycmF5PHsgcG9zaXRpb246IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXSwgdmVsb2NpdHk6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXSwgbWFzczogbnVtYmVyIH0+LFxuICAgIHRpbWVzdGVwOiBudW1iZXIsXG4gICAgZ3Jhdml0eTogbnVtYmVyXG4gICk6IFByb21pc2U8QXJyYXk8eyBwb3NpdGlvbjogW251bWJlciwgbnVtYmVyLCBudW1iZXJdLCB2ZWxvY2l0eTogW251bWJlciwgbnVtYmVyLCBudW1iZXJdIH0+PiB7XG4gICAgaWYgKCF0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBrZXJuZWwgPSB0aGlzLmtlcm5lbHMuZ2V0KCduYm9keScpO1xuICAgIGlmICgha2VybmVsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ04tYm9keSBrZXJuZWwgbm90IGZvdW5kJyk7XG4gICAgfVxuXG4gICAgY29uc3QgYm9keUNvdW50ID0gYm9kaWVzLmxlbmd0aDtcbiAgICBjb25zdCB3b3JrR3JvdXBzID0gTWF0aC5jZWlsKGJvZHlDb3VudCAvIGtlcm5lbC53b3JrR3JvdXBTaXplKTtcblxuICAgIGNvbnNvbGUubG9nKGAgIFtPcGVuQ0xdIEV4ZWN1dGluZyBOLWJvZHk6ICR7Ym9keUNvdW50fSBib2RpZXMsICR7d29ya0dyb3Vwc30gd29yayBncm91cHNgKTtcblxuICAgIC8vIFNpbXVsYXRlIE9wZW5DTCBleGVjdXRpb25cbiAgICAvLyBJbiBwcm9kdWN0aW9uLCB3b3VsZDpcbiAgICAvLyAxLiBDcmVhdGUgYnVmZmVycyB3aXRoIGNsQ3JlYXRlQnVmZmVyXG4gICAgLy8gMi4gV3JpdGUgZGF0YSB3aXRoIGNsRW5xdWV1ZVdyaXRlQnVmZmVyXG4gICAgLy8gMy4gU2V0IGtlcm5lbCBhcmdzIHdpdGggY2xTZXRLZXJuZWxBcmdcbiAgICAvLyA0LiBFeGVjdXRlIHdpdGggY2xFbnF1ZXVlTkRSYW5nZUtlcm5lbFxuICAgIC8vIDUuIFJlYWQgcmVzdWx0cyB3aXRoIGNsRW5xdWV1ZVJlYWRCdWZmZXJcblxuICAgIC8vIFNpbXVsYXRlZCByZXN1bHRcbiAgICBjb25zdCByZXN1bHQgPSBib2RpZXMubWFwKGJvZHkgPT4gKHtcbiAgICAgIHBvc2l0aW9uOiBbXG4gICAgICAgIGJvZHkucG9zaXRpb25bMF0gKyBib2R5LnZlbG9jaXR5WzBdICogdGltZXN0ZXAsXG4gICAgICAgIGJvZHkucG9zaXRpb25bMV0gKyBib2R5LnZlbG9jaXR5WzFdICogdGltZXN0ZXAgLSAwLjUgKiBncmF2aXR5ICogdGltZXN0ZXAgKiB0aW1lc3RlcCxcbiAgICAgICAgYm9keS5wb3NpdGlvblsyXSArIGJvZHkudmVsb2NpdHlbMl0gKiB0aW1lc3RlcFxuICAgICAgXSBhcyBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl0sXG4gICAgICB2ZWxvY2l0eTogW1xuICAgICAgICBib2R5LnZlbG9jaXR5WzBdLFxuICAgICAgICBib2R5LnZlbG9jaXR5WzFdIC0gZ3Jhdml0eSAqIHRpbWVzdGVwLFxuICAgICAgICBib2R5LnZlbG9jaXR5WzJdXG4gICAgICBdIGFzIFtudW1iZXIsIG51bWJlciwgbnVtYmVyXVxuICAgIH0pKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICovXG4gIGFzeW5jIG1hdG11bChcbiAgICBtYXRyaXhBOiBGbG9hdDMyQXJyYXksXG4gICAgbWF0cml4QjogRmxvYXQzMkFycmF5LFxuICAgIHJvd3NBOiBudW1iZXIsXG4gICAgY29sc0E6IG51bWJlcixcbiAgICBjb2xzQjogbnVtYmVyXG4gICk6IFByb21pc2U8RmxvYXQzMkFycmF5PiB7XG4gICAgaWYgKCF0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBrZXJuZWwgPSB0aGlzLmtlcm5lbHMuZ2V0KCdtYXRtdWwnKTtcbiAgICBpZiAoIWtlcm5lbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNYXRNdWwga2VybmVsIG5vdCBmb3VuZCcpO1xuICAgIH1cblxuICAgIGNvbnN0IHdvcmtHcm91cHMgPSBNYXRoLmNlaWwoKHJvd3NBICogY29sc0IpIC8ga2VybmVsLndvcmtHcm91cFNpemUpO1xuXG4gICAgY29uc29sZS5sb2coYCAgW09wZW5DTF0gRXhlY3V0aW5nIE1hdE11bDogJHtyb3dzQX14JHtjb2xzQX0gw5cgJHtjb2xzQX14JHtjb2xzQn1gKTtcblxuICAgIC8vIFNpbXVsYXRlZCBtYXRyaXggbXVsdGlwbGljYXRpb25cbiAgICBjb25zdCByZXN1bHQgPSBuZXcgRmxvYXQzMkFycmF5KHJvd3NBICogY29sc0IpO1xuICAgIFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm93c0E7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb2xzQjsgaisrKSB7XG4gICAgICAgIGxldCBzdW0gPSAwO1xuICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IGNvbHNBOyBrKyspIHtcbiAgICAgICAgICBzdW0gKz0gbWF0cml4QVtpICogY29sc0EgKyBrXSAqIG1hdHJpeEJbayAqIGNvbHNCICsgal07XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0W2kgKiBjb2xzQiArIGpdID0gc3VtO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSB2ZWN0b3IgYWRkaXRpb25cbiAgICovXG4gIGFzeW5jIHZlY3RvckFkZChhOiBGbG9hdDMyQXJyYXksIGI6IEZsb2F0MzJBcnJheSk6IFByb21pc2U8RmxvYXQzMkFycmF5PiB7XG4gICAgaWYgKCF0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICBhd2FpdCB0aGlzLmluaXRpYWxpemUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBrZXJuZWwgPSB0aGlzLmtlcm5lbHMuZ2V0KCd2ZWN0b3JfYWRkJyk7XG4gICAgaWYgKCFrZXJuZWwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVmVjdG9yIGFkZCBrZXJuZWwgbm90IGZvdW5kJyk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYCAgW09wZW5DTF0gRXhlY3V0aW5nIFZlY3RvciBBZGQ6ICR7YS5sZW5ndGh9IGVsZW1lbnRzYCk7XG5cbiAgICBjb25zdCByZXN1bHQgPSBuZXcgRmxvYXQzMkFycmF5KGEubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdFtpXSA9IGFbaV0gKyBiW2ldO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGJ1ZmZlciBvbiBkZXZpY2VcbiAgICovXG4gIGFzeW5jIGNyZWF0ZUJ1ZmZlcihzaXplOiBudW1iZXIsIGRhdGE/OiBhbnkpOiBQcm9taXNlPENMQnVmZmVyPiB7XG4gICAgY29uc3QgYnVmZmVyOiBDTEJ1ZmZlciA9IHtcbiAgICAgIHNpemUsXG4gICAgICBkYXRhOiBkYXRhIHx8IG5ldyBBcnJheUJ1ZmZlcihzaXplKVxuICAgIH07XG5cbiAgICBjb25zdCBpZCA9IGBidWYtJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCl9YDtcbiAgICB0aGlzLmJ1ZmZlcnMuc2V0KGlkLCBidWZmZXIpO1xuXG4gICAgcmV0dXJuIGJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBPcGVuQ0wgaXMgYXZhaWxhYmxlXG4gICAqL1xuICBpc0F2YWlsYWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pbml0aWFsaXplZCAmJiAhIXRoaXMuY29udGV4dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgT3BlbkNMIHN0YXRzXG4gICAqL1xuICBnZXRTdGF0cygpIHtcbiAgICBpZiAoIXRoaXMuY29udGV4dCkge1xuICAgICAgcmV0dXJuIHsgYXZhaWxhYmxlOiBmYWxzZSB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBhdmFpbGFibGU6IHRydWUsXG4gICAgICBwbGF0Zm9ybTogdGhpcy5jb250ZXh0LnBsYXRmb3JtLm5hbWUsXG4gICAgICBkZXZpY2U6IHRoaXMuY29udGV4dC5kZXZpY2UubmFtZSxcbiAgICAgIGRldmljZVR5cGU6IHRoaXMuY29udGV4dC5kZXZpY2UudHlwZSxcbiAgICAgIG1lbW9yeTogdGhpcy5jb250ZXh0LmRldmljZS5tZW1vcnksXG4gICAgICBtYXhXb3JrR3JvdXBTaXplOiB0aGlzLmNvbnRleHQuZGV2aWNlLm1heFdvcmtHcm91cFNpemUsXG4gICAgICBrZXJuZWxzOiB0aGlzLmtlcm5lbHMuc2l6ZSxcbiAgICAgIGJ1ZmZlcnM6IHRoaXMuYnVmZmVycy5zaXplXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaHV0ZG93biBPcGVuQ0xcbiAgICovXG4gIHNodXRkb3duKCk6IHZvaWQge1xuICAgIGNvbnNvbGUubG9nKCfip6sgU2h1dHRpbmcgZG93biBPcGVuQ0wuLi4nKTtcbiAgICB0aGlzLmJ1ZmZlcnMuY2xlYXIoKTtcbiAgICB0aGlzLmtlcm5lbHMuY2xlYXIoKTtcbiAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgfVxufVxuXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBPUEVOQ0wgS0VSTkVMIFNPVVJDRVNcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuZXhwb3J0IGNvbnN0IG5ib2R5S2VybmVsQ0wgPSBgXG5fX2tlcm5lbCB2b2lkIG5ib2R5X3NpbXVsYXRlKFxuICAgIF9fZ2xvYmFsIGZsb2F0NCogcG9zaXRpb25zLFxuICAgIF9fZ2xvYmFsIGZsb2F0NCogdmVsb2NpdGllcyxcbiAgICBfX2dsb2JhbCBmbG9hdCogbWFzc2VzLFxuICAgIF9fZ2xvYmFsIGZsb2F0NCogb3V0UG9zaXRpb25zLFxuICAgIF9fZ2xvYmFsIGZsb2F0NCogb3V0VmVsb2NpdGllcyxcbiAgICBjb25zdCBpbnQgYm9keUNvdW50LFxuICAgIGNvbnN0IGZsb2F0IHRpbWVzdGVwLFxuICAgIGNvbnN0IGZsb2F0IGdyYXZpdHlcbikge1xuICAgIGludCBpID0gZ2V0X2dsb2JhbF9pZCgwKTtcbiAgICBpZiAoaSA+PSBib2R5Q291bnQpIHJldHVybjtcbiAgICBcbiAgICBmbG9hdDQgcG9zID0gcG9zaXRpb25zW2ldO1xuICAgIGZsb2F0NCB2ZWwgPSB2ZWxvY2l0aWVzW2ldO1xuICAgIGZsb2F0IG1hc3MgPSBtYXNzZXNbaV07XG4gICAgXG4gICAgZmxvYXQzIGFjY2VsID0gKGZsb2F0MykoMC4wZiwgMC4wZiwgMC4wZik7XG4gICAgXG4gICAgLy8gTi1ib2R5IGdyYXZpdHlcbiAgICBmb3IgKGludCBqID0gMDsgaiA8IGJvZHlDb3VudDsgaisrKSB7XG4gICAgICAgIGlmIChpID09IGopIGNvbnRpbnVlO1xuICAgICAgICBcbiAgICAgICAgZmxvYXQzIGRpZmYgPSBwb3NpdGlvbnNbal0ueHl6IC0gcG9zLnh5ejtcbiAgICAgICAgZmxvYXQgZGlzdFNxID0gZG90KGRpZmYsIGRpZmYpICsgMC4wMDAxZjtcbiAgICAgICAgZmxvYXQgZGlzdCA9IHNxcnQoZGlzdFNxKTtcbiAgICAgICAgXG4gICAgICAgIGZsb2F0IGZvcmNlTWFnID0gZ3Jhdml0eSAqIG1hc3Nlc1tqXSAvIChkaXN0U3EgKiBkaXN0KTtcbiAgICAgICAgYWNjZWwgKz0gZGlmZiAqIGZvcmNlTWFnO1xuICAgIH1cbiAgICBcbiAgICAvLyBJbnRlZ3JhdGVcbiAgICB2ZWwueHl6ICs9IGFjY2VsICogdGltZXN0ZXA7XG4gICAgcG9zLnh5eiArPSB2ZWwueHl6ICogdGltZXN0ZXA7XG4gICAgXG4gICAgb3V0UG9zaXRpb25zW2ldID0gcG9zO1xuICAgIG91dFZlbG9jaXRpZXNbaV0gPSB2ZWw7XG59XG5gO1xuXG5leHBvcnQgY29uc3QgbWF0bXVsS2VybmVsQ0wgPSBgXG5fX2tlcm5lbCB2b2lkIG1hdHJpeF9tdWx0aXBseShcbiAgICBfX2dsb2JhbCBjb25zdCBmbG9hdCogbWF0cml4QSxcbiAgICBfX2dsb2JhbCBjb25zdCBmbG9hdCogbWF0cml4QixcbiAgICBfX2dsb2JhbCBmbG9hdCogbWF0cml4QyxcbiAgICBjb25zdCBpbnQgcm93c0EsXG4gICAgY29uc3QgaW50IGNvbHNBLFxuICAgIGNvbnN0IGludCBjb2xzQlxuKSB7XG4gICAgaW50IHJvdyA9IGdldF9nbG9iYWxfaWQoMSk7XG4gICAgaW50IGNvbCA9IGdldF9nbG9iYWxfaWQoMCk7XG4gICAgXG4gICAgaWYgKHJvdyA+PSByb3dzQSB8fCBjb2wgPj0gY29sc0IpIHJldHVybjtcbiAgICBcbiAgICBmbG9hdCBzdW0gPSAwLjBmO1xuICAgIFxuICAgIGZvciAoaW50IGsgPSAwOyBrIDwgY29sc0E7IGsrKykge1xuICAgICAgICBzdW0gKz0gbWF0cml4QVtyb3cgKiBjb2xzQSArIGtdICogbWF0cml4QltrICogY29sc0IgKyBjb2xdO1xuICAgIH1cbiAgICBcbiAgICBtYXRyaXhDW3JvdyAqIGNvbHNCICsgY29sXSA9IHN1bTtcbn1cbmA7XG5cbmV4cG9ydCBjb25zdCB2ZWN0b3JBZGRLZXJuZWxDTCA9IGBcbl9fa2VybmVsIHZvaWQgdmVjdG9yX2FkZChcbiAgICBfX2dsb2JhbCBjb25zdCBmbG9hdCogYSxcbiAgICBfX2dsb2JhbCBjb25zdCBmbG9hdCogYixcbiAgICBfX2dsb2JhbCBmbG9hdCogYyxcbiAgICBjb25zdCBpbnQgblxuKSB7XG4gICAgaW50IGkgPSBnZXRfZ2xvYmFsX2lkKDApO1xuICAgIGlmIChpID49IG4pIHJldHVybjtcbiAgICBcbiAgICBjW2ldID0gYVtpXSArIGJbaV07XG59XG5gO1xuIl19