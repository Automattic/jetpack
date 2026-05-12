import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { z, type ZodTypeAny } from 'zod';
import { readNonce } from './use-data-sync-entry';

/**
 * Generic action hook for a Jetpack Boost data-sync action endpoint.
 * Actions live at `/jetpack-boost-ds/<entry>/action/<action>` and
 * authenticate via a separate per-action nonce that PHP localizes
 * under the `<entry>_<action>_action` key on `window.jetpack_boost_ds`.
 *
 * Mirrors the legacy `useDataSyncAction` from
 * `@automattic/jetpack-react-data-sync-client`.
 *
 * @param entryKey       - The data-sync entry the action belongs to (e.g. `'critical_css_state'`).
 * @param actionName     - The action name as registered server-side (e.g. `'request-regenerate'`).
 * @param responseSchema - Zod schema for the action's response payload.
 * @param invalidateKeys - React Query keys to invalidate after the action lands.
 * @return The TanStack `useMutation` handle.
 */
export function useDataSyncAction< Schema extends ZodTypeAny, Args = void >(
	entryKey: string,
	actionName: string,
	responseSchema: Schema,
	invalidateKeys: Array< readonly unknown[] > = []
): UseMutationResult< z.infer< Schema >, Error, Args > {
	const client = useQueryClient();
	const path = `/jetpack-boost-ds/${ entryKey.replace( /_/g, '-' ) }/action/${ actionName }`;
	const nonceKey = `${ entryKey }_${ actionName }_action`;
	const wire = z.object( { JSON: responseSchema } );

	return useMutation< z.infer< Schema >, Error, Args >( {
		mutationFn: async args => {
			const raw = await apiFetch( {
				path,
				method: 'POST',
				headers: { 'X-Jetpack-WP-JS-Sync-Nonce': readNonce( nonceKey ) },
				data: { JSON: args ?? null },
			} );
			const parsed = wire.safeParse( raw );
			if ( ! parsed.success ) {
				throw new Error( `Invalid response from ${ entryKey }/${ actionName }` );
			}
			return parsed.data.JSON;
		},
		onSuccess: () => {
			for ( const key of invalidateKeys ) {
				client.invalidateQueries( { queryKey: key as readonly unknown[] } );
			}
		},
	} );
}
