/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { name, settings } from '.';

registerJetpackBlock( name, settings );

// Override the core crowdsignal block when Jetpack is active
addFilter( 'blocks.registerBlockType', 'jetpack/crowdsignal-embed', ( settings, name ) => {
	if ( 'core-embed/crowdsignal' !== name ) {
		return settings;
	}

	return {
		...settings,
		supports: {
			inserter: false,
		},
		patterns: [],
	};
} );
