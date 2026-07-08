/**
 * Internal dependencies
 */
import {
	fetchStatsProxy,
	type StatsProxyMethod,
	type StatsProxyParams,
	type StatsProxyVersion,
} from '../api';
import type { UseQueryOptions } from '@tanstack/react-query';

export const statsAppQueryKeyPart = ( value: unknown ) => value ?? {};

type StatsAppQueryConfig = {
	name: string;
	version: StatsProxyVersion;
	endpoint: string;
	params?: StatsProxyParams;
	method?: StatsProxyMethod;
	body?: unknown;
};

// App/admin resources use the Stats proxy transport but do not use report param
// coercion or response sanitizers, so they keep a separate query-key namespace.
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
