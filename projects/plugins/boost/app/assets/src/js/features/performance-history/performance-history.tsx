import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import { usePerformanceHistoryPanelQuery, usePerformanceHistoryQuery } from './lib/stores/store';
import GraphComponent from './graph-component/graph-component';
import classNames from 'classnames';
import ErrorNotice from '$features/error-notice/error-notice';
import { __ } from '@wordpress/i18n';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import { navigate } from '$lib/utils/navigate';

import styles from './performance-history.module.scss';

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
