<?php
/**
 * Register the external media to both WP Admin and Editor.
 *
 * @package automattic/jetpack-external-media
 */

namespace Automattic\Jetpack;

/**
 * Class External_Media
 */
class External_Media {
	const PACKAGE_VERSION = '0.1.0-alpha';
	const BASE_DIR        = __DIR__ . '/';
	const BASE_FILE       = __FILE__;

	/**
	 * Add hooks and filters.
	 */
	public static function init() {
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_block_editor_assets' ) );
	}

	/**
	 * Enqueue block editor assets.
	 */
	public static function enqueue_block_editor_assets() {
		$assets_base_path = 'build/';
		$asset_name       = 'jetpack-external-media-editor';

		Assets::register_script(
			$asset_name,
			$assets_base_path . "$asset_name/$asset_name.js",
			__FILE__,
			array(
				'enqueue'      => true,
				'textdomain'   => 'jetpack-external-media',

				/**
				 * It depends on the `jetpack-blocks-editor` since the feature requires `Jetpack_Editor_Initial_State`.
				 */
				'dependencies' => array( 'jetpack-blocks-editor' ),
			)
		);
	}
}
