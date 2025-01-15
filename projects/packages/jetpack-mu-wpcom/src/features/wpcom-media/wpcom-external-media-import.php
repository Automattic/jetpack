<?php
/**
 * WordPress.com media import page.
 *
 * Adds WordPress.com-specific external media page to WordPress Media > Import.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( empty( $_GET['wpcom_external_media_import_page'] ) ) { // phpcs:disable WordPress.Security.NonceVerification.Recommended
	return;
}

/**
 * Register the WordPress.com-specific external media page to Media > Import.
 */
function add_wpcom_external_media_import_page() {
	$wpcom_external_media_import_page_hook = add_submenu_page(
		'upload.php',
		__( 'Import Media', 'jetpack-mu-wpcom' ),
		__( 'Import Media', 'jetpack-mu-wpcom' ),
		'upload_files',
		'wpcom_external_media_import_page',
		'render_wpcom_external_media_import_page'
	);

	add_action( "load-$wpcom_external_media_import_page_hook", 'enqueue_wpcom_external_media_import_page' );
}
add_action( 'admin_menu', 'add_wpcom_external_media_import_page' );

/**
 * Enqueue the assets of the wpcom external media page.
 */
function enqueue_wpcom_external_media_import_page() {
	jetpack_mu_wpcom_enqueue_assets( 'wpcom-external-media-import-page', array( 'js' ) );
}

/**
 * Render the container of the wpcom external media page.
 */
function render_wpcom_external_media_import_page() {
	$title                  = __( 'Import Media', 'jetpack-mu-wpcom' );
	$description            = __( 'WordPress.com allows you to import media from various platforms directly into the Media Library. To begin, select a platform from the options below:', 'jetpack-mu-wpcom' );
	$external_media_sources = array(
		array(
			'id'          => 'google_photos',
			'name'        => __( 'Google Photos', 'jetpack-mu-wpcom' ),
			'description' => __( 'Import media from your Google Photos account.', 'jetpack-mu-wpcom' ),
		),
		array(
			'id'          => 'pexels',
			'name'        => __( 'Pexels free photos', 'jetpack-mu-wpcom' ),
			'description' => __( 'Free stock photos, royalty free images shared by creators.', 'jetpack-mu-wpcom' ),
		),
		array(
			'id'          => 'openverse',
			'name'        => __( 'Openverse', 'jetpack-mu-wpcom' ),
			'description' => __( 'Explore more than 800 million creative works.', 'jetpack-mu-wpcom' ),
		),
	);

	?>
	<div class="wrap">
		<h1><?php echo esc_html( $title ); ?></h1>
		<p><?php echo esc_html( $description ); ?></p>
		<table class="widefat importers striped">
			<?php
			foreach ( $external_media_sources as $external_media_source ) {
				$id          = $external_media_source['id'];
				$name        = $external_media_source['name'];
				$description = $external_media_source['description'];
				$action      = sprintf(
					'<a id="%1$s" aria-label="%2$s">%3$s</a>',
					esc_attr( $id ),
					/* translators: %s: The name of the external media source. */
					esc_attr( sprintf( __( 'Import %s', 'jetpack-mu-wpcom' ), $name ) ),
					__( 'Import now', 'jetpack-mu-wpcom' )
				);

				?>
				<tr class='importer-item'>
					<td class='import-system'>
						<span class='importer-title'><?php echo esc_html( $name ); ?></span>
						<span class='importer-action'>
							<?php echo $action; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- we escape things above. ?>
						</span>
					</td>
					<td class='desc'>
						<span class='importer-desc'><?php echo esc_html( $description ); ?></span>
					</td>
				</tr>
				<?php
			}
			?>
		</table>
	</div>
	<?php
}
