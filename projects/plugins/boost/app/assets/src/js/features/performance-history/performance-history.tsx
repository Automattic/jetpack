import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import { usePerformanceHistoryPanelQuery, usePerformanceHistoryQuery } from './lib/stores/store';
import GraphComponent from './graph-component/graph-component';
import ErrorNotice from '$features/error-notice/error-notice';
import { __ } from '@wordpress/i18n';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import { navigate } from '$lib/utils/navigate';
import { PerformanceHistoryData } from './lib/types';

import styles from './performance-history.module.scss';

const PerformanceHistoryBody = ( { isFreshStart, onDismissFreshStart, needsUpgrade } ) => {
	const { data, isFetching, isError, error, refetch } = usePerformanceHistoryQuery();

	if ( isError && ! isFetching ) {
		return (
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
		);
	}

	return (
		<GraphComponent
			{ ...( data as PerformanceHistoryData ) }
			isFreshStart={ isFreshStart }
			needsUpgrade={ needsUpgrade }
			handleUpgrade={ () => navigate( '/upgrade' ) }
			handleDismissFreshStart={ onDismissFreshStart }
			isLoading={ isFetching }
		/>
	);
};

const PerformanceHistory = ( { needsUpgrade, isFreshStart, onDismissFreshStart } ) => {
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
							<PerformanceHistoryBody
								isFreshStart={ isFreshStart }
								onDismissFreshStart={ onDismissFreshStart }
								needsUpgrade={ needsUpgrade }
							/>
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
