import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useCallback } from '@wordpress/element';
import { z } from 'zod';

const moduleStateSchema = z.object( {
	available: z.boolean(),
	active: z.boolean().optional(),
} );

const modulesStateSchema = z.record( z.string(), moduleStateSchema ).nullable();

export type ModuleState = z.infer< typeof moduleStateSchema >;
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

const QUERY_KEY = [ 'jetpack_boost_modules_state' ] as const;
const READ_PATH = '/jetpack-boost-ds/modules-state';
const WRITE_PATH = '/jetpack-boost-ds/modules-state/set';

function readNonce(): string {
	return jetpack_boost_ds?.modules_state?.nonce ?? '';
}

/**
 * Reads the Boost module availability + active map via the data-sync REST
 * surface.
 *
 * Backs both the Overview (which only reads `performance_history.available`
 * to decide the upgrade-prompt overlay) and the Settings tab (which reads +
 * writes every module's `active` flag).
 *
 * @return React Query state for the module map.
 */
export function useModulesState() {
	return useQuery( {
		queryKey: QUERY_KEY,
		queryFn: async (): Promise< ModulesState > => {
			const raw = await apiFetch( {
				path: READ_PATH,
				headers: { 'X-Jetpack-WP-JS-Sync-Nonce': readNonce() },
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

/**
 * Mutation that flips a single module's `active` flag.
 *
 * Optimistically updates the cached map so the toggle renders the new state
 * immediately, then issues a POST to `modules-state/set` with the full map
 * (the data-sync entry only supports whole-object replacement). On
 * rejection the previous snapshot is restored and the cache is invalidated
 * so the next read re-syncs with the server.
 *
 * @return Tuple of [ `setModuleState( slug, next )`, mutation status ].
 */
export function useSetModuleState() {
	const client = useQueryClient();

	const mutation = useMutation( {
		mutationFn: async ( next: NonNullable< ModulesState > ): Promise< ModulesState > => {
			const raw = await apiFetch( {
				path: WRITE_PATH,
				method: 'POST',
				headers: { 'X-Jetpack-WP-JS-Sync-Nonce': readNonce() },
				data: { JSON: next },
			} );
			const parsed = wireSchema.safeParse( raw );
			if ( ! parsed.success ) {
				throw new Error( 'Invalid modules_state response' );
			}
			return parsed.data.JSON;
		},
		onMutate: async next => {
			await client.cancelQueries( { queryKey: QUERY_KEY } );
			const prev = client.getQueryData< ModulesState >( QUERY_KEY );
			client.setQueryData< ModulesState >( QUERY_KEY, next );
			return { prev };
		},
		onError: ( _err, _next, ctx ) => {
			// Roll back to the pre-mutation snapshot so the UI stays
			// consistent with what's actually persisted.
			if ( ctx && 'prev' in ctx ) {
				client.setQueryData< ModulesState >( QUERY_KEY, ctx.prev );
			}
		},
		onSettled: () => {
			client.invalidateQueries( { queryKey: QUERY_KEY } );
		},
	} );

	const { mutate } = mutation;
	const setModuleState = useCallback(
		( slug: string, active: boolean ) => {
			const current = client.getQueryData< ModulesState >( QUERY_KEY ) ?? {};
			const moduleEntry = current?.[ slug ];
			if ( ! moduleEntry ) {
				return;
			}
			if ( moduleEntry.active === active ) {
				return;
			}
			const next: NonNullable< ModulesState > = {
				...current,
				[ slug ]: { available: moduleEntry.available, active },
			};
			mutate( next );
		},
		[ client, mutate ]
	);

	return [ setModuleState, mutation ] as const;
}
