import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { performanceHistoryDataSchema } from '../../../app/assets/src/js/features/performance-history/lib/hooks';
import { isSiteOnline, requestDataSync } from './use-modules-state';

export type PerformanceHistory = z.infer< typeof performanceHistoryDataSchema >;
export type PerformanceHistoryData = NonNullable< PerformanceHistory >;
export type PerformanceHistoryPeriod = PerformanceHistoryData[ 'periods' ][ number ];

export function parsePerformanceHistory( value: unknown ): PerformanceHistory {
	return performanceHistoryDataSchema.parse( value );
}

export const performanceHistoryQueryKey = [ 'performance_history' ] as const;

export function usePerformanceHistory( enabled = true ) {
	return useQuery( {
		queryKey: performanceHistoryQueryKey,
		queryFn: async () => parsePerformanceHistory( await requestDataSync( 'performance_history' ) ),
		enabled: enabled && isSiteOnline(),
		staleTime: 12 * 60 * 60 * 1000,
	} );
}

const dismissedAlertsSchema = z.record( z.string().min( 1 ), z.boolean() );
const dismissedAlertsQueryKey = [ 'dismissed_alerts' ];

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
		onMutate: async () => {
			await queryClient.cancelQueries( { queryKey: dismissedAlertsQueryKey } );
			const previous =
				queryClient.getQueryData< z.infer< typeof dismissedAlertsSchema > >(
					dismissedAlertsQueryKey
				) ?? dismissedAlertsSchema.parse( await requestDataSync( 'dismissed_alerts' ) );
			queryClient.setQueryData( dismissedAlertsQueryKey, { ...previous, [ alertId ]: true } );
			return { previous: previous[ alertId ] };
		},
		mutationFn: async () => {
			await queryClient.cancelQueries( { queryKey: dismissedAlertsQueryKey } );
			const dismissed =
				queryClient.getQueryData< z.infer< typeof dismissedAlertsSchema > >(
					dismissedAlertsQueryKey
				) ?? {};
			return dismissedAlertsSchema.parse(
				await requestDataSync( 'dismissed_alerts', { ...dismissed, [ alertId ]: true } )
			);
		},
		onError: ( _error, _variables, context ) => {
			if ( ! context ) {
				return;
			}
			queryClient.setQueryData< z.infer< typeof dismissedAlertsSchema > >(
				dismissedAlertsQueryKey,
				current => {
					const restored = { ...current };
					if ( context.previous === undefined ) {
						delete restored[ alertId ];
					} else {
						restored[ alertId ] = context.previous;
					}
					return restored;
				}
			);
		},
	} );
	return [ data?.[ alertId ] === true, () => mutate() ] as const;
}
