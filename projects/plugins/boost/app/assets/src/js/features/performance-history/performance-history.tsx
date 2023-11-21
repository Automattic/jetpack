import { DataSyncProvider, useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';
import GraphComponent from './graph-component/graph-component';
import classNames from 'classnames';
import ErrorNotice from '$features/error-notice/error-notice';
import { __ } from '@wordpress/i18n';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import { navigate } from '$lib/utils/navigate';

import styles from './performance-history.module.scss';

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
const usePerformanceHistoryPanelQuery = () => {
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
		isError,
		error,
		refetch,
	} = usePerformanceHistoryQuery();
	const [ isPanelOpen, setPanelOpen ] = usePerformanceHistoryPanelQuery();

	return (
		<div className={ classNames( styles[ 'performance-history' ], { loading: isFetching } ) }>
			<Panel className={ classNames( styles[ 'components-panel' ] ) }>
				<PanelBody
					title={ __( 'Historical Performance', 'jetpack-boost' ) }
					initialOpen={ isPanelOpen }
					onToggle={ value => {
						setPanelOpen( value );
					} }
					className={ classNames( styles[ 'performance-history-body' ] ) }
				>
					<PanelRow>
						<div style={ { flexGrow: 1, minHeight: '300px' } }>
							{ isError && ! isFetching ? (
								<ErrorNotice
									title={ __( 'Failed to load performance history', 'jetpack-boost' ) }
									error={ error }
									data={ JSON.stringify( error, null, 2 ) }
									suggestion={ __( '<action>Try again</action>', 'jetpack-boost' ) }
									vars={ {
										action: (
											// eslint-disable-next-line jsx-a11y/anchor-is-valid, jsx-a11y/anchor-has-content
											<a
												onClick={ event => {
													event.preventDefault();
													refetch();
												} }
												href="#"
											/>
										),
									} }
								/>
							) : (
								<GraphComponent
									periods={ periods }
									startDate={ startDate }
									endDate={ endDate }
									isFreshStart={ isFreshStart }
									needsUpgrade={ needsUpgrade }
									handleUpgrade={ () => navigate( '/upgrade' ) }
									handleDismissFreshStart={ onDismissFreshStart }
									isLoading={ isFetching }
								/>
							) }
						</div>
					</PanelRow>
				</PanelBody>
			</Panel>
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
