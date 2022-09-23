import {
	isUpgradeNudgeEnabled,
	isUpgradable,
	isStillUsableWithFreePlan,
} from '@automattic/jetpack-shared-extension-utils';
import domReady from '@wordpress/dom-ready';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { uniq } from 'lodash';
import paidBlockMediaPlaceholder from './media-placeholder';
import paidBlockMediaReplaceFlow from './media-replace-flow';
import renderPaidIcon from './render-paid-icon.js';
import withUpgradeBanner from './with-upgrade-banner';

import './editor.scss';

const stylesByPaidBlocks = [];

const jetpackPaidBlock = ( settings, name ) => {
	if ( isUpgradable( name ) ) {
		if ( ! stylesByPaidBlocks.includes( name ) ) {
			stylesByPaidBlocks.push( name );
		}

		// Populate block keywords.
		settings.keywords = uniq( [ ...settings.keywords, 'premium', __( 'premium', 'jetpack' ) ] );

		// Extend Icon for Paid blocks.
		if ( ! isStillUsableWithFreePlan( name ) ) {
			settings.icon = renderPaidIcon( settings.icon );
		}

		// Add the attributes for rendering upgrade nudges.
		if ( ! settings.attributes.shouldDisplayFrontendBanner ) {
			settings.attributes.shouldDisplayFrontendBanner = {
				type: 'boolean',
				default: true,
			};
		}

		// Ensure that the toolbar of the inner blocks doesn't overlap the upgrade banner.
		settings.supports = {
			...settings.supports,
			__experimentalExposeControlsToChildren: true,
		};
	}

	return settings;
};

// Extend BlockType.
addFilter( 'blocks.registerBlockType', 'jetpack/paid-block', jetpackPaidBlock );

// Extend BlockListBlock.
addFilter( 'editor.BlockEdit', 'jetpack/paid-block-with-warning', withUpgradeBanner );

// Take the control of the MediaPlaceholder.
addFilter(
	'editor.MediaPlaceholder',
	'jetpack/paid-block-media-placeholder',
	paidBlockMediaPlaceholder
);

// Take the control of the MediaReplaceFlow.
addFilter(
	'editor.MediaReplaceFlow',
	'jetpack/paid-block-media-placeholder',
	paidBlockMediaReplaceFlow
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
