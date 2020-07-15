/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import jetpackPaidBlockEdit from './paid-block-edit';
import { isUpgradable } from '../plan-utils';

const jetpackPaidBlock = ( settings, name ) => {
	if ( ! isUpgradable( name ) ) {
		return settings;
	}

	return {
		...settings,
		edit: jetpackPaidBlockEdit( settings.edit ),
	};
};

// Extend all blocks that required a paid plan.
addFilter( 'blocks.registerBlockType', 'jetpack/paid-block', jetpackPaidBlock );
