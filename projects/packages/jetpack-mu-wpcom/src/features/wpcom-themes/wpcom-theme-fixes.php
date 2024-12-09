<?php
/**
 * WordPress.com Theme Fixes
 *
 * Various fixes to WordPress themes page related to WordPress.com.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Removes actions from the active theme details added by Core to replicate our custom WP.com submenus.
 *
 * Core expect the menus to link to WP Admin, but our submenus point to wordpress.com so the actions won't work.
 *
 * @see https://github.com/WordPress/wordpress-develop/blob/80096ddf29d3ffa4d5654f5f788df7f598b48756/src/wp-admin/themes.php#L356-L412
 */
function wpcom_themes_remove_wpcom_actions() {
	wp_enqueue_script(
		'wpcom-theme-actions',
		plugins_url( 'js/theme-actions.js', __FILE__ ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION,
		array(
			'strategy'  => 'defer',
			'in_footer' => true,
		)
	);
}
add_action( 'load-themes.php', 'wpcom_themes_remove_wpcom_actions' );
