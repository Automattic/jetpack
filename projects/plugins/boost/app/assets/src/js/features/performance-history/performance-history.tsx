import { DataSyncProvider, useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';
import PerformanceHistoryPanel from './performance-history-panel';
import { navigate } from '$lib/utils/navigate';
import classNames from 'classnames';

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

const usePerformanceHistoryQuery = () => {
	const { useQuery } = useDataSync(
		'jetpack_boost_ds',
		'performance_history',
		performanceHistoryDataSchema
	);
	return useQuery();
};

/**
 * A custom hook to check if performance history needs upgrade.
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

const PerformanceHistory = ( { needsUpgrade, isFreshStart, onDismissFreshStart } ) => {
	const {
		data: { periods, startDate, endDate },
		isFetching,
	} = usePerformanceHistoryQuery();
	const [ isPanelOpen, setPanelOpen ] = usePerformanceHistoryPanelQuery();

	return (
		<div className={ classNames( 'jb-performance-history', { loading: isFetching } ) }>
			{ /* TODO: Show error if failed */ }
			<PerformanceHistoryPanel
				onToggle={ value => {
					setPanelOpen( value );
				} }
				isOpen={ isPanelOpen }
				isFreshStart={ isFreshStart }
				onDismissFreshStart={ onDismissFreshStart }
				needsUpgrade={ needsUpgrade }
				handleUpgrade={ () => navigate( '/upgrade' ) }
				periods={ periods }
				startDate={ startDate }
				endDate={ endDate }
				isLoading={ isFetching }
			/>
		</div>
	);
};

export default function ( props ) {
	return (
		<DataSyncProvider>
			<PerformanceHistory { ...props } />
		</DataSyncProvider>
	);
}
