import {
	useMutation,
	useQuery,
	useQueryClient,
	type QueryKey,
	type UseMutationResult,
	type UseQueryResult,
} from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { z, type ZodTypeAny } from 'zod';

declare global {
	const jetpack_boost_ds:
		| Record< string, { value?: unknown; nonce?: string } | undefined >
		| undefined;
}

/**
 * Generic read+write hook for a Jetpack Boost data-sync entry. Mirrors
 * the legacy `useDataSync()` from `@automattic/jetpack-react-data-sync-client`
 * but uses `@wordpress/api-fetch` directly so the modernized wp-build
 * bundle doesn't ship a second copy of React Query.
 *
 * Conventions inherited from the data-sync REST contract:
 * - URL: `/jetpack-boost-ds/<key with underscores → hyphens>`
 * - Write URL: same + `/set`
 * - Headers: `X-Jetpack-WP-JS-Sync-Nonce` localized on `window.jetpack_boost_ds[<key>].nonce`
 * - Wire envelope: `{ JSON: <value> }`
 *
 * @param entryKey                     - The data-sync entry key (e.g. `'critical_css_state'`).
 * @param schema                       - Zod schema that parses the inner `JSON` payload.
 * @param queryOptions                 - Optional React Query overrides (refetch intervals, etc.).
 * @param queryOptions.refetchInterval
 * @param queryOptions.staleTime
 * @param queryOptions.enabled
 * @return Tuple of `[ queryResult, mutationResult ]`.
 */
export function useDataSyncEntry< Schema extends ZodTypeAny >(
	entryKey: string,
	schema: Schema,
	queryOptions?: {
		refetchInterval?: number | ( ( query: UseQueryResult< z.infer< Schema > > ) => number | false );
		staleTime?: number;
		enabled?: boolean;
	}
): readonly [
	UseQueryResult< z.infer< Schema > >,
	UseMutationResult< z.infer< Schema >, Error, z.infer< Schema > >,
] {
	const client = useQueryClient();
	const queryKey: QueryKey = [ 'jetpack_boost_ds', entryKey ];
	const wire = z.object( { JSON: schema } );

	const query = useQuery< z.infer< Schema > >( {
		queryKey,
		queryFn: async (): Promise< z.infer< Schema > > => {
			const raw = await apiFetch( {
				path: pathFromKey( entryKey ),
				headers: { 'X-Jetpack-WP-JS-Sync-Nonce': readNonce( entryKey ) },
			} );
			const parsed = wire.safeParse( raw );
			if ( ! parsed.success ) {
				throw new Error( `Invalid ${ entryKey } response` );
			}
			return parsed.data.JSON as z.infer< Schema >;
		},
		staleTime: queryOptions?.staleTime,
		refetchInterval: queryOptions?.refetchInterval,
		enabled: queryOptions?.enabled,
	} );

	const mutation = useMutation< z.infer< Schema >, Error, z.infer< Schema > >( {
		mutationFn: async ( next ): Promise< z.infer< Schema > > => {
			const raw = await apiFetch( {
				path: `${ pathFromKey( entryKey ) }/set`,
				method: 'POST',
				headers: { 'X-Jetpack-WP-JS-Sync-Nonce': readNonce( entryKey ) },
				data: { JSON: next },
			} );
			const parsed = wire.safeParse( raw );
			if ( ! parsed.success ) {
				throw new Error( `Invalid ${ entryKey } write response` );
			}
			return parsed.data.JSON as z.infer< Schema >;
		},
		onMutate: async next => {
			await client.cancelQueries( { queryKey } );
			const prev = client.getQueryData< z.infer< Schema > >( queryKey );
			client.setQueryData< z.infer< Schema > >( queryKey, next );
			return { prev };
		},
		onError: ( _err, _next, ctx ) => {
			if ( ctx && 'prev' in ( ctx as { prev?: unknown } ) ) {
				client.setQueryData< z.infer< Schema > >(
					queryKey,
					( ctx as { prev?: z.infer< Schema > } ).prev
				);
			}
		},
		onSettled: () => {
			client.invalidateQueries( { queryKey } );
		},
	} );

	return [ query, mutation ] as const;
}

/**
 * Convert an entry key (`critical_css_state`) to a REST path
 * (`/jetpack-boost-ds/critical-css-state`). Matches the sanitization
 * the PHP-side data-sync package applies when registering routes.
 *
 * @param key - The entry key with underscores.
 * @return The hyphenated REST path.
 */
function pathFromKey( key: string ): string {
	return `/jetpack-boost-ds/${ key.replace( /_/g, '-' ) }`;
}

/**
 * Look up the per-entry nonce that PHP localizes onto
 * `window.jetpack_boost_ds`. Returns an empty string when the entry
 * isn't localized (e.g. read-only routes that don't authenticate).
 *
 * @param entryKey - The data-sync entry key.
 * @return The nonce string, or '' if not localized.
 */
export function readNonce( entryKey: string ): string {
	return jetpack_boost_ds?.[ entryKey ]?.nonce ?? '';
}
