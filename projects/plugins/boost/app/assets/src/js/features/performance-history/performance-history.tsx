import {
	useDismissibleAlertState,
	usePerformanceHistoryPanelQuery,
	usePerformanceHistoryQuery,
} from './lib/hooks';
import GraphComponent from './graph-component/graph-component';
import ErrorNotice from '$features/error-notice/error-notice';
import { __ } from '@wordpress/i18n';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import { PerformanceHistoryData } from './lib/types';
import { Button } from '@automattic/jetpack-components';
import { useNavigate } from 'react-router-dom';
import { useSingleModuleState } from '$features/module/lib/stores';
import styles from './performance-history.module.scss';
import { useEffect } from 'react';
import { recordBoostEvent } from '$lib/utils/analytics';

const PerformanceHistoryBody = () => {
	const [ performanceHistoryState ] = useSingleModuleState( 'performance_history' );
	const needsUpgrade = ! performanceHistoryState?.available;

	const { data, isFetching, isError, error, refetch } = usePerformanceHistoryQuery();
	const [ freshStartCompleted, dismissFreshStart ] = useDismissibleAlertState(
		'performance_history_fresh_start'
	);
	const navigate = useNavigate();

	/*
	 * Fetch new data on initial page-load. This is a lazy data-sync and initially empty.
	 */
	useEffect( () => {
		refetch();
	}, [ refetch ] );

	if ( isError && ! isFetching ) {
		return (
			<ErrorNotice
				title={ __( 'Failed to load performance history', 'jetpack-boost' ) }
				error={ error }
				data={ JSON.stringify( error, null, 2 ) }
				suggestion={ __( '<action>Try again</action>', 'jetpack-boost' ) }
				vars={ {
					action: <Button variant="link" onClick={ refetch } />,
				} }
			/>
		);
	}

	return (
		<GraphComponent
			{ ...( data as PerformanceHistoryData ) }
			isFreshStart={ ! freshStartCompleted }
			needsUpgrade={ needsUpgrade }
			handleUpgrade={ () => navigate( '/upgrade' ) }
			handleDismissFreshStart={ dismissFreshStart }
			isLoading={ isFetching && ( ! data || data.periods.length === 0 ) }
		/>
	);
};

const PerformanceHistory = () => {
	const [ isPanelOpen, setPanelOpen ] = usePerformanceHistoryPanelQuery();

	return (
		<div className={ styles[ 'performance-history' ] }>
			<Panel className={ styles[ 'components-panel' ] }>
				<PanelBody
					title={ __( 'Historical Performance', 'jetpack-boost' ) }
					initialOpen={ isPanelOpen }
					onToggle={ ( value: boolean ) => {
						recordBoostEvent( 'performance_history_panel_toggle', { status: value ? 'open' : 'close' } );
						setPanelOpen( value );
					} }
					className={ styles[ 'performance-history-body' ] }
				>
					<PanelRow>
						<div style={ { flexGrow: 1, minHeight: '300px' } }>
							<PerformanceHistoryBody />
						</div>
					</PanelRow>
				</PanelBody>
			</Panel>
		</div>
	);
};

export default PerformanceHistory;
