import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { sendBounceConfirmation } from './api';
import type { SendBounceConfirmationResponse } from './types';

/**
 * Mutation: send one confirmation email to a bounced subscriber. Pops a snackbar on success /
 * failure and invalidates the subscribers list and detail so the retry state refreshes.
 *
 * @return React Query mutation handle.
 */
export function useSendBounceConfirmationMutation() {
	const queryClient = useQueryClient();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	return useMutation< SendBounceConfirmationResponse, Error, number >( {
		mutationFn: emailSubscriptionId => sendBounceConfirmation( emailSubscriptionId ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'subscribers' ] } );
			queryClient.invalidateQueries( { queryKey: [ 'subscriber-details' ] } );
			createSuccessNotice( __( 'Confirmation email sent.', 'jetpack-newsletter' ), {
				type: 'snackbar',
			} );
		},
		onError: () => {
			// Refresh the retry state in case the server says the retry isn't available yet.
			queryClient.invalidateQueries( { queryKey: [ 'subscribers' ] } );
			queryClient.invalidateQueries( { queryKey: [ 'subscriber-details' ] } );
			createErrorNotice(
				__( "Couldn't send the confirmation email. Please try again.", 'jetpack-newsletter' ),
				{ type: 'snackbar' }
			);
		},
	} );
}
