import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { resetImportState } from './api';

/**
 * Reset-import mutation. Cancels stuck import jobs via the proxy, then invalidates the
 * import-jobs query so the stale-import notice clears and the form re-enables.
 *
 * @return React-Query mutation handle.
 */
export function useResetImportMutation() {
	const queryClient = useQueryClient();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	return useMutation< { reset_count?: number }, Error, void >( {
		mutationFn: resetImportState,
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'subscribers', 'import-jobs' ] } );
			createSuccessNotice( __( 'Import cancelled.', 'jetpack-newsletter' ), {
				type: 'snackbar',
			} );
		},
		onError: error => {
			createErrorNotice( error.message, { type: 'snackbar' } );
		},
	} );
}
