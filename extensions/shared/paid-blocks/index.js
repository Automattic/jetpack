/**
 * External dependencies
 */
import { uniq } from 'lodash';
/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import withCustomClassNames from '../with-custom-class-names';
import jetpackPaidBlockEdit from './paid-block-edit';
import { isUpgradable } from '../plan-utils';
import { PremiumIcon } from './components';

import './editor.scss';

const jetpackPaidBlock = ( settings, name ) => {
	// Extend Premium Blocks.
	if ( isUpgradable( name ) ) {
		// Add custom CSS classes.
		addFilter(
			'editor.BlockListBlock',
			`jetpack/videopress-with-has-warning-is-interactive-class-names`,
			withCustomClassNames( name, 'has-warning is-interactive is-upgradable' )
		);

		// Set premium icon.
		settings.icon = <PremiumIcon icon={ settings.icon } name={ name } />;

		// Populate block keywords.
		settings.keywords = uniq( [ ...settings.keywords, 'premium', __( 'premium' ) ] );
	}

	return settings;
};

addFilter( 'blocks.registerBlockType', 'jetpack/paid-block', jetpackPaidBlock );

addFilter( 'editor.BlockEdit', 'jetpack/paid-block', jetpackPaidBlockEdit, 20 );
