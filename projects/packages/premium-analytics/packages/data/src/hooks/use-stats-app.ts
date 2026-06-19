/**
 * External dependencies
 */
import { useMutation, useQuery } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import { fetchStatsProxy } from '../api/stats-proxy-fetch';
import { queryClient } from '../providers';
import {
	statsAppDashboardModulesQuery,
	statsAppDashboardModuleSettingsQuery,
	statsAppNoticesQuery,
	statsAppPlanUsageQuery,
	statsAppPurchasesQuery,
	statsAppReferrersSpamQuery,
	statsAppSiteHasNeverPublishedPostQuery,
	updateStatsAppNotice,
	type StatsAppNoticeMutationParams,
} from '../queries/stats-app-queries';
import type { StatsQueryParams } from '../utils/stats-params';

type UseStatsAppOptions = {
	enabled?: boolean;
};

export function useStatsAppReferrersSpam( options?: UseStatsAppOptions ) {
	return useQuery( {
		...statsAppReferrersSpamQuery(),
		enabled: options?.enabled ?? true,
	} );
}

export function useStatsAppSiteHasNeverPublishedPost(
	params?: StatsQueryParams,
	options?: UseStatsAppOptions
) {
	return useQuery( {
		...statsAppSiteHasNeverPublishedPostQuery( params ),
		enabled: options?.enabled ?? true,
	} );
}

export function useStatsAppPlanUsage( params?: StatsQueryParams, options?: UseStatsAppOptions ) {
	return useQuery( {
		...statsAppPlanUsageQuery( params ),
		enabled: options?.enabled ?? true,
	} );
}

export function useStatsAppDashboardModules(
	params?: StatsQueryParams,
	options?: UseStatsAppOptions
) {
	return useQuery( {
		...statsAppDashboardModulesQuery( params ),
		enabled: options?.enabled ?? true,
	} );
}

export function useStatsAppDashboardModuleSettings(
	params?: StatsQueryParams,
	options?: UseStatsAppOptions
) {
	return useQuery( {
		...statsAppDashboardModuleSettingsQuery( params ),
		enabled: options?.enabled ?? true,
	} );
}

export function useStatsAppPurchases( params?: StatsQueryParams, options?: UseStatsAppOptions ) {
	return useQuery( {
		...statsAppPurchasesQuery( params ),
		enabled: options?.enabled ?? true,
	} );
}

export function useStatsAppNotices( params?: StatsQueryParams, options?: UseStatsAppOptions ) {
	return useQuery( {
		...statsAppNoticesQuery( params ),
		enabled: options?.enabled ?? true,
	} );
}

export function useStatsAppReferrersMarkSpamMutation() {
	return useMutation( {
		mutationFn: ( domain: string ) =>
			fetchStatsProxy( {
				version: '1.1',
				endpoint: 'stats/referrers/spam/new',
				method: 'POST',
				params: { domain },
			} ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'stats', 'referrers' ] } );
			queryClient.invalidateQueries( { queryKey: [ 'stats-app', 'referrers-spam' ] } );
		},
	} );
}

export function useStatsAppReferrersUnmarkSpamMutation() {
	return useMutation( {
		mutationFn: ( domain: string ) =>
			fetchStatsProxy( {
				version: '1.1',
				endpoint: 'stats/referrers/spam/delete',
				method: 'POST',
				params: { domain },
			} ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'stats', 'referrers' ] } );
			queryClient.invalidateQueries( { queryKey: [ 'stats-app', 'referrers-spam' ] } );
		},
	} );
}

export function useStatsAppDashboardModulesMutation() {
	return useMutation( {
		mutationFn: ( body: unknown ) =>
			fetchStatsProxy( {
				version: '2',
				endpoint: 'jetpack-stats-dashboard/modules',
				method: 'POST',
				body,
			} ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'stats-app', 'dashboard-modules' ] } );
		},
	} );
}

export function useStatsAppDashboardModuleSettingsMutation() {
	return useMutation( {
		mutationFn: ( body: unknown ) =>
			fetchStatsProxy( {
				version: '2',
				endpoint: 'jetpack-stats-dashboard/module-settings',
				method: 'POST',
				body,
			} ),
		onSuccess: () => {
			queryClient.invalidateQueries( {
				queryKey: [ 'stats-app', 'dashboard-module-settings' ],
			} );
		},
	} );
}

export function useStatsAppNoticeMutation() {
	return useMutation( {
		mutationFn: ( data: StatsAppNoticeMutationParams ) => updateStatsAppNotice( data ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'stats-app', 'notices' ] } );
		},
	} );
}

export function useStatsAppCommercialClassificationMutation() {
	return useMutation( {
		mutationFn: ( params?: StatsQueryParams ) =>
			fetchStatsProxy( {
				version: '2',
				endpoint: 'commercial-classification',
				method: 'POST',
				params,
			} ),
	} );
}
