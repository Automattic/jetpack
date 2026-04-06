/**
 * Marks the wp-admin Jetpack sidebar "Upgrade Jetpack" item for Tracks (see tracks-ajax.js / jptracks).
 */
import domReady from '@wordpress/dom-ready';

domReady( function () {
	const config = window.jetpackAdminUiUpgradeMenu;
	if ( typeof config === 'undefined' ) {
		return;
	}

	const className = config.menuItemClass;
	if ( ! className ) {
		return;
	}

	// Class comes from PHP (UPGRADE_MENU_SLUG); safe for querySelector.
	const item = document.querySelector( `li.${ className } a` );
	if ( ! item ) {
		return;
	}

	const analytics = window.analytics;

	// Initialize Tracks
	if ( 'undefined' !== typeof analytics && config.tracksUserData ) {
		analytics.initialize( config.tracksUserData.userid, config.tracksUserData.username );
	}

	item.addEventListener( 'click', function () {
		analytics.tracks.recordEvent( 'jetpack_sidebar_free_upgrade_click', config.tracksEventData );
	} );
} );
