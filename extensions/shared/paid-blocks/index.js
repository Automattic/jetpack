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
		settings.icon = {
			src: <PremiumIcon icon={ settings.icon } />,
		};

		// Populate block keywords.
		settings.keywords = uniq( [ ...settings.keywords, 'premium', __( 'premium' ) ] );

		settings.edit = jetpackPaidBlockEdit( settings.edit );
	}

	return settings;
};

addFilter( 'blocks.registerBlockType', 'jetpack/paid-block', jetpackPaidBlock, 1 );

addFilter(
	'editor.BlockListBlock',
	`jetpack/videopress-with-has-warning-is-interactive-class-names`,
	withCustomClassNames( 'has-warning is-interactive is-upgradable' )
);
