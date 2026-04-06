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

	const parentTopLevelMenu = item.closest(
		'#toplevel_page_jetpack, #toplevel_page_jetpack-network'
	);

	const isParentMenuOpen =
		parentTopLevelMenu &&
		parentTopLevelMenu.classList.contains( 'wp-menu-open' ) &&
		parentTopLevelMenu.classList.contains( 'wp-has-current-submenu' );

	if ( isParentMenuOpen ) {
		// Only record the "seen" event if the parent menu is open.
		window.analytics?.tracks?.recordEvent(
			'jetpack_sidebar_free_upgrade_seen',
			config.tracksEventData
		);
	} else {
		// Only record the "seen" event if the parent menu was opened, and record it once only.
		const onHover = function () {
			window.analytics?.tracks?.recordEvent(
				'jetpack_sidebar_free_upgrade_seen',
				config.tracksEventData
			);
			parentTopLevelMenu.removeEventListener( 'hover', onHover );
		};
		parentTopLevelMenu.addEventListener( 'hover', onHover );
	}

	item.addEventListener( 'click', function () {
		window.analytics?.tracks?.recordEvent(
			'jetpack_sidebar_free_upgrade_click',
			config.tracksEventData
		);
	} );
} );
