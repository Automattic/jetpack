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
	const eventName = config.tracksEventName;
	if ( ! className || ! eventName ) {
		return;
	}

	// Class comes from PHP (UPGRADE_MENU_SLUG); safe for querySelector.
	const item = document.querySelector( `li.${ className } a` );
	if ( ! item ) {
		return;
	}

	item.classList.add( 'jptracks' );
	item.setAttribute( 'data-jptracks-name', eventName );
} );
