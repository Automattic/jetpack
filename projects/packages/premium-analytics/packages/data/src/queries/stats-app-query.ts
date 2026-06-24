/**
 * Internal dependencies
 */
import { fetchStatsProxy, type StatsProxyMethod, type StatsProxyVersion } from '../api';
import type { StatsQueryParams } from '../utils/stats-params';
import type { UseQueryOptions } from '@tanstack/react-query';

export const statsAppQueryKeyPart = ( value: unknown ) => value ?? {};

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
			statsAppQueryKeyPart( params ),
			statsAppQueryKeyPart( body ),
		],
		queryFn: () => fetchStatsProxy< TData >( { version, endpoint, params, method, body } ),
		placeholderData: previousData => previousData,
	};
}
