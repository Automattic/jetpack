import { keepPreviousData, useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';

export interface SubscribersTotals {
	email_subscribers: number;
	paid_subscribers: number;
	social_followers: number;
}

export const defaultSubscribersTotals = {
	email_subscribers: 0,
	paid_subscribers: 0,
	social_followers: 0,
};

const getSubscriberCount = (): Promise< any > => {
	return apiFetch( { path: '/wpcom/v2/subscribers/counts' } );
};

/**
 *
 * @param siteId
 */
export default function useSubscriberCountQuery() {
	return useQuery< SubscribersTotals >( {
		queryKey: [ 'subscribers', 'count' ],
		queryFn: () => {
			return getSubscriberCount().then( response => {
				return response.counts || defaultSubscribersTotals;
			} );
		},
		placeholderData: keepPreviousData,
	} );
}
