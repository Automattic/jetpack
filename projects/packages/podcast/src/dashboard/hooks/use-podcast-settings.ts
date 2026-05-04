/**
 * TanStack Query hook for fetching and mutating podcast settings.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { fetchSettings, updateSettings } from '../api';
import type { PodcastSettings } from '../types';

const QUERY_KEY = [ 'jetpack-podcast', 'settings' ] as const;

/**
 * Read the current podcasting_* options as a single TanStack Query object.
 *
 * @return Query result; `data` is the resolved settings once loaded.
 */
export function usePodcastSettings() {
	return useQuery< PodcastSettings >( {
		queryKey: QUERY_KEY,
		queryFn: fetchSettings,
		staleTime: 60_000,
	} );
}

/**
 * Mutation for persisting a partial settings update with optimistic UI:
 * the cache is patched immediately, rolled back on error, and a snackbar
 * notice (success or failure) is dispatched.
 *
 * @return TanStack mutation; call `mutate(partial)` to save.
 */
export function useUpdatePodcastSettings() {
	const queryClient = useQueryClient();

	return useMutation<
		PodcastSettings,
		Error,
		Partial< PodcastSettings >,
		{ previous?: PodcastSettings }
	>( {
		mutationFn: updateSettings,
		onMutate: async updates => {
			await queryClient.cancelQueries( { queryKey: QUERY_KEY } );
			const previous = queryClient.getQueryData< PodcastSettings >( QUERY_KEY );
			if ( previous ) {
				queryClient.setQueryData< PodcastSettings >( QUERY_KEY, { ...previous, ...updates } );
			}
			return { previous };
		},
		onError: ( _error, _updates, context ) => {
			if ( context?.previous ) {
				queryClient.setQueryData( QUERY_KEY, context.previous );
			}
			dispatch( noticesStore ).createErrorNotice(
				__( 'Could not save your podcast settings. Please try again.', 'jetpack-podcast' ),
				{ type: 'snackbar' }
			);
		},
		onSuccess: data => {
			queryClient.setQueryData< PodcastSettings >( QUERY_KEY, data );
			dispatch( noticesStore ).createSuccessNotice( __( 'Settings saved.', 'jetpack-podcast' ), {
				type: 'snackbar',
			} );
		},
	} );
}
