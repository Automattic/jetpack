import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { fetchSettings, updateSettings } from '../api';
import type { PodcastSettings, PodcastSettingsUpdate } from '../types';

const QUERY_KEY = [ 'jetpack-podcast', 'settings' ] as const;

/**
 * Read the current `podcasting_*` options as a single TanStack Query.
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
 * Mutation that patches settings with optimistic UI: cache patched immediately,
 * rolled back on error, snackbar dispatched either way.
 *
 * @return TanStack mutation; call `mutate(partial)` to save.
 */
export function useUpdatePodcastSettings() {
	const queryClient = useQueryClient();

	return useMutation<
		PodcastSettings,
		Error,
		PodcastSettingsUpdate,
		{ previous?: PodcastSettings }
	>( {
		mutationFn: updateSettings,
		onMutate: async updates => {
			await queryClient.cancelQueries( { queryKey: QUERY_KEY } );
			const previous = queryClient.getQueryData< PodcastSettings >( QUERY_KEY );
			if ( previous ) {
				// Deep-merge `podcasting_show_urls` so a partial patch doesn't
				// blow away sibling directories. Server merges the same way.
				const optimistic: PodcastSettings = {
					...previous,
					...updates,
					podcasting_show_urls: {
						...previous.podcasting_show_urls,
						...( updates.podcasting_show_urls ?? {} ),
					},
				};
				queryClient.setQueryData< PodcastSettings >( QUERY_KEY, optimistic );
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
