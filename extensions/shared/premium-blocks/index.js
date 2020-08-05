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
import renderPremiumIcon from './render-premium-icon.js';

import './editor.scss';
import premiumBlockMediaPlaceholder from './media-placeholder';
import premiumBlockMediaReplaceFlow from './media-replace-flow';

const jetpackPremiumBlock = ( settings, name ) => {
	if ( isUpgradable( name ) ) {
		// Populate block keywords.
		settings.keywords = uniq( [ ...settings.keywords, 'premium', __( 'premium' ) ] );

		// Extend BlockEdit function.
		settings.edit = premiumBlockEdit( settings.edit );
		settings.icon = renderPremiumIcon( settings.icon );
	}

	return settings;
};

// Extend BlockType.
addFilter( 'blocks.registerBlockType', 'jetpack/paid-block', jetpackPremiumBlock );

// Extend BlockListBlock.
addFilter( 'editor.BlockListBlock', 'jetpack/premium-block-with-warning', withUpgradeBanner );

// Take the control of the MediaPlaceholder
addFilter(
	'editor.MediaPlaceholder',
	'jetpack/premium-block-media-placeholder',
	premiumBlockMediaPlaceholder
);

// Take the control of the MediaReplaceFlow
addFilter(
	'editor.MediaReplaceFlow',
	'jetpack/premium-block-media-placeholder',
	premiumBlockMediaReplaceFlow
);

/*
 * Add the `jetpack-enable-upgrade-nudge` css Class
 * to the document body if the feature is enabled.
 */
domReady( function () {
	if ( isUpgradeNudgeEnabled() ) {
		document.body.classList.add( 'jetpack-enable-upgrade-nudge' );
	}
} );
