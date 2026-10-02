export interface DataEmitter {
    emit: VoidFunction;
    subscribe: (listener: VoidFunction) => VoidFunction;
    pause: VoidFunction;
    resume: VoidFunction;
    isPaused: boolean;
}
/**
 * Create an event emitter.
 *
 * @return The event emitter.
 */
export declare function createEmitter(): DataEmitter;
//# sourceMappingURL=emitter.d.ts.map