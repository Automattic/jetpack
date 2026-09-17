import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { performanceHistoryDataSchema } from '../../../app/assets/src/js/features/performance-history/lib/hooks';
import { bucketHistoryDays, getHistoryWindow, type HistoryWindow } from './history-days';
import { isSiteOnline, requestDataSync } from './use-modules-state';

export type PerformanceHistory = z.infer< typeof performanceHistoryDataSchema >;
export type PerformanceHistoryData = NonNullable< PerformanceHistory >;
export type PerformanceHistoryPeriod = PerformanceHistoryData[ 'periods' ][ number ];

export function parsePerformanceHistory( value: unknown ): PerformanceHistory {
	return performanceHistoryDataSchema.parse( value );
}

export const performanceHistoryQueryKey = [ 'performance_history' ] as const;

const historyStaleTime = 12 * 60 * 60 * 1000;

function historyQuery( { startDate, endDate }: HistoryWindow ) {
	return {
		queryKey: [ ...performanceHistoryQueryKey, startDate, endDate ],
		queryFn: async () =>
			parsePerformanceHistory(
				await requestDataSync( 'performance_history', {
					startDate,
					endDate,
					periods: [],
					annotations: [],
					surfaceErrors: true,
				} )
			),
		staleTime: historyStaleTime,
	};
}

export function usePerformanceHistory( enabled = true, window = getHistoryWindow( 0 ) ) {
	return useQuery( { ...historyQuery( window ), enabled: enabled && isSiteOnline() } );
}

/**
 * Check the combined older range without populating individual page caches.
 *
 * @param enabled - Whether to request history.
 * @param windows - Older windows, nearest first.
 * @return Query whose data is false only when every window is empty.
 */
export function useHasOlderHistory( enabled: boolean, windows: HistoryWindow[] ) {
	return useQuery( {
		queryKey: [ ...performanceHistoryQueryKey, 'older', windows ],
		queryFn: async () => {
			if ( ! windows.length ) {
				return false;
			}
			const range = {
				startDate: Math.min( ...windows.map( window => window.startDate ) ),
				endDate: Math.max( ...windows.map( window => window.endDate ) ),
			};
			const data = await historyQuery( range ).queryFn();
			return bucketHistoryDays( data?.periods ?? [], range ).some( day => day.period );
		},
		enabled: enabled && isSiteOnline(),
		staleTime: historyStaleTime,
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
			return dismissedAlertsSchema.parse(
				await requestDataSync( 'dismissed_alerts', { [ alertId ]: true }, 'merge' )
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
