import restApi from '@automattic/jetpack-api';
import { useQuery } from '@tanstack/react-query';
import { useFetchingErrorNotice } from './notices/use-fetching-error-notice';

/**
 * A hook to fetch data from the Jetpack API using react-query
 *
 * @param {string} name - The name of the query.
 * @param {Function} queryFn - The function that fetches the data.
 * @param {string} explicitKey - An optional key to use for the query cache.
 * @returns {Array} The result of the query.
 */
const useJetpackApiQuery = < T >(
	name: string,
	queryFn: ( api: typeof restApi ) => Promise< T >,
	explicitKey?: string
) => {
	const queryResult = useQuery( {
		queryKey: [ name, explicitKey ],
		queryFn: () => {
			const { apiRoot, apiNonce } = window?.myJetpackRest || {};
			restApi.setApiRoot( apiRoot );
			restApi.setApiNonce( apiNonce );
			return queryFn( restApi );
		},
		refetchOnWindowFocus: false,
		refetchIntervalInBackground: false,
	} );

	const { isError, isLoading } = queryResult;
	// TODO: error message customization as in #35994
	useFetchingErrorNotice( name, ! isLoading && isError );

	return queryResult;
};

export default useJetpackApiQuery;
