<?php
/**
 * Stats Assets
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Assets;

/**
 * Class Odyssey_Config_Data
 *
 * @package automattic/jetpack-stats-admin
 */
class Odyssey_Assets {
	// This is a fixed list @see https://github.com/Automattic/wp-calypso/pull/71442/
	const JS_DEPENDENCIES = array( 'lodash', 'react', 'react-dom', 'wp-api-fetch', 'wp-components', 'wp-compose', 'wp-element', 'wp-html-entities', 'wp-i18n', 'wp-is-shallow-equal', 'wp-polyfill', 'wp-primitives', 'wp-url', 'wp-warning', 'moment' );
	// Sometimes custom scripts would strip the `ver` query params, so we need to make sure it doesn't by adding a custom version param `osv` here.
	const ODYSSEY_CDN_URL = 'https://widgets.wp.com/odyssey-stats/%s/%s?minify=false&osv=%s';

	/**
	 * We bump the asset version when the Jetpack back end is not compatible anymore.
	 */
	const ODYSSEY_STATS_VERSION                = 'v1';
	const ODYSSEY_STATS_CACHE_BUSTER_CACHE_KEY = 'odyssey_stats_admin_asset_cache_buster';

	/**
	 * Load the admin scripts.
	 *
	 * @param string $asset_handle The handle of the asset.
	 * @param string $asset_name The name of the asset.
	 * @param array  $options The options.
	 */
	public function load_admin_scripts( $asset_handle, $asset_name, $options = array() ) {
		$default_options = array(
			'config_data'          => ( new Odyssey_Config_Data() )->get_data(),
			'config_variable_name' => 'configData',
			'enqueue_css'          => true,
		);
		$options         = wp_parse_args( $options, $default_options );
		if ( file_exists( __DIR__ . "/../dist/{$asset_name}.js" ) ) {
			// Load local assets for the convinience of development.
			Assets::register_script(
				$asset_handle,
				"../dist/{$asset_name}.js",
				__FILE__,
				array(
					'in_footer'  => true,
					'textdomain' => 'jetpack-stats-admin',
				)
			);
			Assets::enqueue_script( $asset_handle );
		} else {
			// In production, we load the assets from our CDN.
			wp_register_script(
				$asset_handle,
				sprintf( self::ODYSSEY_CDN_URL, self::ODYSSEY_STATS_VERSION, "{$asset_name}.js", $this->get_cdn_asset_cache_buster() ),
				self::JS_DEPENDENCIES,
				$this->get_cdn_asset_cache_buster(),
				true
			);
			wp_enqueue_script( $asset_handle );

			// Enqueue CSS if needed.
			if ( $options['enqueue_css'] ) {
				$css_url    = $asset_name . ( is_rtl() ? '.rtl' : '' ) . '.css';
				$css_handle = $asset_handle . '-style';
				wp_register_style(
					$css_handle,
					sprintf( self::ODYSSEY_CDN_URL, self::ODYSSEY_STATS_VERSION, $css_url, $this->get_cdn_asset_cache_buster() ),
					array(),
					$this->get_cdn_asset_cache_buster()
				);
				wp_enqueue_style( $css_handle );
			}
		}

		wp_add_inline_script(
			$asset_handle,
			( new Odyssey_Config_Data() )->get_js_config_data( $options['config_variable_name'], $options['config_data'] ),
			'before'
		);
	}

	/**
	 * Returns cache buster string for assets.
	 * Development mode doesn't need this, as it's handled by `Assets` class.
	 *
	 * @return string
	 */
	protected function get_cdn_asset_cache_buster() {
		$now_in_ms = floor( microtime( true ) * 1000 );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['force_refresh'] ) ) {
			update_option( self::ODYSSEY_STATS_CACHE_BUSTER_CACHE_KEY, $this->get_cache_buster_option_value( $now_in_ms ), false );
		}

		// Use cached cache buster in production.
		$remote_asset_version = get_option( self::ODYSSEY_STATS_CACHE_BUSTER_CACHE_KEY );

		if ( ! empty( $remote_asset_version ) ) {
			$remote_asset_version = json_decode( $remote_asset_version, true );
			// If cache buster is cached and not expired (valid in 15 min), return it.
			if ( ! empty( $remote_asset_version['cache_buster'] ) && $remote_asset_version['cached_at'] > $now_in_ms - MINUTE_IN_SECONDS * 1000 * 15 ) {
				return $remote_asset_version['cache_buster'];
			}
		}

		// If no cached cache buster, we fetch it from CDN and set to transient.
		$response = wp_remote_get( sprintf( self::ODYSSEY_CDN_URL, self::ODYSSEY_STATS_VERSION, 'build_meta.json', $now_in_ms ), array( 'timeout' => 5 ) );

		if ( is_wp_error( $response ) ) {
			// fallback to current timestamp.
			return (string) $now_in_ms;
		}

		$build_meta = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! empty( $build_meta['cache_buster'] ) ) {
			// Cache the cache buster for 15 mins.
			update_option( self::ODYSSEY_STATS_CACHE_BUSTER_CACHE_KEY, $this->get_cache_buster_option_value( $build_meta['cache_buster'] ), false );
			return $build_meta['cache_buster'];
		}

		// fallback to current timestamp.
		return (string) $now_in_ms;
	}

	/**
	 * Get the cache buster option value.
	 *
	 * @param string|int|float $cache_buster The cache buster.
	 * @return string|false
	 */
	protected function get_cache_buster_option_value( $cache_buster ) {
		return wp_json_encode(
			array(
				'cache_buster' => (string) $cache_buster,
				'cached_at'    => floor( microtime( true ) * 1000 ), // milliseconds.
			)
		);
	}
}
