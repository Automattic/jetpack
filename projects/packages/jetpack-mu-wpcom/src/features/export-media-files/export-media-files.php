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

	// For Atomic sites, we recommend VaultPress
	if ( $is_atomic ) {
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Export Media Files', 'jetpack-mu-wpcom' ); ?></h1>
			<p><?php esc_html_e( 'For Business and eCommerce plans, we recommend using VaultPress Backup to export your media files.', 'jetpack-mu-wpcom' ); ?></p>
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=vaultpress' ) ); ?>" class="button"><?php esc_html_e( 'Go to VaultPress Backup', 'jetpack-mu-wpcom' ); ?></a>
		</div>
		<?php
		return;
	}

	// Get media export URL for Simple sites
	$media_export_url = function_exists( 'wpcom_get_media_export_url' ) ? wpcom_get_media_export_url( $site_id ) : false;
	$has_media_files  = function_exists( 'wpcom_site_has_media_files' ) ? wpcom_site_has_media_files( $site_id ) : false;
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Export Media Files', 'jetpack-mu-wpcom' ); ?></h1>
		
		<?php if ( $has_media_files && $media_export_url ) : ?>
			<p><?php esc_html_e( 'Download all the media library files (images, videos, audio, and documents) from your site.', 'jetpack-mu-wpcom' ); ?></p>
			
			<p class="description"><?php esc_html_e( 'Depending on your media library size and/or connection speed, you might need to use a download manager.', 'jetpack-mu-wpcom' ); ?> 
			<a href="https://wordpress.com/support/export/#exporting-media-library" target="_blank"><?php esc_html_e( 'Learn more', 'jetpack-mu-wpcom' ); ?></a>.</p>
			
			<p><a href="<?php echo esc_url( $media_export_url ); ?>" class="button button-primary"><?php esc_html_e( 'Download', 'jetpack-mu-wpcom' ); ?></a></p>
			
			<p><?php esc_html_e( 'To export your entire site content—including posts and pages—please use the', 'jetpack-mu-wpcom' ); ?> 
			<a href="<?php echo esc_url( admin_url( 'export.php' ) ); ?>"><?php esc_html_e( 'Export tool', 'jetpack-mu-wpcom' ); ?></a>.</p>
		<?php elseif ( ! $has_media_files ) : ?>
			<p><?php esc_html_e( 'Your site does not have any media files to export.', 'jetpack-mu-wpcom' ); ?></p>
		<?php else : ?>
			<p><?php esc_html_e( 'Unable to generate media export URL. Please try again later.', 'jetpack-mu-wpcom' ); ?></p>
		<?php endif; ?>
	</div>
	<?php
}