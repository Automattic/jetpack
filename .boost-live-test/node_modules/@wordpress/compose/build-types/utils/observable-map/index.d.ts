export type ObservableMap<K, V> = {
    get: (name: K) => V | undefined;
    set: (name: K, value: V) => void;
    delete: (name: K) => void;
    subscribe: (name: K, listener: () => void) => () => void;
};
/**
 * A constructor (factory) for `ObservableMap`, a map-like key/value data structure
 * where the individual entries are observable: using the `subscribe` method, you can
 * subscribe to updates for a particular keys. Each subscriber always observes one
 * specific key and is not notified about any unrelated changes (for different keys)
 * in the `ObservableMap`.
 *
 * @template K The type of the keys in the map.
 * @template V The type of the values in the map.
 * @return   A new instance of the `ObservableMap` type.
 */
export declare function observableMap<K, V>(): ObservableMap<K, V>;
//# sourceMappingURL=index.d.ts.map