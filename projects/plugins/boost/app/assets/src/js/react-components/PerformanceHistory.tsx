import { BoostScoreGraph, Button, Gridicon, Popover } from '@automattic/jetpack-components';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const PerformanceHistory = ( {
	periods,
	onToggle,
	isOpen,
	startDate,
	endDate,
	needsUpgrade = false,
	handleUpgrade = () => {
		/* noop */
	},
} ) => {
	return (
		<Panel>
			<PanelBody
				title={ __( 'Historical Performance', 'jetpack-boost' ) }
				initialOpen={ isOpen }
				onToggle={ onToggle }
				className="jb-performance-history__panel"
			>
				<PanelRow>
					<div style={ { flexGrow: 1, minHeight: '300px' } }>
						{ needsUpgrade ? (
							<div className="jb-performance-history__upgrade-notice">
								<Popover
									icon={ <Gridicon icon="lock" /> }
									action={ <Button onClick={ handleUpgrade }>Okay, got it!</Button> }
								>
									<p>
										{ __(
											'Upgrade and learn more about your site performance over time',
											'jetpack-boost'
										) }
									</p>
								</Popover>

								<BoostScoreGraph
									isPlaceholder={ true }
									periods={ periods }
									startDate={ startDate }
									endDate={ endDate }
								/>
							</div>
						) : (
							<BoostScoreGraph periods={ periods } startDate={ startDate } endDate={ endDate } />
						) }
					</div>
				</PanelRow>
			</PanelBody>
		</Panel>
	);
};
