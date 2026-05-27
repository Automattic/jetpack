import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { akismetSettingsQuery } from '@/data/queries';
import { akismetKeys } from '@/data/query-keys';
import { apiClient, type WpError } from '@/lib/api-client';
import { allowMutations } from '@/lib/is-jetpack-active';
import type { AkismetSettings } from '@/lib/types';

/**
 * Wire code identifying the JS-side mutation short-circuit. Matches the
 * `WP_Error` code the PHP guardrail returns from `check_mutation_gate()` so
 * components branching on `error.code` work whether the gate fires in JS or
 * PHP.
 */
const PREVIEW_MODE_CODE = 'preview_mode_active';

/**
 * Read + write Akismet settings (strictness + show-approved toggle).
 *
 * Pattern A from the conventions doc §6: the PUT response IS the new settings
 * state, so `onSuccess` calls `setQueryData` to update the cache directly —
 * no refetch round-trip.
 *
 * Mutation is gated by `allowMutations()` (the JS-side mirror of the PHP
 * `AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS` constant). When off, the mutation
 * rejects without touching the network — snappy preview-mode UX. The PHP
 * route also enforces the gate, so even if the JS check were bypassed the
 * server returns 403 with `preview_mode_active`.
 *
 * This is Option A from `01-settings-connect.md` ("extend the existing
 * mutation gate to cover settings writes"). If you ship Option B or C,
 * swap or remove the `allowMutations()` block below.
 *
 * @return `{ config, update }` — the query result + the mutation.
 */
export function useAkismetConfig() {
	const queryClient = useQueryClient();

	const config = useQuery( akismetSettingsQuery() );

	const update = useMutation< AkismetSettings, WpError, Partial< AkismetSettings > >( {
		mutationFn: async patch => {
			if ( ! allowMutations() ) {
				throw {
					code: PREVIEW_MODE_CODE,
					message: 'Preview mode — settings save disabled.',
					data: { status: 403 },
				} satisfies WpError;
			}
			return apiClient.put< AkismetSettings >( 'settings', patch );
		},
		onSuccess: data => {
			queryClient.setQueryData( akismetKeys.settings(), data );
		},
	} );

	return { config, update };
}
