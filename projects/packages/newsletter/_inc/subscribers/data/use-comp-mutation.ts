import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { addComp, removeComp } from './api';

type CompPayload = {
	user_id: number;
	plan_id: number;
	no_expiration?: boolean;
	planTitle?: string;
	subscriberName?: string;
};

/**
 * Mutation: issue a complimentary subscription on a paid plan, mirroring Calypso's
 * `requestAddComp` thunk. Pops a snackbar on success / failure and invalidates the subscribers
 * list so the table picks up the new comp.
 *
 * @return React Query mutation handle.
 */
export function useCompMutation() {
	const queryClient = useQueryClient();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	return useMutation< unknown, Error, CompPayload >( {
		mutationFn: ( { user_id, plan_id, no_expiration } ) =>
			addComp( { user_id, plan_id, no_expiration } ),
		onSuccess: ( _result, variables ) => {
			queryClient.invalidateQueries( { queryKey: [ 'subscribers' ] } );
			createSuccessNotice(
				variables.subscriberName && variables.planTitle
					? sprintf(
							// translators: %1$s: subscriber name. %2$s: plan title.
							__( 'Comped %1$s on %2$s.', 'jetpack-newsletter' ),
							variables.subscriberName,
							variables.planTitle
					  )
					: __( 'Comp added.', 'jetpack-newsletter' ),
				{ type: 'snackbar' }
			);
		},
		onError: error => {
			createErrorNotice(
				error?.message || __( 'Could not comp the subscription.', 'jetpack-newsletter' ),
				{ type: 'snackbar' }
			);
		},
	} );
}

type RemoveCompPayload = {
	compId: number;
	planTitle?: string;
	subscriberName?: string;
};

/**
 * Mutation: revoke a complimentary subscription, mirroring Calypso's `requestDeleteComp`. The
 * row's `subscriber.plans[i].comp_id` provides the id to delete.
 *
 * @return React Query mutation handle.
 */
export function useRemoveCompMutation() {
	const queryClient = useQueryClient();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	return useMutation< unknown, Error, RemoveCompPayload >( {
		mutationFn: ( { compId } ) => removeComp( compId ),
		onSuccess: ( _result, variables ) => {
			queryClient.invalidateQueries( { queryKey: [ 'subscribers' ] } );
			createSuccessNotice(
				variables.subscriberName && variables.planTitle
					? sprintf(
							// translators: %1$s: subscriber name. %2$s: plan title.
							__( 'Removed %1$s from %2$s.', 'jetpack-newsletter' ),
							variables.subscriberName,
							variables.planTitle
					  )
					: __( 'Comp removed.', 'jetpack-newsletter' ),
				{ type: 'snackbar' }
			);
		},
		onError: error => {
			createErrorNotice(
				error?.message || __( 'Could not remove the comp.', 'jetpack-newsletter' ),
				{ type: 'snackbar' }
			);
		},
	} );
}
