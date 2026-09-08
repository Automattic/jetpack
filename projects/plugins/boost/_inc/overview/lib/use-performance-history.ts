import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { isSiteOnline, requestDataSync } from './use-modules-state';

const periodSchema = z.object( {
	timestamp: z.number(),
	dimensions: z.object( {
		desktop_overall_score: z.number(),
		mobile_overall_score: z.number(),
		desktop_cls: z.number(),
		desktop_lcp: z.number(),
		desktop_tbt: z.number(),
		mobile_cls: z.number(),
		mobile_lcp: z.number(),
		mobile_tbt: z.number(),
	} ),
} );

const historySchema = z.object( {
	periods: z.array( periodSchema ),
	annotations: z.array( z.object( { timestamp: z.number(), text: z.string() } ) ),
	startDate: z.number(),
	endDate: z.number(),
} );

export type PerformanceHistoryPeriod = z.infer< typeof periodSchema >;
export type PerformanceHistoryData = z.infer< typeof historySchema >;
export type PerformanceHistory = PerformanceHistoryData | null;

export function parsePerformanceHistory( value: unknown ): PerformanceHistory {
	return historySchema.nullable().parse( value );
}

export function usePerformanceHistory( enabled = true ) {
	return useQuery( {
		queryKey: [ 'performance_history' ],
		queryFn: async () => parsePerformanceHistory( await requestDataSync( 'performance_history' ) ),
		enabled: enabled && isSiteOnline(),
		staleTime: 12 * 60 * 60 * 1000,
	} );
}

const dismissedAlertsSchema = z.record( z.string().min( 1 ), z.boolean() );
const dismissedAlertsQueryKey = [ 'jetpack_boost_dismissed_alerts' ];

export function useDismissibleAlertState(
	alertId: 'performance_history_fresh_start' | 'score_increase' | 'score_decrease'
) {
	const queryClient = useQueryClient();
	const initial = dismissedAlertsSchema.safeParse(
		window.jetpack_boost_ds?.dismissed_alerts?.value
	);
	const { data } = useQuery( {
		queryKey: dismissedAlertsQueryKey,
		queryFn: async () => dismissedAlertsSchema.parse( await requestDataSync( 'dismissed_alerts' ) ),
		initialData: initial.success ? initial.data : undefined,
		enabled: isSiteOnline(),
	} );
	const { mutate } = useMutation( {
		scope: { id: 'jetpack_boost_dismissed_alerts' },
		mutationFn: async () => {
			await queryClient.cancelQueries( { queryKey: dismissedAlertsQueryKey } );
			const dismissed =
				queryClient.getQueryData< z.infer< typeof dismissedAlertsSchema > >(
					dismissedAlertsQueryKey
				) ?? dismissedAlertsSchema.parse( await requestDataSync( 'dismissed_alerts' ) );
			return dismissedAlertsSchema.parse(
				await requestDataSync( 'dismissed_alerts', { ...dismissed, [ alertId ]: true } )
			);
		},
		onSuccess: async dismissed => {
			await queryClient.cancelQueries( { queryKey: dismissedAlertsQueryKey } );
			queryClient.setQueryData( dismissedAlertsQueryKey, dismissed );
		},
	} );
	return [ data?.[ alertId ] === true, () => mutate() ] as const;
}
