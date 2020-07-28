/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import { isUpgradeNudgeEnabled } from '../plan-utils';

import './editor.scss';

/*
 * Add the `jetpack-enable-upgrade-nudge` css Class
 * to the document body if the feature is enabled.
 */
domReady( function() {
	if ( isUpgradeNudgeEnabled() ) {
		document.body.classList.add( 'jetpack-enable-upgrade-nudge' );
	}
} );
