/**
 * External dependencies
 */
import { uniq } from 'lodash';
/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import withUpgradeBanner from './with-upgrade-banner';
import jetpackPaidBlockEdit from './paid-block-edit';
import { isUpgradable, isUpgradeNudgeEnabled } from '../plan-utils';

import './editor.scss';

const jetpackPaidBlock = ( settings, name ) => {
	if ( isUpgradable( name ) ) {
		// Populate block keywords.
		settings.keywords = uniq( [ ...settings.keywords, 'premium', __( 'premium' ) ] );

		settings.edit = jetpackPaidBlockEdit( settings.edit );
	}

	return settings;
};

addFilter( 'blocks.registerBlockType', 'jetpack/paid-block', jetpackPaidBlock, 1 );

addFilter(
	'editor.BlockListBlock',
	'jetpack/premium-block-with-warning',
	withUpgradeBanner
);

domReady( function() {
	if ( isUpgradeNudgeEnabled() ) {
		document.body.classList.add( 'jetpack-enable-upgrade-nudge' );
	}
} );
