import {
	usePerformanceHistoryFreshStartState,
	usePerformanceHistoryPanelQuery,
	usePerformanceHistoryQuery,
} from './lib/hooks';
import GraphComponent from './graph-component/graph-component';
import ErrorNotice from '$features/error-notice/error-notice';
import { __ } from '@wordpress/i18n';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import { navigate } from '$lib/utils/navigate';
import { PerformanceHistoryData } from './lib/types';

import styles from './performance-history.module.scss';
import { Button } from '@automattic/jetpack-components';

type PerformanceHistoryProps = {
	needsUpgrade: boolean;
};

const PerformanceHistoryBody = ( { needsUpgrade }: PerformanceHistoryProps ) => {
	const { data, isFetching, isError, error, refetch } = usePerformanceHistoryQuery();
	const [ isFreshStart, dismissFreshStart ] = usePerformanceHistoryFreshStartState();

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
			isFreshStart={ isFreshStart }
			needsUpgrade={ needsUpgrade }
			handleUpgrade={ () => navigate( '/upgrade' ) }
			handleDismissFreshStart={ dismissFreshStart }
			isLoading={ isFetching }
		/>
	);
};

const PerformanceHistory = ( { needsUpgrade }: PerformanceHistoryProps ) => {
	const [ isPanelOpen, setPanelOpen ] = usePerformanceHistoryPanelQuery();

	return (
		<div className={ styles[ 'performance-history' ] }>
			<Panel className={ styles[ 'components-panel' ] }>
				<PanelBody
					title={ __( 'Historical Performance', 'jetpack-boost' ) }
					initialOpen={ isPanelOpen }
					onToggle={ value => {
						setPanelOpen( value );
					} }
					className={ styles[ 'performance-history-body' ] }
				>
					<PanelRow>
						<div style={ { flexGrow: 1, minHeight: '300px' } }>
							<PerformanceHistoryBody needsUpgrade={ needsUpgrade } />
						</div>
					</PanelRow>
				</PanelBody>
			</Panel>
		</div>
	);
};

export default PerformanceHistory;
