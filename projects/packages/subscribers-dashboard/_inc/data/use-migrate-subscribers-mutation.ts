import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { migrateFromSourceSite } from './api';

type Result = { success?: boolean; message?: string };

/**
 * Trigger a migration from another WPCOM site the user owns. On success, fires a snackbar
 * notice and invalidates the subscribers list cache so the table re-fetches with the new rows.
 *
 * @return React Query mutation handle.
 */
export function useMigrateSubscribersMutation() {
	const queryClient = useQueryClient();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	return useMutation< Result, Error, { sourceBlogId: number; sourceSiteName?: string } >( {
		mutationFn: ( { sourceBlogId } ) => migrateFromSourceSite( sourceBlogId ),
		onSuccess: ( result, variables ) => {
			queryClient.invalidateQueries( { queryKey: [ 'subscribers' ] } );
			if ( result?.message ) {
				createSuccessNotice( result.message, { type: 'snackbar' } );
				return;
			}
			createSuccessNotice(
				sprintf(
					// translators: %s: source site name.
					__( 'Migration from %s started.', 'jetpack-subscribers-dashboard' ),
					variables.sourceSiteName || __( 'the selected site', 'jetpack-subscribers-dashboard' )
				),
				{ type: 'snackbar' }
			);
		},
		onError: error => {
			createErrorNotice(
				error?.message || __( 'Could not migrate subscribers.', 'jetpack-subscribers-dashboard' ),
				{ type: 'snackbar' }
			);
		},
	} );
}
