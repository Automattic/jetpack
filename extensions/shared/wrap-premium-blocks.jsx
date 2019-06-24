/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import UpgradeNudge from './upgrade-nudge';

const wrapPremiumBlocks = WrappedComponent => props => (
	// Wraps the input component in a container, without mutating it. Good!
	<div className="premium-blocks__wrapper">
		<UpgradeNudge />
		<div className="premium-blocks__disabled">
			<WrappedComponent { ...props } />
		</div>
	</div>
);

const premiumBlocks = ( settings, name ) => {
	if ( name === 'jetpack/simple-payments' ) {
		return {
			...settings,
			edit: wrapPremiumBlocks( settings.edit ),
		};
	}

	return settings;
};

addFilter( 'blocks.registerBlockType', 'jetpack', premiumBlocks );
