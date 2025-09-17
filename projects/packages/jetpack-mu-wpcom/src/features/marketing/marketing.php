<?php
/**
 * WordPress.com Marketing Tools
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Adds some Tools menus that are missing on Simple sites.
 */
function wpcom_add_marketing_submenu() {
	add_submenu_page(
		'tools.php',
		__( 'Marketing', 'jetpack-mu-wpcom' ),
		__( 'Marketing', 'jetpack-mu-wpcom' ),
		'publish_posts',
		'wpcom-marketing',
		'wpcom_display_marketing_tools_page',
		1
	);
}
add_action( 'admin_menu', 'wpcom_add_marketing_submenu', 999999 );

/**
 * Displays the WordPress Marketing Tools page.
 */
function wpcom_display_marketing_tools_page() {
	?>
	<style>
		.wpcom-marketing-tools-description {
			margin-top: 0;
		}
	</style>
	<div class="wrap">
		<h1><?php esc_html_e( 'Marketing Tools', 'jetpack-mu-wpcom' ); ?></h1>
		<p class="wpcom-marketing-tools-description"><?php esc_html_e( 'Explore tools to build your audience, market your site, and engage your visitors.', 'jetpack-mu-wpcom' ); ?></p>
	</div>
	<?php
}
