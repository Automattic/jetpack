<?php
/**
 * Customizations to the wp-admin/import.php page.
 *
 * Adds a custom banner and associated styles to the WordPress import page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Displays a banner on the wp-admin/import.php page that links to the Calypso importer.
 */
function import_admin_banner() {
	if ( $GLOBALS['pagenow'] === 'import.php' ) {
		echo '<div id="wpcom-import-banner" class="notice">';
		echo '<p>Import your content with WordPress.com’s guided importer. Designed for seamless integration from multiple platforms.</p>';
		echo '<a href="" class="button">Start Importing</a>';
		echo '</div>';
	}
}
add_action( 'admin_notices', 'import_admin_banner' );

/**
 * Enqueues CSS for the wp-admin/import.php Calypso import banner.
 */
function import_admin_banner_css() {
	if ( $GLOBALS['pagenow'] === 'import.php' ) {
		// Cache-bust the CSS file using the file modification time.
		$version = filemtime( plugin_dir_path( __FILE__ ) . 'css/import-customizations.css' );
		wp_enqueue_style( 'import_admin_banner_css', plugin_dir_url( __FILE__ ) . 'css/import-customizations.css', array(), $version );
	}
}
add_action( 'admin_enqueue_scripts', 'import_admin_banner_css' );
