<?php

namespace Automattic\Jetpack_Boost\Admin;

use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * Handle the configuration constants.
 *
 * This is a global state of Jetpack Boost and passed on to the front-end.
 */
class Config {
	public function constants() {
		$internal_path = apply_filters( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' );

		$constants = array(
			'version'         => JETPACK_BOOST_VERSION,
			'pluginDirUrl'    => untrailingslashit( JETPACK_BOOST_PLUGINS_DIR_URL ),
			'assetPath'       => plugins_url( $internal_path, JETPACK_BOOST_PATH ),
			'canResizeImages' => wp_image_editor_supports( array( 'methods' => array( 'resize' ) ) ),
			'site'            => array(
				'url'      => get_home_url(),
				'domain'   => ( new Status() )->get_site_suffix(),
				'online'   => ! ( new Status() )->is_offline_mode(),
				'isAtomic' => ( new Host() )->is_woa_site(),
			),
			'api'             => array(
				'namespace' => JETPACK_BOOST_REST_NAMESPACE,
				'prefix'    => JETPACK_BOOST_REST_PREFIX,
			),
			'postTypes'       => (object) $this->get_custom_post_types(),
		);

		// Give each module an opportunity to define extra constants.
		return apply_filters( 'jetpack_boost_js_constants', $constants );
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
}
