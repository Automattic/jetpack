import { z } from 'zod';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';

const performanceHistoryDataSchema = z.object( {
	periods: z.array(
		z.object( {
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
		} )
	),
	startDate: z.number(),
	endDate: z.number(),
} );

export const usePerformanceHistoryQuery = () => {
	const { useQuery } = useDataSync(
		'jetpack_boost_ds',
		'performance_history',
		performanceHistoryDataSchema
	);
	return useQuery( {
		initialData: {
			periods: [],
			startDate: 0,
			endDate: 0,
		},
	} );
};

/**
 * A custom hook to handle performance history panel being open or closed.
 */
export const usePerformanceHistoryPanelQuery = () => {
	const { useQuery, useMutation } = useDataSync(
		'jetpack_boost_ds',
		'performance_history_toggle',
		z.boolean()
	);
	const { data } = useQuery();
	const { mutate } = useMutation();

	return [ data, mutate ] as const;
};
