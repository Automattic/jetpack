<?php
/**
 * Boots the modernized Jetpack VideoPress dashboard on WordPress.com Simple sites.
 *
 * On Simple sites the standalone Jetpack plugin's bootstrap (load-jetpack.php) never
 * runs, so the VideoPress package's Admin_UI is never initialized. Mirroring the
 * Newsletter Settings integration, this feature initializes Admin_UI — and its React
 * initial-state payload — on Simple only. The menu item itself is registered
 * separately from wpcom-admin-menu.php, once the Jetpack parent menu exists.
 *
 * Atomic/WoA and the standalone plugin are unaffected: there the VideoPress package
 * initializes Admin_UI through its own Initializer, and the Host::is_wpcom_simple()
 * gate below keeps this feature from running (and double-registering hooks) on those
 * hosts.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Status\Host;

/**
 * Initialize the VideoPress Admin UI on WordPress.com Simple sites.
 *
 * Guarded on Simple because on Atomic and standalone Jetpack the VideoPress package
 * already calls Admin_UI::init() from its own Initializer; running it here too would
 * double-register its hooks. Guarded with class_exists because mu-wpcom does not
 * composer-require the jetpack-videopress package: the class is provided by the wpcom
 * platform's bundled Jetpack source on Simple.
 *
 * @return void
 */
function wpcom_videopress_init_admin_ui() {
	if ( ! ( new Host() )->is_wpcom_simple() ) {
		return;
	}

	if ( ! class_exists( '\Automattic\Jetpack\VideoPress\Admin_UI' ) ) {
		return;
	}

	// @phan-suppress-next-line PhanUndeclaredClassMethod -- class_exists guarded above; provided by the sibling autoloader (bundled Jetpack on Simple).
	\Automattic\Jetpack\VideoPress\Admin_UI::init();

	// Emit the JPVIDEOPRESS_INITIAL_STATE boot payload the wp-build dashboard hydrates from.
	if ( class_exists( '\Automattic\Jetpack\VideoPress\Initial_State' ) ) {
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- class_exists guarded above; provided by the sibling autoloader (bundled Jetpack on Simple).
		\Automattic\Jetpack\VideoPress\Initial_State::init();
	}
}
wpcom_videopress_init_admin_ui();
