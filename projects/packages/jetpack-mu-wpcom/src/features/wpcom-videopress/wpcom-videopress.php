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
 * Whether the VideoPress chapters editor is available to this Simple user.
 *
 * Gates the chapters editor UI in both places it lives: the dashboard's Editor
 * tab (and the `/video/$id/editor` route behind it, stripped from the wp-build
 * registry when this is false) and the block editor's "Manage chapters"
 * toolbar button. Automatticians only while the feature is in development —
 * there is deliberately no blog-sticker branch yet.
 *
 * UI-only by design: the chapters REST surface (the VideoPress endpoints that
 * read and write the chapters track) stays registered regardless, so the API
 * contract doesn't flap with the flag.
 *
 * @return bool Whether the chapters editor UI should be enabled.
 */
function wpcom_videopress_chapters_editor_enabled() {
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
	 * Registered on Simple only, so self-hosted and Atomic keep the filter's
	 * default (disabled). Registered before the class_exists() guard below and
	 * from a plugins_loaded-time call site, so it also covers block editor
	 * requests — where the flag is read at enqueue_block_editor_assets — not
	 * just the VideoPress admin page. The callbacks that consult the filter all
	 * run at admin_menu/enqueue time, well after this registration, so
	 * is_automattician() sees the resolved current user.
	 */
	add_filter( 'jetpack_videopress_chapters_editor', 'wpcom_videopress_chapters_editor_enabled' );

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
