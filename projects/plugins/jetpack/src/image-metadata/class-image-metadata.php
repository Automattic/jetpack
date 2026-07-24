<?php
/**
 * Image metadata preservation entry point.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Loads AI-provenance metadata preservation for WordPress intermediate sizes.
 */
final class Image_Metadata {

	/**
	 * Register preservation after other derivative filters.
	 *
	 * This runs independently of connection and module state.
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
