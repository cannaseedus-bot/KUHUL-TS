/**
 * YAX Phase - Conditional Branching
 *
 * The YAX phase handles deterministic conditional execution.
 * It is the CONTROL FLOW monad for KUHUL-TS.
 *
 * Algebra: YAX → (Condition × Branch) → SelectedBranch
 * Both branches are evaluated, one is selected (deterministic)
 */
export class YaxPhase {
    name = 'YAX';
    type = 'CONTROL_MONAD';
    priority = 4; // Same as CHEN, before POP
    branchLog = [];
    /**
     * Enter YAX phase - evaluates condition deterministically
     */
    enter(ctx, op) {
        // Condition must be pure (no side effects)
        // Both branches are prepared but not executed
        return {
            success: true,
            phase: this.name,
            condition: op.condition,
            branchesReady: true
        };
    }
    /**
     * Execute YAX phase - selects branch deterministically
     */
    async execute(ctx, op) {
        const selected = op.condition ? 'true' : 'false';
        this.branchLog.push({
            condition: op.condition,
            selected
        });
        const result = {
            success: true,
            phase: this.name,
            selected: selected,
            condition: op.condition,
            isDeterministic: true,
            hash: ctx.hashState({ condition: op.condition, selected })
        };
        ctx.emit('branch_selected', {
            selected,
            frame: ctx.frame
        });
        return result;
    }
    /**
     * Exit YAX phase - clears branch buffer
     */
    exit(ctx) {
        const count = this.branchLog.length;
        this.branchLog = [];
        return {
            success: true,
            phase: this.name,
            branchesEvaluated: count
        };
    }
    /**
     * Get branch history for analysis
     */
    getBranchHistory() {
        // Would maintain full history
        return [];
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiWWF4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BoYXNlcy9ZYXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7O0dBUUc7QUFpQkgsTUFBTSxPQUFPLFFBQVE7SUFDVixJQUFJLEdBQUcsS0FBSyxDQUFDO0lBQ2IsSUFBSSxHQUFHLGVBQWUsQ0FBQztJQUN2QixRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsMkJBQTJCO0lBRTFDLFNBQVMsR0FBa0QsRUFBRSxDQUFDO0lBRXRFOztPQUVHO0lBQ0gsS0FBSyxDQUFDLEdBQWlCLEVBQUUsRUFBZ0I7UUFDdkMsMkNBQTJDO1FBQzNDLDhDQUE4QztRQUU5QyxPQUFPO1lBQ0wsT0FBTyxFQUFFLElBQUk7WUFDYixLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDaEIsU0FBUyxFQUFFLEVBQUUsQ0FBQyxTQUFTO1lBQ3ZCLGFBQWEsRUFBRSxJQUFJO1NBQ3BCLENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQWlCLEVBQUUsRUFBZ0I7UUFDL0MsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFFakQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7WUFDbEIsU0FBUyxFQUFFLEVBQUUsQ0FBQyxTQUFTO1lBQ3ZCLFFBQVE7U0FDVCxDQUFDLENBQUM7UUFFSCxNQUFNLE1BQU0sR0FBYztZQUN4QixPQUFPLEVBQUUsSUFBSTtZQUNiLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNoQixRQUFRLEVBQUUsUUFBNEI7WUFDdEMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxTQUFTO1lBQ3ZCLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLENBQUM7U0FDM0QsQ0FBQztRQUVGLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDMUIsUUFBUTtZQUNSLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSztTQUNqQixDQUFDLENBQUM7UUFFSCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLENBQUMsR0FBaUI7UUFDcEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7UUFDcEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFFcEIsT0FBTztZQUNMLE9BQU8sRUFBRSxJQUFJO1lBQ2IsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2hCLGlCQUFpQixFQUFFLEtBQUs7U0FDekIsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNILGdCQUFnQjtRQUNkLDhCQUE4QjtRQUM5QixPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogWUFYIFBoYXNlIC0gQ29uZGl0aW9uYWwgQnJhbmNoaW5nXG4gKiBcbiAqIFRoZSBZQVggcGhhc2UgaGFuZGxlcyBkZXRlcm1pbmlzdGljIGNvbmRpdGlvbmFsIGV4ZWN1dGlvbi5cbiAqIEl0IGlzIHRoZSBDT05UUk9MIEZMT1cgbW9uYWQgZm9yIEtVSFVMLVRTLlxuICogXG4gKiBBbGdlYnJhOiBZQVgg4oaSIChDb25kaXRpb24gw5cgQnJhbmNoKSDihpIgU2VsZWN0ZWRCcmFuY2hcbiAqIEJvdGggYnJhbmNoZXMgYXJlIGV2YWx1YXRlZCwgb25lIGlzIHNlbGVjdGVkIChkZXRlcm1pbmlzdGljKVxuICovXG5cbmltcG9ydCB7IFBoYXNlLCBQaGFzZVJlc3VsdCwgUGhhc2VDb250ZXh0IH0gZnJvbSAnLi9QaGFzZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgWWF4T3BlcmF0aW9uIHtcbiAgY29uZGl0aW9uOiBib29sZWFuO1xuICB0cnVlQnJhbmNoOiBzdHJpbmc7XG4gIGZhbHNlQnJhbmNoPzogc3RyaW5nO1xuICB0aW1lc3RhbXA6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBZYXhSZXN1bHQgZXh0ZW5kcyBQaGFzZVJlc3VsdCB7XG4gIHNlbGVjdGVkOiAndHJ1ZScgfCAnZmFsc2UnO1xuICBjb25kaXRpb246IGJvb2xlYW47XG4gIGlzRGV0ZXJtaW5pc3RpYzogdHJ1ZTtcbn1cblxuZXhwb3J0IGNsYXNzIFlheFBoYXNlIGltcGxlbWVudHMgUGhhc2U8WWF4T3BlcmF0aW9uLCBZYXhSZXN1bHQ+IHtcbiAgcmVhZG9ubHkgbmFtZSA9ICdZQVgnO1xuICByZWFkb25seSB0eXBlID0gJ0NPTlRST0xfTU9OQUQnO1xuICByZWFkb25seSBwcmlvcml0eSA9IDQ7IC8vIFNhbWUgYXMgQ0hFTiwgYmVmb3JlIFBPUFxuICBcbiAgcHJpdmF0ZSBicmFuY2hMb2c6IEFycmF5PHtjb25kaXRpb246IGJvb2xlYW4sIHNlbGVjdGVkOiBzdHJpbmd9PiA9IFtdO1xuXG4gIC8qKlxuICAgKiBFbnRlciBZQVggcGhhc2UgLSBldmFsdWF0ZXMgY29uZGl0aW9uIGRldGVybWluaXN0aWNhbGx5XG4gICAqL1xuICBlbnRlcihjdHg6IFBoYXNlQ29udGV4dCwgb3A6IFlheE9wZXJhdGlvbik6IFBoYXNlUmVzdWx0IHtcbiAgICAvLyBDb25kaXRpb24gbXVzdCBiZSBwdXJlIChubyBzaWRlIGVmZmVjdHMpXG4gICAgLy8gQm90aCBicmFuY2hlcyBhcmUgcHJlcGFyZWQgYnV0IG5vdCBleGVjdXRlZFxuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgcGhhc2U6IHRoaXMubmFtZSxcbiAgICAgIGNvbmRpdGlvbjogb3AuY29uZGl0aW9uLFxuICAgICAgYnJhbmNoZXNSZWFkeTogdHJ1ZVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBZQVggcGhhc2UgLSBzZWxlY3RzIGJyYW5jaCBkZXRlcm1pbmlzdGljYWxseVxuICAgKi9cbiAgYXN5bmMgZXhlY3V0ZShjdHg6IFBoYXNlQ29udGV4dCwgb3A6IFlheE9wZXJhdGlvbik6IFByb21pc2U8WWF4UmVzdWx0PiB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSBvcC5jb25kaXRpb24gPyAndHJ1ZScgOiAnZmFsc2UnO1xuICAgIFxuICAgIHRoaXMuYnJhbmNoTG9nLnB1c2goe1xuICAgICAgY29uZGl0aW9uOiBvcC5jb25kaXRpb24sXG4gICAgICBzZWxlY3RlZFxuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IHJlc3VsdDogWWF4UmVzdWx0ID0ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIHBoYXNlOiB0aGlzLm5hbWUsXG4gICAgICBzZWxlY3RlZDogc2VsZWN0ZWQgYXMgJ3RydWUnIHwgJ2ZhbHNlJyxcbiAgICAgIGNvbmRpdGlvbjogb3AuY29uZGl0aW9uLFxuICAgICAgaXNEZXRlcm1pbmlzdGljOiB0cnVlLFxuICAgICAgaGFzaDogY3R4Lmhhc2hTdGF0ZSh7IGNvbmRpdGlvbjogb3AuY29uZGl0aW9uLCBzZWxlY3RlZCB9KVxuICAgIH07XG4gICAgXG4gICAgY3R4LmVtaXQoJ2JyYW5jaF9zZWxlY3RlZCcsIHtcbiAgICAgIHNlbGVjdGVkLFxuICAgICAgZnJhbWU6IGN0eC5mcmFtZVxuICAgIH0pO1xuICAgIFxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogRXhpdCBZQVggcGhhc2UgLSBjbGVhcnMgYnJhbmNoIGJ1ZmZlclxuICAgKi9cbiAgZXhpdChjdHg6IFBoYXNlQ29udGV4dCk6IFBoYXNlUmVzdWx0IHtcbiAgICBjb25zdCBjb3VudCA9IHRoaXMuYnJhbmNoTG9nLmxlbmd0aDtcbiAgICB0aGlzLmJyYW5jaExvZyA9IFtdO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgcGhhc2U6IHRoaXMubmFtZSxcbiAgICAgIGJyYW5jaGVzRXZhbHVhdGVkOiBjb3VudFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogR2V0IGJyYW5jaCBoaXN0b3J5IGZvciBhbmFseXNpc1xuICAgKi9cbiAgZ2V0QnJhbmNoSGlzdG9yeSgpOiBBcnJheTx7ZnJhbWU6IG51bWJlciwgY29uZGl0aW9uOiBib29sZWFuLCBzZWxlY3RlZDogc3RyaW5nfT4ge1xuICAgIC8vIFdvdWxkIG1haW50YWluIGZ1bGwgaGlzdG9yeVxuICAgIHJldHVybiBbXTtcbiAgfVxufVxuIl19