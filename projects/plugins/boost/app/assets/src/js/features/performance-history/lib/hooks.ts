import { z } from 'zod';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';

const periodsSchema = z.object( {
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

const performanceHistoryDataSchema = z
	.object( {
		periods: z.array( periodsSchema ),
		startDate: z.number(),
		endDate: z.number(),
	} )
	.nullable();

export const usePerformanceHistoryQuery = () => {
	const [ query ] = useDataSync(
		'jetpack_boost_ds',
		'performance_history',
		performanceHistoryDataSchema
	);

	return query;
};

/**
 * A custom hook to handle performance history panel being open or closed.
 */
export const usePerformanceHistoryPanelQuery = () => {
	const [ { data }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'performance_history_toggle',
		z.boolean()
	);

	return [ data, mutate ] as const;
};

/**
 * Check if performance history fresh start alert should be shown. And provide a method to dismiss it.
 *
 * @return {[ boolean, () => void ]} - A tuple with the state and a method to dismiss the alert.
 */
export const usePerformanceHistoryFreshStartState = () => {
	const [ { data: dismissedAlerts }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'dismissed_alerts',
		z.record( z.string().min( 1 ), z.boolean() )
	);
	const dismiss = () => {
		mutate( { ...dismissedAlerts, performance_history_fresh_start: true } );
	};
	const isFreshStart = dismissedAlerts.performance_history_fresh_start !== true;

	return [ isFreshStart, dismiss ] as const;
};
