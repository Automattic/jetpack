import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EARNINGS_KEY } from './memberships';
import { wpcomFetch } from './wpcom-fetch';
import type { InfiniteData } from '@tanstack/react-query';

const SUBSCRIBERS_KEY = [ 'monetize', 'memberships', 'subscribers' ];

export interface PaidSubscription {
	id: number;
	/** The subscriber's WordPress.com user ID. */
	userId: number;
	name: string;
	email: string;
	avatarUrl: string;
	planTitle: string;
	/** What the next payment costs, or what the one-time payment cost. */
	renewalPrice: number;
	currency: string;
	interval: 'one-time' | '1 month' | '1 year' | string;
	allTimeTotal: number;
	/** When the subscription started, in UTC as WordPress.com sends it. */
	startDate: string;
}

interface OwnershipResponse {
	id?: number | string;
	user?: {
		ID?: number | string;
		name?: string;
		user_email?: string;
		avatar_URL?: string;
	};
	plan?: {
		title?: string;
		renewal_price?: number | string;
		currency?: string;
		renew_interval?: string;
	};
	start_date?: string;
	all_time_total?: number | string;
}

interface SubscribersResponse {
	total?: number | string;
	ownerships?: OwnershipResponse[];
}

interface SubscribersPage {
	total: number;
	subscriptions: PaidSubscription[];
}

/**
 * A subscription as the API sends it.
 *
 * @param ownership - The API's ownership.
 * @return The subscription.
 */
export function toPaidSubscription( ownership: OwnershipResponse ): PaidSubscription {
	const { user = {}, plan = {} } = ownership;

	return {
		id: Number( ownership.id ),
		userId: Number( user.ID ),
		name: user.name ?? '',
		email: user.user_email ?? '',
		avatarUrl: user.avatar_URL ?? '',
		planTitle: plan.title ?? '',
		renewalPrice: Number( plan.renewal_price ) || 0,
		currency: plan.currency || 'USD',
		interval: plan.renew_interval ?? '',
		allTimeTotal: Number( ownership.all_time_total ) || 0,
		startDate: ownership.start_date ?? '',
	};
}

/**
 * The site's active paid subscriptions, newest first, 50 at a time as WordPress.com pages them.
 *
 * @return The query; `data.subscriptions` holds every page loaded so far.
 */
export function usePaidSubscriptions() {
	return useInfiniteQuery( {
		queryKey: SUBSCRIBERS_KEY,
		initialPageParam: 0,
		queryFn: ( { pageParam } ) =>
			wpcomFetch< SubscribersResponse >( {
				api: 'wpcom/v2',
				path: 'memberships/subscribers',
				query: { offset: pageParam },
			} ).then( ( data ): SubscribersPage => ( {
				total: Number( data.total ) || 0,
				subscriptions: ( data.ownerships ?? [] ).map( toPaidSubscription ),
			} ) ),
		// Cancelling drops a row from the cache, so the loaded count stays the next page's offset.
		getNextPageParam: ( lastPage, pages ) => {
			const loaded = pages.reduce( ( sum, page ) => sum + page.subscriptions.length, 0 );
			return lastPage.subscriptions.length && loaded < lastPage.total ? loaded : undefined;
		},
		select: data => {
			// A subscription that arrives between pages shifts the offsets, repeating a row.
			const byId = new Map(
				data.pages.flatMap( page => page.subscriptions ).map( row => [ row.id, row ] )
			);
			return {
				total: data.pages[ data.pages.length - 1 ]?.total ?? 0,
				subscriptions: [ ...byId.values() ].sort( ( a, b ) => b.id - a.id ),
			};
		},
	} );
}

/**
 * Cancels a subscription, or removes a one-time payment, and drops it from the list.
 *
 * @return The mutation.
 */
export function useCancelSubscription() {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: ( subscription: PaidSubscription ) =>
			wpcomFetch( {
				api: 'wpcom/v2',
				path: `memberships/subscriptions/${ subscription.id }/cancel`,
				method: 'POST',
				data: { user_id: subscription.userId },
			} ),
		onSuccess: async ( _data, subscription ) => {
			// A page still loading was built from the list before the cancellation, and would restore it.
			await queryClient.cancelQueries( { queryKey: SUBSCRIBERS_KEY } );
			queryClient.setQueryData< InfiniteData< SubscribersPage > >( SUBSCRIBERS_KEY, data =>
				data
					? {
							...data,
							pages: data.pages.map( page => ( {
								total: Math.max( 0, page.total - 1 ),
								subscriptions: page.subscriptions.filter( other => other.id !== subscription.id ),
							} ) ),
						}
					: data
			);
			queryClient.invalidateQueries( { queryKey: EARNINGS_KEY } );
		},
	} );
}
