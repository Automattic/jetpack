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
 * Whether the modernized VideoPress dashboard is rolled out to this Simple
 * site and user (VIDP-285).
 *
 * The whole admin UI keys off Admin_UI::is_modernized() — menu registration
 * (add_wp_admin_submenu bails without it), the wp-build asset load, and the
 * boot payload — so this is the Simple staged-rollout switch: off by default,
 * on for CFT testers via the blog sticker, and always on for Automatticians.
 * UI-only by design: the REST surface (wpcom/v2 routes, attachment query
 * filters, the server-side token mint) stays registered regardless, so the
 * API contract doesn't flap with the flag.
 *
 * @return bool Whether the modernized dashboard should be enabled.
 */
function wpcom_videopress_modernized_dashboard_enabled() {
	if (
		function_exists( 'wpcom_has_blog_sticker' ) && function_exists( 'get_wpcom_blog_id' )
		&& wpcom_has_blog_sticker( 'videopress-modernized-dashboard', get_wpcom_blog_id() )
	) {
		return true;
	}

	return function_exists( 'is_automattician' ) && is_automattician( get_current_user_id() );
}

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

	/*
	 * VIDP-285: staged rollout. Registered on Simple only, so self-hosted and
	 * Atomic keep the filter's default (enabled). The callbacks that consult
	 * Admin_UI::is_modernized() run at admin_menu time, well after this
	 * plugins_loaded-time registration.
	 */
	add_filter( 'rsm_jetpack_ui_modernization_videopress', 'wpcom_videopress_modernized_dashboard_enabled' );

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
