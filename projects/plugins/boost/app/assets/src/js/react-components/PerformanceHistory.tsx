import {
	BoostScoreGraph,
	Button,
	Gridicon,
	Popover,
	Spinner,
} from '@automattic/jetpack-components';
import { useState } from 'react';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const DummyGraph = ( { children } ) => {
	return (
		<div className="jb-performance-history__dummy">
			{ children }

			<BoostScoreGraph isPlaceholder={ true } />
		</div>
	);
};

const GraphComponent = ( {
	periods,
	startDate,
	endDate,
	needsUpgrade,
	handleUpgrade,
	isLoading,
} ) => {
	if ( isLoading ) {
		return (
			<div className="jb-performance-history__dummy">
				<Spinner color="#000000" />
			</div>
		);
	}

	const [ showFreshStartPopover, setFreshStartPopover ] = useState( periods.length === 0 );

	if ( needsUpgrade ) {
		return (
			<DummyGraph>
				<Popover
					icon={ <Gridicon icon="lock" /> }
					action={
						<Button onClick={ handleUpgrade }>{ __( 'Okay, got it!', 'jetpack-boost' ) }</Button>
					}
				>
					<p>
						{ __(
							'Upgrade and learn more about your site performance over time',
							'jetpack-boost'
						) }
					</p>
				</Popover>
			</DummyGraph>
		);
	}

	if ( showFreshStartPopover ) {
		return (
			<DummyGraph>
				<Popover
					icon={ <Gridicon icon="checkmark" /> }
					action={
						<Button onClick={ () => setFreshStartPopover( false ) }>
							{ __( 'Okay, got it!', 'jetpack-boost' ) }
						</Button>
					}
				>
					<p>
						{ __( 'Hello there! Jetpack Boost premium has been activated.', 'jetpack-boost' ) }
						<br />
						{ __( 'Your scores will be recorded from now on.', 'jetpack-boost' ) }
					</p>
				</Popover>
			</DummyGraph>
		);
	}

	return <BoostScoreGraph periods={ periods } startDate={ startDate } endDate={ endDate } />;
};

export const PerformanceHistory = ( {
	periods,
	onToggle,
	isOpen,
	startDate,
	endDate,
	isLoading,
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
						<GraphComponent
							periods={ periods }
							startDate={ startDate }
							endDate={ endDate }
							needsUpgrade={ needsUpgrade }
							handleUpgrade={ handleUpgrade }
							isLoading={ isLoading }
						/>
					</div>
				</PanelRow>
			</PanelBody>
		</Panel>
	);
};
