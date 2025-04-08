<?php
/**
 * Export Media Files feature for WordPress.com sites.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Registers the Export Media Files admin page.
 */
function wpcom_register_export_media_files_page() {
	add_submenu_page(
		'tools.php',
		__( 'Export Media Files', 'jetpack-mu-wpcom' ),
		__( 'Export Media Files', 'jetpack-mu-wpcom' ),
		'export',
		'export-media-files',
		'wpcom_render_export_media_files_page'
	);
}
add_action( 'admin_menu', 'wpcom_register_export_media_files_page', 8 );

/**
 * Renders the Export Media Files admin page.
 */
function wpcom_render_export_media_files_page() {
	if ( ! current_user_can( 'export' ) ) {
		wp_die( esc_html__( 'Sorry, you are not allowed to export content for this site.', 'jetpack-mu-wpcom' ) );
	}

	// Get the site ID
	$site_id = get_current_blog_id();

	// Check if this is an Atomic site
	$is_atomic = ! ( defined( 'IS_WPCOM' ) && IS_WPCOM );

	// For Atomic sites, point to WordPress.com backup instead of wp-admin VaultPress
	if ( $is_atomic ) {
		// Get the site domain for the WordPress.com backup URL
		$site_domain = wp_parse_url( home_url(), PHP_URL_HOST );
		$backup_url  = 'https://wordpress.com/backup/' . $site_domain;
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Export Media Files', 'jetpack-mu-wpcom' ); ?></h1>
			<p><?php esc_html_e( 'Export your site’s media files and manage backups from Jetpack VaultPress Backup.', 'jetpack-mu-wpcom' ); ?></p>
			<a href="<?php echo esc_url( $backup_url ); ?>" class="button button-primary"><?php esc_html_e( 'Go to Backup', 'jetpack-mu-wpcom' ); ?></a>
		</div>
		<?php
		return;
	}

	// Load the WPCOM media export library
	require_once WP_CONTENT_DIR . '/lib/wpcom-media-export.php';

	// Get media export URL for Simple sites
	$media_export_url = wpcom_get_media_export_url( $site_id );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Export Media Files', 'jetpack-mu-wpcom' ); ?></h1>
		
		<?php if ( $media_export_url ) : ?>
			<p><?php esc_html_e( 'Download all the media library files (images, videos, audio, and documents) from your site.', 'jetpack-mu-wpcom' ); ?>
			<a href="https://wordpress.com/support/export/#exporting-media-library" target="_blank"><?php esc_html_e( 'Learn more', 'jetpack-mu-wpcom' ); ?></a></p>
						
			<p><a href="<?php echo esc_url( $media_export_url ); ?>" class="button button-primary"><?php esc_html_e( 'Download', 'jetpack-mu-wpcom' ); ?></a></p>
			
			<p><?php esc_html_e( 'To export your entire site content—including posts and pages—please use the', 'jetpack-mu-wpcom' ); ?> 
			<a href="<?php echo esc_url( admin_url( 'export.php' ) ); ?>"><?php esc_html_e( 'Export tool', 'jetpack-mu-wpcom' ); ?></a>.</p>
		<?php else : ?>
			<p><?php esc_html_e( 'Your site does not have any media files to export.', 'jetpack-mu-wpcom' ); ?></p>
		<?php endif; ?>
	</div>
	<?php
}