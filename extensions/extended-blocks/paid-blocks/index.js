/**
 * External dependencies
 */
import { uniq, each } from 'lodash';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';
import { unregisterBlockStyle } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import withUpgradeBanner from './with-upgrade-banner';
import {
	isUpgradeNudgeEnabled,
	isUpgradable,
	isStillUsableWithFreePlan,
} from '../../shared/plan-utils';
import paidBlockEdit from './edit';
import renderPaidIcon from './render-paid-icon.js';

import './editor.scss';
import paidBlockMediaPlaceholder from './media-placeholder';
import paidBlockMediaReplaceFlow from './media-replace-flow';

const stylesByPaidBlocks = [];

const jetpackPaidBlock = ( settings, name ) => {
	if ( isUpgradable( name ) ) {
		if ( ! stylesByPaidBlocks.includes( name ) ) {
			stylesByPaidBlocks.push( name );
		}

		// Populate block keywords.
		settings.keywords = uniq( [ ...settings.keywords, 'premium', __( 'premium', 'jetpack' ) ] );

		// Enhance BlockEdit function with HOC.
		settings.edit = paidBlockEdit( settings.edit );

		// Extend Icon for Paid blocks.
		if ( ! isStillUsableWithFreePlan( name ) ) {
			settings.icon = renderPaidIcon( settings.icon );
		}
	}

	return settings;
};

// Extend BlockType.
addFilter( 'blocks.registerBlockType', 'jetpack/paid-block', jetpackPaidBlock );

// Extend BlockListBlock.
addFilter( 'editor.BlockListBlock', 'jetpack/paid-block-with-warning', withUpgradeBanner );

// Take the control of the MediaPlaceholder
addFilter(
	'editor.MediaPlaceholder',
	'jetpack/paid-block-media-placeholder',
	paidBlockMediaPlaceholder
);

// Take the control of the MediaReplaceFlow
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

		// Unregister block styles for all paid blocks.
		each( stylesByPaidBlocks, blockName => {
			each( select( 'core/blocks' ).getBlockStyles( blockName ), ( { name } ) =>
				unregisterBlockStyle( blockName, name )
			);
		} );
	}
} );
