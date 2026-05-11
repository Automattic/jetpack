import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { addSubscribers } from './api';
import type { AddSubscribersResponse } from './types';

/**
 * Add-subscribers mutation. POSTs `emails` to the proxy, then invalidates the subscribers list
 * cache so the table reflects the new follower invitations.
 *
 * @return React-Query mutation handle.
 */
export function useAddSubscribersMutation() {
	const queryClient = useQueryClient();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	return useMutation< AddSubscribersResponse, Error, string[] >( {
		mutationFn: ( emails: string[] ) => addSubscribers( emails ),
		onSuccess: ( _response, emails ) => {
			queryClient.invalidateQueries( { queryKey: [ 'subscribers' ] } );

			createSuccessNotice(
				sprintf(
					// translators: %d: number of email invitations sent.
					_n( 'Sent %d invitation.', 'Sent %d invitations.', emails.length, 'jetpack-newsletter' ),
					emails.length
				),
				{ type: 'snackbar' }
			);
		},
		onError: error => {
			createErrorNotice( error.message, { type: 'snackbar' } );
		},
	} );
}
