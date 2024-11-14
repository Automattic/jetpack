<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Customizations to the wp-admin/import.php page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Only add_action if the current screen is the wp-admin/import.php page.
 */
function import_page_customizations_init() {
	$screen = get_current_screen();

	if ( $screen && $screen->id === 'import' ) {
		// Only add the banner if the user is using the wp-admin interface.
		if ( get_option( 'wpcom_admin_interface' ) === 'wp-admin' ) {
			add_action( 'admin_notices', 'import_admin_banner' );
			add_action( 'admin_enqueue_scripts', 'import_admin_banner_css' );
		}
	}
}
add_action( 'current_screen', 'import_page_customizations_init' );

/**
 * Displays a banner on the wp-admin/import.php page that links to the Calypso importer.
 */
function import_admin_banner() {
	if ( ! function_exists( 'wpcom_get_site_slug' ) ) {
		require_once __DIR__ . '/../../utils.php';
	}

	$site_slug  = wpcom_get_site_slug();
	$import_url = esc_url( "https://wordpress.com/setup/hosted-site-migration?siteSlug={$site_slug}&ref=wp-admin" );

	$banner_content = sprintf(
		'<p>%s</p><a href="%s" class="button">%s</a>',
		esc_html__( 'Use WordPress.com’s guided importer to import posts and comments from Medium, Substack, Squarespace, Wix, and more.', 'jetpack-mu-wpcom' ),
		$import_url,
		esc_html__( 'Get started', 'jetpack-mu-wpcom' )
	);

	wp_admin_notice(
		wp_kses_post( $banner_content ),
		array(
			'paragraph_wrap'     => false,
			'additional_classes' => array( 'wpcom-import-banner' ),
		)
	);
}

/**
 * Enqueues CSS for the wp-admin/import.php Calypso import banner.
 */
function import_admin_banner_css() {
	$css_file_path = plugin_dir_path( __FILE__ ) . 'css/import-customizations.css';

	if ( file_exists( $css_file_path ) ) {
		$version = filemtime( $css_file_path );
		wp_enqueue_style( 'import_admin_banner_css', plugin_dir_url( __FILE__ ) . 'css/import-customizations.css', array(), $version );
	}
}
