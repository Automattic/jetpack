<?php
/**
 * The Jetpack external media import page.
 *
 * Adds Jetpack external media page to Media > Import.
 *
 * @package automattic/jetpack-external-media
 */

namespace Automattic\Jetpack\External_Media;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Whether the current user is connected to WordPress.com.
 */
function is_current_user_connected() {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		return true;
	}

	return ( new Connection_Manager( 'jetpack' ) )->is_user_connected();
}

/**
 * Register the Jetpack external media page to Media > Import.
 */
function add_jetpack_external_media_import_page() {
	/**
	 * The feature is enabled only when the current user is connected to WordPress.com.
	 */
	if ( ! is_current_user_connected() ) {
		return;
	}

	$external_media_import_page_hook = add_submenu_page(
		'upload.php',
		__( 'Import Media', 'jetpack-external-media' ),
		__( 'Import Media', 'jetpack-external-media' ),
		'upload_files',
		'jetpack_external_media_import_page',
		__NAMESPACE__ . '\render_jetpack_external_media_import_page'
	);

	add_action( 'load-upload.php', __NAMESPACE__ . '\enqueue_jetpack_external_media_import_button' );
	add_action( "load-$external_media_import_page_hook", __NAMESPACE__ . '\enqueue_jetpack_external_media_import_page' );
}
add_action( 'admin_menu', __NAMESPACE__ . '\add_jetpack_external_media_import_page' );

/**
 * Enqueue the assets of the Jetpack external media import button.
 */
function enqueue_jetpack_external_media_import_button() {
	$assets_base_path = 'build/';
	$asset_name       = 'jetpack-external-media-import-button';

	Assets::register_script(
		$asset_name,
		$assets_base_path . "$asset_name/$asset_name.js",
		External_Media::BASE_FILE,
		array(
			'in_footer'  => true,
			'textdomain' => 'jetpack-external-media',
			'css_path'   => $assets_base_path . "$asset_name/$asset_name.css",
		)
	);

	Assets::enqueue_script( $asset_name );
	wp_localize_script(
		$asset_name,
		'JETPACK_EXTERNAL_MEDIA_IMPORT_BUTTON',
		array(
			'href' => admin_url( 'upload.php?page=jetpack_external_media_import_page' ),
		)
	);
}

/**
 * Enqueue the assets of the Jetpack external media page.
 */
function enqueue_jetpack_external_media_import_page() {
	$assets_base_path = 'build/';
	$asset_name       = 'jetpack-external-media-import-page';

	Assets::register_script(
		$asset_name,
		$assets_base_path . "$asset_name/$asset_name.js",
		External_Media::BASE_FILE,
		array(
			'in_footer'  => true,
			'textdomain' => 'jetpack-external-media',
		)
	);

	Assets::enqueue_script( $asset_name );
}

/**
 * Render the container of the Jetpack external media page.
 */
function render_jetpack_external_media_import_page() {
	$title                  = __( 'Import Media', 'jetpack-external-media' );
	$description            = __( 'WordPress allows you to import media from various platforms directly into the Media Library. To begin, select a platform from the options below:', 'jetpack-external-media' );
	$external_media_sources = array(
		array(
			'slug'        => 'google_photos',
			'name'        => __( 'Google Photos', 'jetpack-external-media' ),
			'description' => __( 'Import media from your Google Photos account.', 'jetpack-external-media' ),
		),
		array(
			'slug'        => 'pexels',
			'name'        => __( 'Pexels free photos', 'jetpack-external-media' ),
			'description' => __( 'Free stock photos, royalty free images shared by creators.', 'jetpack-external-media' ),
		),
		array(
			'slug'        => 'openverse',
			'name'        => __( 'Openverse', 'jetpack-external-media' ),
			'description' => __( 'Explore more than 800 million creative works.', 'jetpack-external-media' ),
		),
	);

	?>
	<div id="jetpack-external-media-import" class="wrap">
		<h1><?php echo esc_html( $title ); ?></h1>
		<div id="jetpack-external-media-import-notice"></div>
		<p><?php echo esc_html( $description ); ?></p>
		<table class="widefat importers striped">
			<?php
			foreach ( $external_media_sources as $external_media_source ) {
				$slug        = $external_media_source['slug'];
				$name        = $external_media_source['name'];
				$description = $external_media_source['description'];
				$action      = sprintf(
					'<a aria-label="%1$s" style="cursor:pointer;" data-slug="%2$s">%3$s</a>',
					/* translators: %s: The name of the external media source. */
					esc_attr( sprintf( __( 'Import %s', 'jetpack-external-media' ), $name ) ),
					esc_attr( $slug ),
					__( 'Import now', 'jetpack-external-media' )
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
		<div id="jetpack-external-media-import-modal"></div>
	</div>
	<?php
}
