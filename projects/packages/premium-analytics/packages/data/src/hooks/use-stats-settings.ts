import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	fetchStatsSettings,
	saveStatsSettings,
	type StatsSettings,
	type StatsSettingsResponse,
} from '../api/stats-settings';

export type { StatsSettings, StatsSettingsResponse };

const STATS_SETTINGS_QUERY_KEY = [ 'stats', 'settings' ];

export function useStatsSettings( { enabled = true }: { enabled?: boolean } = {} ) {
	return useQuery( {
		queryKey: STATS_SETTINGS_QUERY_KEY,
		queryFn: fetchStatsSettings,
		enabled,
	} );
}

export function useStatsSettingsMutation() {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: saveStatsSettings,
		onSuccess: ( response: StatsSettingsResponse ) => {
			queryClient.setQueryData( STATS_SETTINGS_QUERY_KEY, response );
		},
	} );
}
