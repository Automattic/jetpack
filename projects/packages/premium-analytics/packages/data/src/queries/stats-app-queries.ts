/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import {
	fetchStatsProxy,
	type StatsProxyMethod,
	type StatsProxyVersion,
} from '../api/stats-proxy-fetch';
import { statsQueryKeyPart, type StatsQueryParams } from '../utils/stats-params';
import type { UseQueryOptions } from '@tanstack/react-query';

const noticesPath = '/jetpack-premium-analytics/v1/notices';

type StatsAppQueryConfig = {
	name: string;
	version: StatsProxyVersion;
	endpoint: string;
	params?: StatsQueryParams;
	method?: StatsProxyMethod;
	body?: unknown;
	enabled?: boolean;
};

export function statsAppProxyQuery< TData = unknown >( {
	name,
	version,
	endpoint,
	params,
	method = 'GET',
	body,
	enabled = true,
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
		enabled,
		placeholderData: previousData => previousData,
	};
}

export const statsAppReferrersSpamQuery = () =>
	statsAppProxyQuery( {
		name: 'referrers-spam',
		version: '1.1',
		endpoint: 'stats/referrers/spam',
	} );

export const statsAppSiteHasNeverPublishedPostQuery = ( params: StatsQueryParams = {} ) =>
	statsAppProxyQuery( {
		name: 'site-has-never-published-post',
		version: '2',
		endpoint: 'site-has-never-published-post',
		params,
	} );

export const statsAppPlanUsageQuery = ( params: StatsQueryParams = {} ) =>
	statsAppProxyQuery( {
		name: 'plan-usage',
		version: '2',
		endpoint: 'jetpack-stats/usage',
		params,
	} );

export const statsAppDashboardModulesQuery = ( params: StatsQueryParams = {} ) =>
	statsAppProxyQuery( {
		name: 'dashboard-modules',
		version: '2',
		endpoint: 'jetpack-stats-dashboard/modules',
		params,
	} );

export const statsAppDashboardModuleSettingsQuery = ( params: StatsQueryParams = {} ) =>
	statsAppProxyQuery( {
		name: 'dashboard-module-settings',
		version: '2',
		endpoint: 'jetpack-stats-dashboard/module-settings',
		params,
	} );

export const statsAppPurchasesQuery = ( params: StatsQueryParams = {} ) =>
	statsAppProxyQuery( {
		name: 'purchases',
		version: '1.2',
		endpoint: 'upgrades',
		params,
	} );

export const statsAppNoticesQuery = (
	params: StatsQueryParams = {}
): UseQueryOptions< unknown > => ( {
	queryKey: [ 'stats-app', 'notices', statsQueryKeyPart( params ) ],
	queryFn: () =>
		apiFetch( {
			path: addQueryArgs( noticesPath, params ),
		} ),
	placeholderData: previousData => previousData,
} );

export type StatsAppNoticeMutationParams = {
	id: string;
	status: string;
	postponed_for?: number;
};

export const updateStatsAppNotice = ( data: StatsAppNoticeMutationParams ) =>
	apiFetch( {
		path: noticesPath,
		method: 'POST',
		data,
	} );
