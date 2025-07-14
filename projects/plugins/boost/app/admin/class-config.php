<?php

namespace Automattic\Jetpack_Boost\Admin;

use Automattic\Jetpack\Boost\App\Contracts\Is_Dev_Feature;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack_Boost\Lib\Cache_Compatibility;
use Automattic\Jetpack_Boost\Modules\Features_Index;

/**
 * Handle the configuration constants.
 *
 * This is a global state of Jetpack Boost and passed on to the front-end.
 */
class Config {
	public function constants() {
		/**
		 * Filters the internal path to the distributed assets used by the plugin
		 *
		 * @param string $path the path to the assets
		 *
		 * @since   1.0.0
		 */
		$internal_path = apply_filters( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' );

		$constants = array(
			'version'             => JETPACK_BOOST_VERSION,
			'pluginDirUrl'        => untrailingslashit( JETPACK_BOOST_PLUGINS_DIR_URL ),
			'assetPath'           => plugins_url( $internal_path, JETPACK_BOOST_PATH ),
			'canResizeImages'     => wp_image_editor_supports( array( 'methods' => array( 'resize' ) ) ),
			'site'                => array(
				'url'      => get_home_url(),
				'domain'   => ( new Status() )->get_site_suffix(),
				'online'   => self::is_website_public(),
				'host'     => $this->get_hosting_provider(),
				'hasCache' => Cache_Compatibility::has_cache(),
			),
			'api'                 => array(
				'namespace' => JETPACK_BOOST_REST_NAMESPACE,
				'prefix'    => JETPACK_BOOST_REST_PREFIX,
			),
			'postTypes'           => (object) $this->get_custom_post_types(),
			'developmentFeatures' => self::get_development_features(),
		);

		/**
		 * Filters the constants so each module can define extra ones
		 *
		 * @param array $constant The array of constants used by the plugin
		 *
		 * @since   1.0.0
		 */
		return apply_filters( 'jetpack_boost_js_constants', $constants );
	}

	/**
	 * Get a list of features that are marked as development features.
	 *
	 * @return array<string, bool> Slugs of features and their status.
	 */
	private static function get_development_features() {
		$features = Features_Index::get_all_features();

		$development_features = array();
		foreach ( $features as $feature ) {
			if ( is_subclass_of( $feature, Is_Dev_Feature::class ) ) {
				$development_features[] = ( new $feature() )->get_slug();
			}
		}

		return $development_features;
	}

	/**
	 * Retrieves custom post types.
	 *
	 * @return array Associative array of custom post types
	 * with their labels as keys and names as values.
	 */
	private static function get_custom_post_types() {
		$post_types = get_post_types(
			array(
				'public'   => true,
				'_builtin' => false,
			),
			false
		);
		unset( $post_types['attachment'] );

		$post_types = array_filter( $post_types, 'is_post_type_viewable' );

		return wp_list_pluck( $post_types, 'label', 'name' );
	}

	/**
	 * Retrieves the hosting provider.
	 * We're only interested in 'atomic' or 'woa' for now.
	 *
	 * @since 3.10.0
	 *
	 * @return string The hosting provider.
	 */
	public static function get_hosting_provider() {
		$host = new Host();

		if ( $host->is_woa_site() ) {
			return 'woa';
		}

		if ( $host->is_atomic_platform() ) {
			return 'atomic';
		}

		return 'other';
	}

	/**
	 * Checks if the website is publicly accessible.
	 *
	 * @return bool True if the website is public, false otherwise.
	 */
	public static function is_website_public() {
		return ! ( new Status() )->is_offline_mode() && ! ( new Status() )->is_private_site();
	}
}
