import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import {
	getRemovePayload,
	getSubscriberLabel,
	getSubscriberRowId,
} from '../lib/subscriber-helpers';
import { recordTracksEvent } from '../lib/tracks';
import { removeSubscriber } from './api';
import type { RemoveSubscriberError, Subscriber, SubscribersResponse } from './types';

/**
 * Maximum number of subscribers we'll attempt to remove in a single bulk action — matches
 * Calypso's per-mutation cap.
 */
export const MAX_BULK_REMOVE = 100;

type Result = {
	removed: Subscriber[];
	failures: { subscriber: Subscriber; errors: RemoveSubscriberError[]; message?: string }[];
};

type Snapshot = { queryKey: readonly unknown[]; data: SubscribersResponse }[];

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

	const noticeFailureCount = ( count: number ) =>
		createErrorNotice(
			sprintf(
				// translators: %d: number of subscribers that could not be removed.
				_n(
					'%d subscriber could not be removed.',
					'%d subscribers could not be removed.',
					count,
					'jetpack-newsletter'
				),
				count
			),
			{ type: 'snackbar' }
		);

	return useMutation< Result, Error, Subscriber[], { snapshot: Snapshot } >( {
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

			// All-failed → throw so onError rolls the optimistic update back. Partial-failures
			// fall through to onSuccess; the cache invalidation re-fetches the rows that didn't
			// actually delete server-side.
			if ( result.removed.length === 0 && result.failures.length > 0 ) {
				const firstFailure = result.failures[ 0 ];
				throw new Error(
					firstFailure.message || firstFailure.errors[ 0 ]?.error || 'Could not remove subscriber.'
				);
			}

			return result;
		},
		onMutate: async ( subscribers: Subscriber[] ) => {
			// Optimistically drop the targeted rows from every cached subscribers page so the
			// table updates immediately. Mirrors Calypso's onMutate. Rollback in onError.
			await queryClient.cancelQueries( { queryKey: [ 'subscribers' ] } );

			const targetIds = new Set( subscribers.map( getSubscriberRowId ) );
			const snapshot: Snapshot = [];

			const cached = queryClient.getQueriesData< SubscribersResponse >( {
				queryKey: [ 'subscribers' ],
			} );

			cached.forEach( ( [ queryKey, data ] ) => {
				if ( ! data || ! Array.isArray( data.subscribers ) ) {
					return;
				}
				const remaining = data.subscribers.filter(
					s => ! targetIds.has( getSubscriberRowId( s ) )
				);
				const removedCount = data.subscribers.length - remaining.length;
				if ( removedCount === 0 ) {
					return;
				}
				snapshot.push( { queryKey, data } );
				const total = Math.max( 0, ( data.total ?? 0 ) - removedCount );
				const perPage = data.per_page || remaining.length || 1;
				queryClient.setQueryData< SubscribersResponse >( queryKey, {
					...data,
					subscribers: remaining,
					total,
					pages: Math.max( 1, Math.ceil( total / perPage ) ),
				} );
			} );

			return { snapshot };
		},
		onError: ( _err, vars, context ) => {
			// Restore every cache we touched so the table reverts.
			context?.snapshot.forEach( ( { queryKey, data } ) => {
				queryClient.setQueryData( queryKey, data );
			} );
			queryClient.invalidateQueries( { queryKey: [ 'subscribers' ] } );
			noticeFailureCount( vars?.length ?? 0 );
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
				noticeFailureCount( result.failures.length );
			}
		},
	} );
}
