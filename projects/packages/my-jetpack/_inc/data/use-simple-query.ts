import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useFetchingErrorNotice } from './notices/use-fetching-error-notice';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { APIFetchOptions } from '@wordpress/api-fetch';

interface Options extends UseQueryOptions {
	enabled?: boolean;
}

/*
 * Simple wrapper for useQuery that handles error notices.
 *
 * This query is only meant for GET requests, if you need to use a different method, use useSimpleMutation.
 *
 * The options object is optional and is a strictly defined subset of the UseQueryOptions type.
 * If you want to pass more options, you can add them to the options type above.
 */
const useSimpleQuery = < T >(
	name: string,
	query: APIFetchOptions,
	options?: Partial< Options >,
	explicitKey?: string,
	errorMessage?: string
): UseQueryResult< unknown > => {
	const queryResult = useQuery( {
		queryKey: [ name, explicitKey ],
		queryFn: () => apiFetch< T >( query ),
		refetchOnWindowFocus: false,
		refetchIntervalInBackground: false,
		...options,
	} );

	const { isError, isLoading } = queryResult;
	useFetchingErrorNotice( name, ! isLoading && isError, errorMessage );

	return queryResult;
};

export default useSimpleQuery;
