import type { DataRegistry, ReduxStoreConfig } from './types';
/**
 * Creates a new store registry, given an optional object of initial store
 * configurations.
 *
 * @param storeConfigs Initial store configurations.
 * @param parent       Parent registry.
 *
 * @return Data registry.
 */
export declare function createRegistry(storeConfigs?: Record<string, ReduxStoreConfig<any, any, any>>, parent?: DataRegistry | null): DataRegistry;
//# sourceMappingURL=registry.d.ts.map