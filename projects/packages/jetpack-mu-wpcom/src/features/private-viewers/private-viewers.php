<?php
/**
 * Private Viewers feature.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Register the Private Viewers submenu under Users.
 */
function wpcom_private_viewers_add_menu() {
	// Only register the menu if the site is private.
	if ( (int) get_option( 'blog_public' ) !== -1 ) {
		return;
	}

	$hook_suffix = add_submenu_page(
		'users.php',
		__( 'Private Viewers', 'jetpack-mu-wpcom' ),
		__( 'Private Viewers', 'jetpack-mu-wpcom' ),
		'list_users',
		'wpcom-private-viewers',
		'wpcom_private_viewers_display_page'
	);
	add_action( 'load-' . $hook_suffix, 'wpcom_private_viewers_load_page' );
}
add_action( 'admin_menu', 'wpcom_private_viewers_add_menu' );

/**
 * Initialize the Private Viewers page.
 */
function wpcom_private_viewers_load_page() {
	add_action( 'admin_enqueue_scripts', 'wpcom_private_viewers_enqueue_assets' );
}

/**
 * Enqueue the Private Viewers assets.
 */
function wpcom_private_viewers_enqueue_assets() {
	jetpack_mu_wpcom_enqueue_assets( 'private-viewers', array( 'js', 'css' ) );
	wp_add_inline_script(
		'jetpack-mu-wpcom-private-viewers',
		'var wpcomPrivateViewers = ' . wp_json_encode( array( 'siteId' => get_wpcom_blog_id() ) ) . ';',
		'before'
	);
}

/**
 * Display the Private Viewers page.
 */
function wpcom_private_viewers_display_page() {
	?>
	<div id="wpcom-private-viewers-root"></div>
	<?php
}
