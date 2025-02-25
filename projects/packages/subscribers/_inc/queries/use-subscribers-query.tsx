import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { DEFAULT_PER_PAGE, SubscribersFilterBy, SubscribersSortBy } from '../constants';
import { getSubscribersCacheKey } from '../helpers';
import useManySubsSite from '../hooks/use-many-subs-site';
import type { SubscriberEndpointResponse } from '../types';

type SubscriberQueryParams = {
	siteId: number | null;
	page?: number;
	perPage?: number;
	search?: string;
	sortTerm?: SubscribersSortBy;
	sortOrder?: 'asc' | 'desc';
	filterOption?: SubscribersFilterBy;
	timestamp?: number;
	limitData?: boolean;
};

const useSubscribersQuery = ( {
	page = 1,
	perPage = DEFAULT_PER_PAGE,
	search,
	timestamp,
	sortTerm = SubscribersSortBy.DateSubscribed,
	sortOrder,
	filterOption = SubscribersFilterBy.All,
	limitData = false,
}: SubscriberQueryParams ) => {
	const { hasManySubscribers, isLoading } = useManySubsSite();
	const shouldFetch = ! isLoading;
	const limitDataReturned = ! limitData && shouldFetch && hasManySubscribers;
	const query = useQuery< SubscriberEndpointResponse >( {
		queryKey: getSubscribersCacheKey(
			page,
			perPage,
			search,
			sortTerm,
			filterOption,
			limitDataReturned,
			timestamp,
			sortOrder
		),
		queryFn: () => {
			// This is a temporary solution until we have a better way to handle this.
			const pathRoute = limitDataReturned ? 'subscribers_by_user_type' : 'subscribers';
			const userTypeField = limitDataReturned ? 'user_type' : 'filter';

			const validatedFilterOption =
				limitDataReturned && filterOption === SubscribersFilterBy.All
					? SubscribersFilterBy.WPCOM
					: filterOption;

			const params = new URLSearchParams( {
				per_page: perPage.toString(),
				page: page.toString(),
				[ userTypeField ]: validatedFilterOption,
				...( search && { search } ),
				...( sortTerm && { sort: sortTerm } ),
				...( sortOrder && { sort_order: sortOrder } ),
			} );
			return apiFetch( { path: `/wpcom/v2/${ pathRoute }?${ params.toString() }` } );
		},
		enabled: shouldFetch,
	} );

	return { ...query, isLoading: query.isLoading || isLoading };
};

export default useSubscribersQuery;
