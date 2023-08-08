import { BoostScoreGraph } from '@automattic/jetpack-components';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const PerformanceHistory = ( { periods, onToggle, isOpen, startDate, endDate } ) => {
	return (
		<Panel>
			<PanelBody
				title={ __( 'Historical Performance', 'jetpack-boost' ) }
				initialOpen={ isOpen }
				onToggle={ onToggle }
			>
				<PanelRow>
					<div style={ { flexGrow: 1, minHeight: '300px' } }>
						<BoostScoreGraph periods={ periods } startDate={ startDate } endDate={ endDate } />
					</div>
				</PanelRow>
			</PanelBody>
		</Panel>
	);
};
