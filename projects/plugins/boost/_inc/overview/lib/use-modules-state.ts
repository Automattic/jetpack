import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { z } from 'zod';
import { getMockMode } from './mock-mode';

const moduleStateSchema = z.object( {
	available: z.boolean(),
	active: z.boolean().optional(),
} );

const modulesStateSchema = z.record( z.string(), moduleStateSchema ).nullable();

export type ModulesState = z.infer< typeof modulesStateSchema >;

const wireSchema = z.object( {
	JSON: modulesStateSchema,
} );

declare global {
	const jetpack_boost_ds:
		| {
				modules_state?: { value?: unknown; nonce?: string };
				performance_history?: { value?: unknown; nonce?: string };
		  }
		| undefined;
}

/**
 * Reads the Boost module availability map via the data-sync REST surface.
 *
 * Only the `available` field is consumed for the Overview tab (it gates
 * the upgrade prompt over the Historical performance chart). The full
 * payload also carries `active` and per-module options but the schema
 * intentionally narrows to what the Overview needs so downstream PRs can
 * extend without colliding.
 *
 * In mock mode the hook returns a fake free-tier shape so the upgrade
 * prompt renders without needing a free site to test against.
 *
 * @return React Query state for the module availability map.
 */
export function useModulesState() {
	return useQuery( {
		queryKey: [ 'jetpack_boost_modules_state' ],
		queryFn: async (): Promise< ModulesState > => {
			const mock = getMockMode();
			if ( mock !== null ) {
				return {
					performance_history: { available: mock === 'paid' },
				};
			}
			const nonce = jetpack_boost_ds?.modules_state?.nonce ?? '';
			const raw = await apiFetch( {
				path: '/jetpack-boost-ds/modules-state',
				headers: { 'X-Jetpack-WP-JS-Sync-Nonce': nonce },
			} );
			const parsed = wireSchema.safeParse( raw );
			if ( ! parsed.success ) {
				return null;
			}
			return parsed.data.JSON;
		},
		staleTime: 12 * 60 * 60 * 1000,
	} );
}
