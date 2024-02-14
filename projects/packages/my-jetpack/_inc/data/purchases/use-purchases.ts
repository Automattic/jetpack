import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { REST_API_SITE_PURCHASES_ENDPOINT } from '../constants';
import type { UseQueryResult } from '@tanstack/react-query';

const cacheKey = 'purchases';

const usePurchases: UseQueryResult = () => {
	const { data, isLoading, isError } = useQuery( {
		queryKey: [ cacheKey ],
		queryFn: async () => await apiFetch( { path: REST_API_SITE_PURCHASES_ENDPOINT } ),
		refetchOnWindowFocus: false,
		refetchIntervalInBackground: false,
	} );

	return {
		data,
		isLoading,
		isError,
	};
};

export default usePurchases;
