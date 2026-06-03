/**
 * Marks the wp-admin Jetpack sidebar "Upgrade Jetpack" item for Tracks.
 */
document.addEventListener( 'DOMContentLoaded', () => {
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

	// Initialize Tracks
	if ( 'undefined' !== typeof window?.analytics && config.tracksUserData ) {
		window.analytics.initialize( config.tracksUserData?.userid, config.tracksUserData?.username );
	}

	item.addEventListener( 'click', function () {
		window.analytics?.tracks?.recordEvent(
			'jetpack_sidebar_free_upgrade_click',
			config.tracksEventData
		);
	} );
} );
