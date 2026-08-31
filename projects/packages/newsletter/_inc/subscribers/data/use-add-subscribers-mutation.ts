import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { addSubscribers } from './api';
import { IMPORT_IN_PROGRESS_NOTICE_ID } from './use-import-jobs';
import type { AddSubscribersPayload, AddSubscribersResponse } from './types';

/**
 * Add-subscribers mutation. POSTs `emails` (and any selected newsletter category ids) to the
 * proxy, which starts an async WP.com import job, then invalidates the subscribers list cache.
 * Fast imports show up on the refetch; larger ones land once WP.com finishes the job and sends its
 * "Subscriber import completed" email.
 *
 * The "Importing…" snackbar is created under {@link IMPORT_IN_PROGRESS_NOTICE_ID} so
 * `useImportCompletionRefresh` can resolve it into a success / failure notice when the job ends.
 *
 * @return React-Query mutation handle.
 */
export function useAddSubscribersMutation() {
	const queryClient = useQueryClient();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	return useMutation< AddSubscribersResponse, Error, AddSubscribersPayload >( {
		mutationFn: ( { emails, categories } ) => addSubscribers( emails, categories ),
		onSuccess: ( _response, { emails } ) => {
			queryClient.invalidateQueries( { queryKey: [ 'subscribers' ] } );

			createSuccessNotice(
				sprintf(
					// translators: %d: number of email addresses being imported.
					_n(
						'Importing %d subscriber. This may take a few minutes.',
						'Importing %d subscribers. This may take a few minutes.',
						emails.length,
						'jetpack-newsletter'
					),
					emails.length
				),
				{ type: 'snackbar', id: IMPORT_IN_PROGRESS_NOTICE_ID }
			);
		},
		onError: error => {
			createErrorNotice( error.message, { type: 'snackbar' } );
		},
	} );
}
