/**
 * XUL Phase - Termination & Fold Closure
 *
 * The XUL phase terminates fold execution and seals the artifact.
 * It is the END monad that closes the computation box.
 *
 * Algebra: XUL → End
 * No further computation after XUL in this fold
 */
export class XulPhase {
    name = 'XUL';
    type = 'END_MONAD';
    priority = 6; // Always last
    terminated = false;
    /**
     * Enter XUL phase - prepares termination
     */
    enter(ctx, op) {
        if (this.terminated) {
            return {
                success: false,
                phase: this.name,
                error: 'Fold already terminated'
            };
        }
        return {
            success: true,
            phase: this.name,
            ready: true
        };
    }
    /**
     * Execute XUL phase - terminates fold
     */
    async execute(ctx, op) {
        this.terminated = true;
        ctx.world.active = false;
        const result = {
            success: true,
            phase: this.name,
            terminated: true,
            foldClosed: true,
            reason: op.reason || 'normal',
            hash: ctx.hashState({ terminated: true, reason: op.reason })
        };
        ctx.emit('fold_terminated', {
            foldId: ctx.frame,
            reason: op.reason,
            timestamp: Date.now()
        });
        return result;
    }
    /**
     * Exit XUL phase - fold is closed, no further execution
     */
    exit(ctx) {
        return {
            success: true,
            phase: this.name,
            foldSealed: true
        };
    }
    /**
     * Check if fold is terminated
     */
    isTerminated() {
        return this.terminated;
    }
    /**
     * Reset for next fold
     */
    reset() {
        this.terminated = false;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiWHVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BoYXNlcy9YdWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0dBUUc7QUFlSCxNQUFNLE9BQU8sUUFBUTtJQUNWLElBQUksR0FBRyxLQUFLLENBQUM7SUFDYixJQUFJLEdBQUcsV0FBVyxDQUFDO0lBQ25CLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxjQUFjO0lBRTdCLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFFM0I7O09BRUc7SUFDSCxLQUFLLENBQUMsR0FBaUIsRUFBRSxFQUFnQjtRQUN2QyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNwQixPQUFPO2dCQUNMLE9BQU8sRUFBRSxLQUFLO2dCQUNkLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDaEIsS0FBSyxFQUFFLHlCQUF5QjthQUNqQyxDQUFDO1FBQ0osQ0FBQztRQUVELE9BQU87WUFDTCxPQUFPLEVBQUUsSUFBSTtZQUNiLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNoQixLQUFLLEVBQUUsSUFBSTtTQUNaLENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQWlCLEVBQUUsRUFBZ0I7UUFDL0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDdkIsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBRXpCLE1BQU0sTUFBTSxHQUFjO1lBQ3hCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2hCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxJQUFJLFFBQVE7WUFDN0IsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDN0QsQ0FBQztRQUVGLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDMUIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxLQUFLO1lBQ2pCLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTTtZQUNqQixTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTtTQUN0QixDQUFDLENBQUM7UUFFSCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLENBQUMsR0FBaUI7UUFDcEIsT0FBTztZQUNMLE9BQU8sRUFBRSxJQUFJO1lBQ2IsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2hCLFVBQVUsRUFBRSxJQUFJO1NBQ2pCLENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSCxZQUFZO1FBQ1YsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUs7UUFDSCxJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztJQUMxQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFhVTCBQaGFzZSAtIFRlcm1pbmF0aW9uICYgRm9sZCBDbG9zdXJlXG4gKiBcbiAqIFRoZSBYVUwgcGhhc2UgdGVybWluYXRlcyBmb2xkIGV4ZWN1dGlvbiBhbmQgc2VhbHMgdGhlIGFydGlmYWN0LlxuICogSXQgaXMgdGhlIEVORCBtb25hZCB0aGF0IGNsb3NlcyB0aGUgY29tcHV0YXRpb24gYm94LlxuICogXG4gKiBBbGdlYnJhOiBYVUwg4oaSIEVuZFxuICogTm8gZnVydGhlciBjb21wdXRhdGlvbiBhZnRlciBYVUwgaW4gdGhpcyBmb2xkXG4gKi9cblxuaW1wb3J0IHsgUGhhc2UsIFBoYXNlUmVzdWx0LCBQaGFzZUNvbnRleHQgfSBmcm9tICcuL1BoYXNlJztcblxuZXhwb3J0IGludGVyZmFjZSBYdWxPcGVyYXRpb24ge1xuICByZWFzb24/OiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFh1bFJlc3VsdCBleHRlbmRzIFBoYXNlUmVzdWx0IHtcbiAgdGVybWluYXRlZDogdHJ1ZTtcbiAgZm9sZENsb3NlZDogdHJ1ZTtcbiAgcmVhc29uPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgWHVsUGhhc2UgaW1wbGVtZW50cyBQaGFzZTxYdWxPcGVyYXRpb24sIFh1bFJlc3VsdD4ge1xuICByZWFkb25seSBuYW1lID0gJ1hVTCc7XG4gIHJlYWRvbmx5IHR5cGUgPSAnRU5EX01PTkFEJztcbiAgcmVhZG9ubHkgcHJpb3JpdHkgPSA2OyAvLyBBbHdheXMgbGFzdFxuICBcbiAgcHJpdmF0ZSB0ZXJtaW5hdGVkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEVudGVyIFhVTCBwaGFzZSAtIHByZXBhcmVzIHRlcm1pbmF0aW9uXG4gICAqL1xuICBlbnRlcihjdHg6IFBoYXNlQ29udGV4dCwgb3A6IFh1bE9wZXJhdGlvbik6IFBoYXNlUmVzdWx0IHtcbiAgICBpZiAodGhpcy50ZXJtaW5hdGVkKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgcGhhc2U6IHRoaXMubmFtZSxcbiAgICAgICAgZXJyb3I6ICdGb2xkIGFscmVhZHkgdGVybWluYXRlZCdcbiAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgcGhhc2U6IHRoaXMubmFtZSxcbiAgICAgIHJlYWR5OiB0cnVlXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIFhVTCBwaGFzZSAtIHRlcm1pbmF0ZXMgZm9sZFxuICAgKi9cbiAgYXN5bmMgZXhlY3V0ZShjdHg6IFBoYXNlQ29udGV4dCwgb3A6IFh1bE9wZXJhdGlvbik6IFByb21pc2U8WHVsUmVzdWx0PiB7XG4gICAgdGhpcy50ZXJtaW5hdGVkID0gdHJ1ZTtcbiAgICBjdHgud29ybGQuYWN0aXZlID0gZmFsc2U7XG4gICAgXG4gICAgY29uc3QgcmVzdWx0OiBYdWxSZXN1bHQgPSB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgcGhhc2U6IHRoaXMubmFtZSxcbiAgICAgIHRlcm1pbmF0ZWQ6IHRydWUsXG4gICAgICBmb2xkQ2xvc2VkOiB0cnVlLFxuICAgICAgcmVhc29uOiBvcC5yZWFzb24gfHwgJ25vcm1hbCcsXG4gICAgICBoYXNoOiBjdHguaGFzaFN0YXRlKHsgdGVybWluYXRlZDogdHJ1ZSwgcmVhc29uOiBvcC5yZWFzb24gfSlcbiAgICB9O1xuICAgIFxuICAgIGN0eC5lbWl0KCdmb2xkX3Rlcm1pbmF0ZWQnLCB7XG4gICAgICBmb2xkSWQ6IGN0eC5mcmFtZSxcbiAgICAgIHJlYXNvbjogb3AucmVhc29uLFxuICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpXG4gICAgfSk7XG4gICAgXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGl0IFhVTCBwaGFzZSAtIGZvbGQgaXMgY2xvc2VkLCBubyBmdXJ0aGVyIGV4ZWN1dGlvblxuICAgKi9cbiAgZXhpdChjdHg6IFBoYXNlQ29udGV4dCk6IFBoYXNlUmVzdWx0IHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIHBoYXNlOiB0aGlzLm5hbWUsXG4gICAgICBmb2xkU2VhbGVkOiB0cnVlXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBmb2xkIGlzIHRlcm1pbmF0ZWRcbiAgICovXG4gIGlzVGVybWluYXRlZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy50ZXJtaW5hdGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IGZvciBuZXh0IGZvbGRcbiAgICovXG4gIHJlc2V0KCkge1xuICAgIHRoaXMudGVybWluYXRlZCA9IGZhbHNlO1xuICB9XG59XG4iXX0=