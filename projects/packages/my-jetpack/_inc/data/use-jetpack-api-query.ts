import restApi from '@automattic/jetpack-api';
import { useQuery } from '@tanstack/react-query';
import { useFetchingErrorNotice } from './notices/use-fetching-error-notice';
import { getMyJetpackWindowRestState } from './utils/get-my-jetpack-window-state';

/**
 * Custom hook for fetching data from the Jetpack API, utilizing the react-query library for data fetching and caching.
 * This hook abstracts the common setup needed for calling the Jetpack API, such as setting the API root and nonce,
 * and provides react-query's powerful features like caching and automatic refetching.
 *
 * @template T The type of data expected to be returned by the query function.
 * @param {object} params - The parameters for configuring the API query.
 * @param {string} params.name - The unique name for the query. This name, along with the optional `explicitKey`, forms the cache key for the query's result.
 * @param {Function} params.queryFn - The function to fetch data from the API. It receives a configured instance of `restApi` and must return a promise that resolves to the data of type `T`.
 * @param {string} [params.errorMessage] - Optional. A custom error message to be displayed in case the query fails. This message overrides the default error handling behavior.
 */
type QueryParams< T > = {
	name: string;
	queryFn: ( api: typeof restApi ) => Promise< T >;
	errorMessage?: string;
};
const useJetpackApiQuery = < T >( { name, queryFn, errorMessage }: QueryParams< T > ) => {
	const queryResult = useQuery( {
		queryKey: [ name ],
		queryFn: () => {
			const { apiRoot, apiNonce } = getMyJetpackWindowRestState();
			restApi.setApiRoot( apiRoot );
			restApi.setApiNonce( apiNonce );
			return queryFn( restApi );
		},
		refetchOnWindowFocus: false,
		refetchIntervalInBackground: false,
	} );

	const { isError, isLoading } = queryResult;
	useFetchingErrorNotice( {
		infoName: name,
		isError: ! isLoading && isError,
		overrideMessage: errorMessage,
	} );

	return queryResult;
};

export default useJetpackApiQuery;
