import { Instance } from "../fastHooks.mjs";
import type { ReadonlyStore } from "./Store.mjs";
export declare function useStore<State, Value>(store: ReadonlyStore<State>, selector: (state: State) => Value): Value;
export declare function useStore<State, Value, A1>(store: ReadonlyStore<State>, selector: (state: State, a1: A1) => Value, a1: A1): Value;
export declare function useStore<State, Value, A1, A2>(store: ReadonlyStore<State>, selector: (state: State, a1: A1, a2: A2) => Value, a1: A1, a2: A2): Value;
export declare function useStore<State, Value, A1, A2, A3>(store: ReadonlyStore<State>, selector: (state: State, a1: A1, a2: A2, a3: A3) => Value, a1: A1, a2: A2, a3: A3): Value;
export type StoreInstance = Instance & {
  syncIndex: number;
  syncTick: number;
  syncHooks: {
    store: any;
    selector: Function;
    a1: unknown;
    a2: unknown;
    a3: unknown;
    value: unknown;
  }[];
  didChangeStore: boolean;
  subscribe: (onStoreChange: any) => () => void;
  getSnapshot: () => unknown;
};