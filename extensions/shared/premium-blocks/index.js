/**
 * External dependencies
 */
import { uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import withUpgradeBanner from './with-upgrade-banner';
import { isUpgradeNudgeEnabled, isUpgradable } from '../plan-utils';
import premiumBlockEdit from './edit';

import './editor.scss';

const jetpackPremiumBlock = ( settings, name ) => {
	if ( isUpgradable( name ) ) {
		// Populate block keywords.
		settings.keywords = uniq( [ ...settings.keywords, 'premium', __( 'premium' ) ] );

		// Extend BlockEdit function.
		settings.edit = premiumBlockEdit( settings.edit );
	}

	return settings;
};

// Extend BlockType.
addFilter( 'blocks.registerBlockType', 'jetpack/paid-block', jetpackPremiumBlock );

// Extend BlockListBlock.
addFilter( 'editor.BlockListBlock', 'jetpack/premium-block-with-warning', withUpgradeBanner );

/*
 * Add the `jetpack-enable-upgrade-nudge` css Class
 * to the document body if the feature is enabled.
 */
domReady( function() {
	if ( isUpgradeNudgeEnabled() ) {
		document.body.classList.add( 'jetpack-enable-upgrade-nudge' );
	}
} );
