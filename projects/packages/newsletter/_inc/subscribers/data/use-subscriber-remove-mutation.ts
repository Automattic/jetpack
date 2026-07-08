import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { getRemovePayload, getSubscriberLabel } from '../lib/subscriber-helpers';
import { recordTracksEvent } from '../lib/tracks';
import { removeSubscriber } from './api';
import type { RemoveSubscriberError, Subscriber } from './types';

/**
 * Maximum number of subscribers we'll attempt to remove in a single bulk action — matches
 * Calypso's per-mutation cap.
 */
export const MAX_BULK_REMOVE = 100;

type Result = {
	removed: Subscriber[];
	failures: { subscriber: Subscriber; errors: RemoveSubscriberError[]; message?: string }[];
};

/**
 * Remove-subscriber mutation. Iterates the input list (capped at 100), POSTs each subscriber to
 * `/wpcom/v2/subscribers/remove`, and on success invalidates the subscribers list cache so the
 * table re-fetches with the row gone.
 *
 * Mirrors Calypso's `useSubscriberRemoveMutation` cascade — paid subscription cancel + WPCOM
 * follower delete + email follower delete — but the cascade itself runs server-side in our proxy.
 *
 * @return React-Query mutation handle.
 */
export function useSubscriberRemoveMutation() {
	const queryClient = useQueryClient();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	return useMutation< Result, Error, Subscriber[] >( {
		mutationFn: async ( subscribers: Subscriber[] ) => {
			const targets = subscribers.slice( 0, MAX_BULK_REMOVE );
			const result: Result = { removed: [], failures: [] };

			for ( const subscriber of targets ) {
				try {
					const response = await removeSubscriber( getRemovePayload( subscriber ) );
					if ( response.ok ) {
						result.removed.push( subscriber );
					} else {
						result.failures.push( { subscriber, errors: response.errors ?? [] } );
					}
				} catch ( err ) {
					const message = err instanceof Error ? err.message : 'Unknown error';
					result.failures.push( { subscriber, errors: [], message } );
				}
			}

			return result;
		},
		onSuccess: result => {
			queryClient.invalidateQueries( { queryKey: [ 'subscribers' ] } );

			result.removed.forEach( subscriber => {
				recordTracksEvent( 'jetpack_subscribers_subscriber_removed', {
					subscription_id:
						subscriber.email_subscription_id ?? subscriber.wpcom_subscription_id ?? 0,
					user_id: subscriber.user_id ?? 0,
				} );
			} );

			if ( result.removed.length === 1 ) {
				createSuccessNotice(
					sprintf(
						// translators: %s: subscriber display name or email.
						__( 'You have unsubscribed %s.', 'jetpack-newsletter' ),
						getSubscriberLabel( result.removed[ 0 ] )
					),
					{ type: 'snackbar' }
				);
			} else if ( result.removed.length > 1 ) {
				createSuccessNotice(
					sprintf(
						// translators: %d: number of subscribers removed.
						_n(
							'You have unsubscribed %d subscriber.',
							'You have unsubscribed %d subscribers.',
							result.removed.length,
							'jetpack-newsletter'
						),
						result.removed.length
					),
					{ type: 'snackbar' }
				);
			}

			if ( result.failures.length > 0 ) {
				createErrorNotice(
					sprintf(
						// translators: %d: number of subscribers that could not be removed.
						_n(
							'%d subscriber could not be removed.',
							'%d subscribers could not be removed.',
							result.failures.length,
							'jetpack-newsletter'
						),
						result.failures.length
					),
					{ type: 'snackbar' }
				);
			}
		},
	} );
}
