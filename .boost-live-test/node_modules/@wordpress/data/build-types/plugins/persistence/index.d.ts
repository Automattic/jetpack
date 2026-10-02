import type { DataRegistry, StorageInterface } from '../../types';
interface PersistencePluginOptions {
    /**
     * Persistent storage implementation. This must
     * at least implement `getItem` and `setItem` of
     * the Web Storage API.
     */
    storage?: StorageInterface;
    /**
     * Key on which to set in persistent storage.
     */
    storageKey?: string;
}
interface PersistenceInterface {
    get: () => Record<string, unknown>;
    set: (key: string, value: unknown) => void;
}
/**
 * Higher-order reducer which invokes the original reducer only if state is
 * inequal from that of the action's `nextState` property, otherwise returning
 * the original state reference.
 *
 * @param reducer Original reducer.
 *
 * @return Enhanced reducer.
 */
export declare const withLazySameState: (reducer: (state: any, action: any) => any) => (state: unknown, action: {
    nextState: unknown;
}) => any;
/**
 * Creates a persistence interface, exposing getter and setter methods (`get`
 * and `set` respectively).
 *
 * @param options Plugin options.
 *
 * @return Persistence interface.
 */
export declare function createPersistenceInterface(options: PersistencePluginOptions): PersistenceInterface;
/**
 * Data plugin to persist store state into a single storage key.
 *
 * @param registry      Data registry.
 * @param pluginOptions Plugin options.
 *
 * @return Data plugin.
 */
declare function persistencePlugin(registry: DataRegistry, pluginOptions: PersistencePluginOptions): Partial<DataRegistry>;
declare const _default: typeof persistencePlugin & {
    __unstableMigrate: () => void;
};
export default _default;
//# sourceMappingURL=index.d.ts.map