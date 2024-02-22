import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { REST_API_SITE_PURCHASES_ENDPOINT, REST_API_SITE_PURCHASES_QUERY_KEY } from '../constants';
import useNotice from '../notices/use-notice';
import type { Purchase } from '../../../global';
import type { UseQueryResult } from '@tanstack/react-query';

const cacheKey = REST_API_SITE_PURCHASES_QUERY_KEY;

const usePurchases: () => UseQueryResult< Array< Purchase >, Error > = () => {
	const queryResult = useQuery( {
		queryKey: [ cacheKey ],
		queryFn: () =>
			apiFetch( { path: REST_API_SITE_PURCHASES_ENDPOINT } ) as Promise< Array< Purchase > >,
		refetchOnWindowFocus: false,
		refetchIntervalInBackground: false,
	} );

	const { isError, isLoading } = queryResult;

	useNotice( {
		message: __(
			'There was an error fetching your purchases information. Check your site connectivity and try again.',
			'jetpack-my-jetpack'
		),
		options: { status: 'error' },
		isError: ! isLoading && isError,
	} );

	return queryResult;
};

export default usePurchases;
