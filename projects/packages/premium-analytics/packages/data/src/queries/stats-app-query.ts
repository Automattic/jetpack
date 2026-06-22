/**
 * Internal dependencies
 */
import { fetchStatsProxy, type StatsProxyMethod, type StatsProxyVersion } from '../api';
import { statsQueryKeyPart, type StatsQueryParams } from '../utils/stats-params';
import type { UseQueryOptions } from '@tanstack/react-query';

type StatsAppQueryConfig = {
	name: string;
	version: StatsProxyVersion;
	endpoint: string;
	params?: StatsQueryParams;
	method?: StatsProxyMethod;
	body?: unknown;
};

export function statsAppProxyQuery< TData = unknown >( {
	name,
	version,
	endpoint,
	params,
	method = 'GET',
	body,
}: StatsAppQueryConfig ): UseQueryOptions< TData > {
	return {
		queryKey: [
			'stats-app',
			name,
			version,
			endpoint,
			method,
			statsQueryKeyPart( params ),
			statsQueryKeyPart( body ),
		],
		queryFn: () => fetchStatsProxy< TData >( { version, endpoint, params, method, body } ),
		placeholderData: previousData => previousData,
	};
}
