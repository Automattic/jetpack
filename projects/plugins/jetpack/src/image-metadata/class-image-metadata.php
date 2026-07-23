<?php
/**
 * Entry point for the Image Metadata provenance-preservation feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Loads AI-provenance metadata preservation for WordPress intermediate sizes.
 */
final class Image_Metadata {

	/**
	 * Register the single hook that drives metadata preservation.
	 *
	 * Called unconditionally on plugin load — independent of Jetpack connection
	 * or active-module state — because the whole point is to act when the Image
	 * CDN (Photon) is off.
	 *
	 * Registered at PHP_INT_MAX so it runs after other plugins that rewrite
	 * derivatives on this filter (image optimizers, WebP converters) and stamps
	 * the final bytes. An offloader that later replaces files via
	 * `wp_update_attachment_metadata` can still bypass us.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter(
			'wp_generate_attachment_metadata',
			array( Metadata_Preserver::class, 'preserve' ),
			PHP_INT_MAX,
			2
		);
	}
}
