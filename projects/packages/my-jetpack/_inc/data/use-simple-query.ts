import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useFetchingErrorNotice } from './notices/use-fetching-error-notice';
import type { UseQueryResult } from '@tanstack/react-query';

const useSimpleQuery = < T >( queryName: string, endpoint: string ): UseQueryResult< T > => {
	const queryResult = useQuery( {
		queryKey: [ queryName ],
		queryFn: () => apiFetch( { path: endpoint } ) as Promise< T >,
		refetchOnWindowFocus: false,
		refetchIntervalInBackground: false,
	} );

	const { isError, isLoading } = queryResult;

	useFetchingErrorNotice( queryName, ! isLoading && isError );

	return queryResult;
};

export default useSimpleQuery;
