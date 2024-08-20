import { useConnection } from '@automattic/jetpack-connection';
import { useQuery } from '@tanstack/react-query';
import API from '../api';
import { QUERY_CREDENTIALS_KEY } from '../constants';

/**
 * Credentials Query Hook
 *
 * @param {object}  args            - Args
 * @param {boolean} args.usePolling - Use polling.
 * @return {object} useQuery Hook
 */
export default function useCredentialsQuery( { usePolling }: { usePolling?: boolean } = {} ) {
	const { isRegistered } = useConnection( {
		autoTrigger: false,
		from: 'protect',
		redirectUri: null,
		skipUserConnection: true,
	} );

	return useQuery( {
		queryKey: [ QUERY_CREDENTIALS_KEY ],
		queryFn: API.checkCredentials,
		initialData: window?.jetpackProtectInitialState?.credentials,
		refetchInterval: query => {
			if ( ! usePolling ) {
				return false;
			}
			if ( ! query.state.data ) {
				return false;
			}
			if ( query.state.data?.length ) {
				return false;
			}

			return 5_000;
		},
		enabled: isRegistered,
	} );
}
