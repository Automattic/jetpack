import restApi from '@automattic/jetpack-api';
import { useQuery } from '@tanstack/react-query';
import { useFetchingErrorNotice } from './notices/use-fetching-error-notice';

const useJetpackApiQuery = < T >(
	name: string,
	queryFn: ( api: typeof restApi ) => Promise< T >,
	explicitKey?: string
): ReturnType< typeof useQuery > => {
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
	useFetchingErrorNotice( name, ! isLoading && isError );

	return queryResult;
};

export default useJetpackApiQuery;
