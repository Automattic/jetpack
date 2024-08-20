import { useConnection } from '@automattic/jetpack-connection';
import { useQuery } from '@tanstack/react-query';
import camelize from 'camelize';
import API from '../../api';
import { QUERY_HISTORY_KEY } from '../../constants';

/**
 * Use History Query
 *
 * @return {object} Query object
 */
export default function useHistoryQuery() {
	const { isRegistered } = useConnection( {
		autoTrigger: false,
		from: 'protect',
		redirectUri: null,
		skipUserConnection: true,
	} );

	return useQuery( {
		queryKey: [ QUERY_HISTORY_KEY ],
		queryFn: API.getScanHistory,
		initialData: camelize( window.jetpackProtectInitialState?.scanHistory ),
		enabled: isRegistered,
	} );
}
