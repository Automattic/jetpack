import type { Dispatch, AnyAction } from 'redux';
/**
 * Create a co-routine runtime.
 *
 * @param controls Object of control handlers.
 * @param dispatch Unhandled action dispatch.
 */
export default function createRuntime(controls: Record<string, (value: any) => Promise<boolean> | boolean> | undefined, dispatch: Dispatch): (action: AnyAction | Generator) => Promise<unknown>;
//# sourceMappingURL=runtime.d.ts.map