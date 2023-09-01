import { BoostScoreGraph, Button, Gridicon, Popover } from '@automattic/jetpack-components';
import { useState } from 'react';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const DummyWithPopover = ( { children } ) => {
	return (
		<div className="jb-performance-history__dummy">
			{ children }

			<BoostScoreGraph isPlaceholder={ true } />
		</div>
	);
};

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
	const [ showFreshStartPopover, setFreshStartPopover ] = useState( periods.length === 0 );

	let graphComponent = (
		<BoostScoreGraph periods={ periods } startDate={ startDate } endDate={ endDate } />
	);

	if ( needsUpgrade ) {
		graphComponent = (
			<DummyWithPopover>
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
			</DummyWithPopover>
		);
	} else if ( showFreshStartPopover ) {
		graphComponent = (
			<DummyWithPopover>
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
			</DummyWithPopover>
		);
	}

	return (
		<Panel>
			<PanelBody
				title={ __( 'Historical Performance', 'jetpack-boost' ) }
				initialOpen={ isOpen }
				onToggle={ onToggle }
				className="jb-performance-history__panel"
			>
				<PanelRow>
					<div style={ { flexGrow: 1, minHeight: '300px' } }>{ graphComponent }</div>
				</PanelRow>
			</PanelBody>
		</Panel>
	);
};
