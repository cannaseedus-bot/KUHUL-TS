/**
 * POP Phase - Return Values & Result Extraction
 *
 * The POP phase handles value extraction from the computation monad.
 * It is the RETURN operation in the KUHUL algebra.
 *
 * Algebra: POP(value) → M(value)
 * Pure: No side effects, only value wrapping
 */
export class PopPhase {
    name = 'POP';
    type = 'RETURN_MONAD';
    priority = 5; // Last to execute (after all effects)
    returnValues = [];
    /**
     * Enter POP phase - wraps value in monadic context
     */
    enter(ctx, op) {
        const wrapped = {
            value: op.value,
            type: op.type || typeof op.value,
            frame: ctx.frame,
            isPure: true
        };
        this.returnValues.push(wrapped);
        return {
            success: true,
            phase: this.name,
            wrapped: true
        };
    }
    /**
     * Execute POP phase - extracts and returns value
     */
    async execute(ctx, op) {
        const result = {
            success: true,
            phase: this.name,
            value: op.value,
            type: op.type || typeof op.value,
            isPure: true,
            hash: ctx.hashState({ value: op.value })
        };
        ctx.emit('pop_executed', {
            value: op.value,
            frame: ctx.frame
        });
        return result;
    }
    /**
     * Exit POP phase - clears return buffer
     */
    exit(ctx) {
        const count = this.returnValues.length;
        this.returnValues = [];
        return {
            success: true,
            phase: this.name,
            valuesReturned: count
        };
    }
    /**
     * Get last returned value
     */
    getLastValue() {
        return this.returnValues[this.returnValues.length - 1];
    }
    /**
     * Get all return values for this frame
     */
    getReturnValues() {
        return [...this.returnValues];
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUG9wLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BoYXNlcy9Qb3AudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0dBUUc7QUFnQkgsTUFBTSxPQUFPLFFBQVE7SUFDVixJQUFJLEdBQUcsS0FBSyxDQUFDO0lBQ2IsSUFBSSxHQUFHLGNBQWMsQ0FBQztJQUN0QixRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsc0NBQXNDO0lBRXJELFlBQVksR0FBVSxFQUFFLENBQUM7SUFFakM7O09BRUc7SUFDSCxLQUFLLENBQUMsR0FBaUIsRUFBRSxFQUFnQjtRQUN2QyxNQUFNLE9BQU8sR0FBRztZQUNkLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSztZQUNmLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxJQUFJLE9BQU8sRUFBRSxDQUFDLEtBQUs7WUFDaEMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO1lBQ2hCLE1BQU0sRUFBRSxJQUFJO1NBQ2IsQ0FBQztRQUVGLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWhDLE9BQU87WUFDTCxPQUFPLEVBQUUsSUFBSTtZQUNiLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNoQixPQUFPLEVBQUUsSUFBSTtTQUNkLENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQWlCLEVBQUUsRUFBZ0I7UUFDL0MsTUFBTSxNQUFNLEdBQWM7WUFDeEIsT0FBTyxFQUFFLElBQUk7WUFDYixLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDaEIsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLO1lBQ2YsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLElBQUksT0FBTyxFQUFFLENBQUMsS0FBSztZQUNoQyxNQUFNLEVBQUUsSUFBSTtZQUNaLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUN6QyxDQUFDO1FBRUYsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDdkIsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLO1lBQ2YsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO1NBQ2pCLENBQUMsQ0FBQztRQUVILE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksQ0FBQyxHQUFpQjtRQUNwQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQztRQUN2QyxJQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztRQUV2QixPQUFPO1lBQ0wsT0FBTyxFQUFFLElBQUk7WUFDYixLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDaEIsY0FBYyxFQUFFLEtBQUs7U0FDdEIsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNILFlBQVk7UUFDVixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsZUFBZTtRQUNiLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNoQyxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFBPUCBQaGFzZSAtIFJldHVybiBWYWx1ZXMgJiBSZXN1bHQgRXh0cmFjdGlvblxuICogXG4gKiBUaGUgUE9QIHBoYXNlIGhhbmRsZXMgdmFsdWUgZXh0cmFjdGlvbiBmcm9tIHRoZSBjb21wdXRhdGlvbiBtb25hZC5cbiAqIEl0IGlzIHRoZSBSRVRVUk4gb3BlcmF0aW9uIGluIHRoZSBLVUhVTCBhbGdlYnJhLlxuICogXG4gKiBBbGdlYnJhOiBQT1AodmFsdWUpIOKGkiBNKHZhbHVlKVxuICogUHVyZTogTm8gc2lkZSBlZmZlY3RzLCBvbmx5IHZhbHVlIHdyYXBwaW5nXG4gKi9cblxuaW1wb3J0IHsgUGhhc2UsIFBoYXNlUmVzdWx0LCBQaGFzZUNvbnRleHQgfSBmcm9tICcuL1BoYXNlJztcblxuZXhwb3J0IGludGVyZmFjZSBQb3BPcGVyYXRpb24ge1xuICB2YWx1ZTogYW55O1xuICB0eXBlPzogc3RyaW5nO1xuICB0aW1lc3RhbXA6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQb3BSZXN1bHQgZXh0ZW5kcyBQaGFzZVJlc3VsdCB7XG4gIHZhbHVlOiBhbnk7XG4gIHR5cGU6IHN0cmluZztcbiAgaXNQdXJlOiB0cnVlO1xufVxuXG5leHBvcnQgY2xhc3MgUG9wUGhhc2UgaW1wbGVtZW50cyBQaGFzZTxQb3BPcGVyYXRpb24sIFBvcFJlc3VsdD4ge1xuICByZWFkb25seSBuYW1lID0gJ1BPUCc7XG4gIHJlYWRvbmx5IHR5cGUgPSAnUkVUVVJOX01PTkFEJztcbiAgcmVhZG9ubHkgcHJpb3JpdHkgPSA1OyAvLyBMYXN0IHRvIGV4ZWN1dGUgKGFmdGVyIGFsbCBlZmZlY3RzKVxuICBcbiAgcHJpdmF0ZSByZXR1cm5WYWx1ZXM6IGFueVtdID0gW107XG5cbiAgLyoqXG4gICAqIEVudGVyIFBPUCBwaGFzZSAtIHdyYXBzIHZhbHVlIGluIG1vbmFkaWMgY29udGV4dFxuICAgKi9cbiAgZW50ZXIoY3R4OiBQaGFzZUNvbnRleHQsIG9wOiBQb3BPcGVyYXRpb24pOiBQaGFzZVJlc3VsdCB7XG4gICAgY29uc3Qgd3JhcHBlZCA9IHtcbiAgICAgIHZhbHVlOiBvcC52YWx1ZSxcbiAgICAgIHR5cGU6IG9wLnR5cGUgfHwgdHlwZW9mIG9wLnZhbHVlLFxuICAgICAgZnJhbWU6IGN0eC5mcmFtZSxcbiAgICAgIGlzUHVyZTogdHJ1ZVxuICAgIH07XG4gICAgXG4gICAgdGhpcy5yZXR1cm5WYWx1ZXMucHVzaCh3cmFwcGVkKTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIHBoYXNlOiB0aGlzLm5hbWUsXG4gICAgICB3cmFwcGVkOiB0cnVlXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIFBPUCBwaGFzZSAtIGV4dHJhY3RzIGFuZCByZXR1cm5zIHZhbHVlXG4gICAqL1xuICBhc3luYyBleGVjdXRlKGN0eDogUGhhc2VDb250ZXh0LCBvcDogUG9wT3BlcmF0aW9uKTogUHJvbWlzZTxQb3BSZXN1bHQ+IHtcbiAgICBjb25zdCByZXN1bHQ6IFBvcFJlc3VsdCA9IHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBwaGFzZTogdGhpcy5uYW1lLFxuICAgICAgdmFsdWU6IG9wLnZhbHVlLFxuICAgICAgdHlwZTogb3AudHlwZSB8fCB0eXBlb2Ygb3AudmFsdWUsXG4gICAgICBpc1B1cmU6IHRydWUsXG4gICAgICBoYXNoOiBjdHguaGFzaFN0YXRlKHsgdmFsdWU6IG9wLnZhbHVlIH0pXG4gICAgfTtcbiAgICBcbiAgICBjdHguZW1pdCgncG9wX2V4ZWN1dGVkJywge1xuICAgICAgdmFsdWU6IG9wLnZhbHVlLFxuICAgICAgZnJhbWU6IGN0eC5mcmFtZVxuICAgIH0pO1xuICAgIFxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogRXhpdCBQT1AgcGhhc2UgLSBjbGVhcnMgcmV0dXJuIGJ1ZmZlclxuICAgKi9cbiAgZXhpdChjdHg6IFBoYXNlQ29udGV4dCk6IFBoYXNlUmVzdWx0IHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMucmV0dXJuVmFsdWVzLmxlbmd0aDtcbiAgICB0aGlzLnJldHVyblZhbHVlcyA9IFtdO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgcGhhc2U6IHRoaXMubmFtZSxcbiAgICAgIHZhbHVlc1JldHVybmVkOiBjb3VudFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogR2V0IGxhc3QgcmV0dXJuZWQgdmFsdWVcbiAgICovXG4gIGdldExhc3RWYWx1ZSgpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLnJldHVyblZhbHVlc1t0aGlzLnJldHVyblZhbHVlcy5sZW5ndGggLSAxXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIHJldHVybiB2YWx1ZXMgZm9yIHRoaXMgZnJhbWVcbiAgICovXG4gIGdldFJldHVyblZhbHVlcygpOiBhbnlbXSB7XG4gICAgcmV0dXJuIFsuLi50aGlzLnJldHVyblZhbHVlc107XG4gIH1cbn1cbiJdfQ==