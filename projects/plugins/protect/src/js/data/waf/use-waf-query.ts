import { useQuery, UseQueryResult } from '@tanstack/react-query';
import camelize from 'camelize';
import API from '../../api';
import { QUERY_WAF_KEY } from '../../constants';
import { WafStatus } from '../../types/waf';

/**
 * WAF Query Hook
 *
 * @return {UseQueryResult} useQuery result.
 */
export default function useWafQuery(): UseQueryResult< WafStatus > {
	return useQuery( {
		queryKey: [ QUERY_WAF_KEY ],
		queryFn: API.getWaf,
		initialData: camelize( window?.jetpackProtectInitialState?.waf ),
	} );
}
