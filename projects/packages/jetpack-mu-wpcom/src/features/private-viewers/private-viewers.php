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
	add_submenu_page(
		'users.php',
		__( 'Private Viewers', 'jetpack-mu-wpcom' ),
		__( 'Private Viewers', 'jetpack-mu-wpcom' ),
		'list_users',
		'wpcom-private-viewers',
		'wpcom_private_viewers_display_page'
	);
}
add_action( 'admin_menu', 'wpcom_private_viewers_add_menu' );

/**
 * Display the Private Viewers page.
 */
function wpcom_private_viewers_display_page() {
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Private Viewers', 'jetpack-mu-wpcom' ); ?></h1>
	</div>
	<?php
}
