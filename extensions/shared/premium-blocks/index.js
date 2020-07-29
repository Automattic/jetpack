/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { isUpgradeNudgeEnabled, isUpgradable } from '../plan-utils';
import premiumBlockEdit from './edit';

import './editor.scss';

const jetpackPaidBlock = ( settings, name ) => {
	if ( isUpgradable( name ) ) {
		settings.edit = premiumBlockEdit( settings.edit );
	}

	return settings;
};

addFilter( 'blocks.registerBlockType', 'jetpack/paid-block', jetpackPaidBlock );

/*
 * Add the `jetpack-enable-upgrade-nudge` css Class
 * to the document body if the feature is enabled.
 */
domReady( function() {
	if ( isUpgradeNudgeEnabled() ) {
		document.body.classList.add( 'jetpack-enable-upgrade-nudge' );
	}
} );
