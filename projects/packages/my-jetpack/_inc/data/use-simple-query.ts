import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useFetchingErrorNotice } from './notices/use-fetching-error-notice';
import type { WP_Error } from './types';
import type { UseQueryOptions } from '@tanstack/react-query';
import type { APIFetchOptions } from '@wordpress/api-fetch';

/**
 * Simple wrapper for useQuery that handles error notices.
 *
 * This query is only meant for GET requests, if you need to use a different method, use useSimpleMutation.
 *
 * @param {string} name - The name of the query.
 * @param {object} query - The query object to pass to apiFetch
 * @param {object} options - The options to pass to useQuery
 * @param {string} explicitKey - An optional key to use for the query cache.
 * @param {string} errorMessage - An optional custom error message to display.
 * @returns {Array} The result of the query.
 */
const useSimpleQuery = < T >(
	name: string,
	query: APIFetchOptions,
	options?: Pick< UseQueryOptions, 'enabled' >,
	explicitKey?: string,
	errorMessage?: string
) => {
	const queryResult = useQuery< T, WP_Error >( {
		queryKey: [ name, explicitKey ],
		queryFn: () => apiFetch< T >( query ),
		refetchOnWindowFocus: false,
		refetchIntervalInBackground: false,
		...options,
	} );

	const { error, isError, isLoading } = queryResult;

	useFetchingErrorNotice( {
		infoName: name,
		isError: ! isLoading && isError && error.code !== 'not_connected',
		overrideMessage: errorMessage,
	} );

	return queryResult;
};

export default useSimpleQuery;
