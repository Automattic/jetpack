<?php
/**
 * Register the external media to both WP Admin and Editor.
 *
 * @package automattic/jetpack-external-media
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Status\Host;
use Jetpack_Options;

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
				'enqueue'    => true,
				'textdomain' => 'jetpack-external-media',
			)
		);

		wp_add_inline_script(
			$asset_name,
			sprintf( 'var JetpackExternalMediaData = %s;', wp_json_encode( self::get_data() ) ),
			'before'
		);

		Connection_Initial_State::render_script( $asset_name );
	}

	/**
	 * Get the initial state data.
	 *
	 * @return array
	 */
	private static function get_data() {
		$host = new Host();
		if ( $host->is_wpcom_simple() ) {
			$blog_id = get_current_blog_id();
		} else {
			$blog_id = Jetpack_Options::get_option( 'id', 0 );
		}

		$jetpack_ai_enabled = false;
		if ( $host->is_wpcom_simple() || $host->is_woa_site() ) {
			$jetpack_ai_enabled = true;
		}

		return array(
			'wpcomBlogId'    => $blog_id,
			'pluginBasePath' => plugins_url( '', Constants::get_constant( 'JETPACK__PLUGIN_FILE' ) ),
			'ai-assistant'   => array(
				'is-enabled' => apply_filters( 'jetpack_ai_enabled', $jetpack_ai_enabled ),
			),
		);
	}
}
