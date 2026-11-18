import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EARNINGS_KEY } from './memberships';
import { wpcomFetch } from './wpcom-fetch';

const SUBSCRIBERS_KEY = [ 'monetize', 'memberships', 'subscribers' ];

/** WordPress.com's fixed page size. */
export const SUBSCRIBERS_PER_PAGE = 50;

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
 * One page of the site's active paid subscriptions, newest first.
 *
 * @param page - The page, from 1.
 * @return The query.
 */
export function usePaidSubscriptions( page: number ) {
	return useQuery( {
		queryKey: [ ...SUBSCRIBERS_KEY, page ],
		queryFn: () =>
			wpcomFetch< SubscribersResponse >( {
				api: 'wpcom/v2',
				path: 'memberships/subscribers',
				query: { offset: ( page - 1 ) * SUBSCRIBERS_PER_PAGE },
			} ).then( ( data ): SubscribersPage => ( {
				total: Number( data.total ) || 0,
				subscriptions: ( data.ownerships ?? [] ).map( toPaidSubscription ),
			} ) ),
		placeholderData: keepPreviousData,
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
			// A page still loading was fetched before the cancellation, and would restore the row.
			await queryClient.cancelQueries( { queryKey: SUBSCRIBERS_KEY } );
			queryClient.setQueriesData< SubscribersPage >( { queryKey: SUBSCRIBERS_KEY }, data =>
				data
					? {
							total: Math.max( 0, data.total - 1 ),
							subscriptions: data.subscriptions.filter( other => other.id !== subscription.id ),
						}
					: data
			);
			// Every later row moved up one, so each page refetches to fill its gap.
			queryClient.invalidateQueries( { queryKey: SUBSCRIBERS_KEY } );
			queryClient.invalidateQueries( { queryKey: EARNINGS_KEY } );
		},
	} );
}
