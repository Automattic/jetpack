import { useQuery } from '@tanstack/react-query';
import camelize from 'camelize';
import API from '../../api';
import { QUERY_WAF_KEY } from '../../constants';

/**
 * WAF Query Hook
 *
 * @return {object} useQuery Hook
 */
export default function useWafQuery() {
	return useQuery( {
		queryKey: [ QUERY_WAF_KEY ],
		queryFn: API.getWaf,
		initialData: camelize( window?.jetpackProtectInitialState?.waf ),
	} );
}
