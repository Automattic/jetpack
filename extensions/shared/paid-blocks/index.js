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
import withCustomClassNames from '../with-custom-class-names';
import jetpackPaidBlockEdit from './paid-block-edit';
import { isUpgradable } from '../plan-utils';
import './editor.scss';

const jetpackPaidBlock = ( settings, name ) => {
	if ( ! isUpgradable( name ) ) {
		return settings;
	}

	addFilter(
		'editor.BlockListBlock',
		`jetpack/videopress-with-has-warning-is-interactive-class-names`,
		withCustomClassNames( name, 'has-warning is-interactive is-upgradable' )
	);

	return {
		...settings,
		edit: jetpackPaidBlockEdit( settings.edit ),
	};
};

// Extend all blocks that required a paid plan.
addFilter( 'blocks.registerBlockType', 'jetpack/paid-block', jetpackPaidBlock );
