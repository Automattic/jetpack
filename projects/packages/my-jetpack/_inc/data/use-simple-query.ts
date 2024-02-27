import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useFetchingErrorNotice } from './notices/use-fetching-error-notice';
import type { UseQueryResult } from '@tanstack/react-query';

const useSimpleQuery = < T >(
	name: string,
	path: string,
	explicitKey?: string
): UseQueryResult< T > => {
	const queryResult = useQuery( {
		queryKey: [ name, explicitKey ],
		queryFn: () => apiFetch( { path } ) as Promise< T >,
		refetchOnWindowFocus: false,
		refetchIntervalInBackground: false,
	} );

	const { isError, isLoading } = queryResult;
	useFetchingErrorNotice( name, ! isLoading && isError );

	return queryResult;
};

export default useSimpleQuery;
