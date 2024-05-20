import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useFetchingErrorNotice } from './notices/use-fetching-error-notice';
import type { WP_Error } from './types';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { APIFetchOptions } from '@wordpress/api-fetch';

/**
 * Executes a query using the provided query parameters and options.
 * This hook encapsulates the logic for fetching data and handling the
 * state of the request (e.g., loading, error states). It also optionally
 * displays an error notice if the query fails. It's optimized for simple
 * GET requests. For anything else - use useSimpleMutation.
 *
 * @template T The type of data expected from the query function.
 * @param {object} params - The parameters for executing the query.
 * @param {string} params.name - A unique name for the query, used as part of the query key.
 * @param {APIFetchOptions} params.query - The options to be passed to the API fetch function.
 * @param {Pick<UseQueryOptions, 'enabled'>} [params.options] - Optional. Query options from react-query, currently supports only the 'enabled' option.
 * @param {string} [params.errorMessage] - Optional. A custom error message that can be displayed if the query fails.
 * @returns {UseQueryResult<T>} The result object from the useQuery hook, containing data and state information about the query (e.g., isLoading, isError).
 */
type QueryParams = {
	name: string;
	query: APIFetchOptions;
	options?: Pick< UseQueryOptions, 'enabled' >;
	errorMessage?: string;
};
const useSimpleQuery = < T >( { name, query, options, errorMessage }: QueryParams ) => {
	const queryResult = useQuery< T, WP_Error >( {
		queryKey: [ name ],
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
