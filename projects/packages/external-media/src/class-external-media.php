<?php
/**
 * Register the external media to both WP Admin and Editor.
 *
 * @package automattic/jetpack-external-media
 */

namespace Automattic\Jetpack\External_Media;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Host;
use Jetpack_Options;

/**
 * Class External_Media
 */
class External_Media {
	const PACKAGE_VERSION = '0.3.7';
	const BASE_DIR        = __DIR__ . '/';
	const BASE_FILE       = __FILE__;

	/**
	 * Add hooks and filters.
	 */
	public static function init() {
		// Load external media import page on WordPress.com sites first.
		// We will continue to enable the feature on all sites.
		$host = new Host();
		if ( $host->is_wpcom_platform() ) {
			require_once __DIR__ . '/features/admin/external-media-import.php';
		}

		if ( is_admin() ) {
			// This loads assets in the editor iframe (block content) context
			add_action( 'enqueue_block_assets', array( __CLASS__, 'enqueue_block_editor_assets' ) );
		} else {
			// This loads assets specific to the editing interface like the block toolbar, as well as a front-end fallback.
			add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_block_editor_assets' ) );
		}
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
			self::BASE_FILE,
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
		if ( $host->is_wpcom_platform() ) {
			$jetpack_ai_enabled = true;
		}

		return array(
			'wpcomBlogId'         => $blog_id,
			'pluginBasePath'      => plugins_url( '', Constants::get_constant( 'JETPACK__PLUGIN_FILE' ) ),
			'ai-assistant'        => array(
				'is-enabled' => apply_filters( 'jetpack_ai_enabled', $jetpack_ai_enabled ),
			),
			'next40pxDefaultSize' => self::site_supports_next_default_size(),
		);
	}

	/**
	 * Check whether the environment supports the newer default size of elements, gradually introduced starting with WP 6.4.
	 *
	 * @since jetpack-14.0
	 *
	 * @see https://make.wordpress.org/core/2023/10/16/editor-components-updates-in-wordpress-6-4/#improving-size-consistency-for-ui-components
	 *
	 * @to-do: Deprecate this method and the logic around it when Jetpack requires WordPress 6.7.
	 *
	 * @return bool
	 */
	public static function site_supports_next_default_size() {
		/*
		 * If running a local dev build of gutenberg,
		 * let's assume it supports the newest changes included in Gutenberg.
		 */
		if ( defined( 'GUTENBERG_DEVELOPMENT_MODE' ) && GUTENBERG_DEVELOPMENT_MODE ) {
			return true;
		}

		// Let's now check if the Gutenberg plugin is installed on the site.
		if ( defined( 'GUTENBERG_VERSION' ) ) {
			return version_compare( (string) GUTENBERG_VERSION, '19.4', '>=' );
		}

		// Finally, let's check for the WordPress version.
		global $wp_version;
		if ( version_compare( $wp_version, '6.7', '>=' ) ) {
			return true;
		}

		// Final fallback.
		return false;
	}
}
