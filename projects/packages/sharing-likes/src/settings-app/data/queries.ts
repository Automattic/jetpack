import { QueryClient, useQuery } from '@tanstack/react-query';
import { fetchServices, fetchSettings, fetchStatus } from './api';
import type { Settings, SharingLikesScriptData, Status } from '../types';

export const queryKeys = {
	status: [ 'sharing-likes', 'status' ] as const,
	settings: [ 'sharing-likes', 'settings' ] as const,
	services: [ 'sharing-likes', 'services' ] as const,
};

// Every write shares this scope, so requests reach the server one at a time, in order.
export const MUTATION_SCOPE = { id: 'sharing-likes' };

export const SAVE_SETTING_KEY = [ 'sharing-likes', 'save-setting' ] as const;

export const FEATURE_ACTION_KEY = [ 'sharing-likes', 'feature-action' ] as const;

// Matches every write by prefix, saves and feature actions alike.
export const WRITES_KEY = [ 'sharing-likes' ] as const;

/**
 * The screen's query client.
 *
 * @return Query client.
 */
export function createQueryClient(): QueryClient {
	return new QueryClient( {
		defaultOptions: {
			// Writes wait on their rereads, and a paused read only resumes once every queued write has finished.
			queries: { refetchOnWindowFocus: false, retry: false, networkMode: 'always' },
		},
	} );
}

/**
 * Start the cache from the script data, so the first render waits on no request.
 *
 * @param queryClient - Query client.
 * @param scriptData  - The page's script data.
 */
export function seedQueryClient( queryClient: QueryClient, scriptData: SharingLikesScriptData ) {
	queryClient.setQueryData( queryKeys.status, scriptData.status );
	queryClient.setQueryData( queryKeys.settings, scriptData.settings );
}

/**
 * Which variant each section renders.
 *
 * @return Status, once known.
 */
export function useStatus(): Status | undefined {
	return useQuery( { queryKey: queryKeys.status, queryFn: fetchStatus, staleTime: Infinity } ).data;
}

/**
 * Every setting the screen shows on this site.
 *
 * @return Settings, once known.
 */
export function useSettings(): Settings | undefined {
	return useQuery( { queryKey: queryKeys.settings, queryFn: fetchSettings, staleTime: Infinity } )
		.data;
}

/**
 * The enabled services. The route answers 409 unless the Sharing section configures.
 *
 * @param enabled - Whether to fetch.
 * @return The services query.
 */
export function useServices( enabled: boolean ) {
	return useQuery( {
		queryKey: queryKeys.services,
		queryFn: fetchServices,
		enabled,
		staleTime: Infinity,
		retry: false,
	} );
}
