<?php

namespace Automattic\Jetpack_Boost\Admin;

use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\Modules\Modules_Setup;
use Automattic\Jetpack_Boost\REST_API\Permissions\Nonce;

/**
 * Handle the configuration constants.
 *
 * This is a global state of Jetpack Boost and passed on to the front-end.
 */
class Config {

	public function init() {
		add_action( 'jetpack_boost_module_status_updated', array( $this, 'on_module_status_change' ), 10, 2 );
	}

	public function constants() {
		$optimizations = ( new Modules_Setup() )->get_status();
		$internal_path = apply_filters( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' );

		$constants = array(
			'version'       => JETPACK_BOOST_VERSION,
			'api'           => array(
				'namespace' => JETPACK_BOOST_REST_NAMESPACE,
				'prefix'    => JETPACK_BOOST_REST_PREFIX,
			),
			'optimizations' => $optimizations,
			'locale'        => get_locale(),
			'site'          => array(
				'domain'    => ( new Status() )->get_site_suffix(),
				'url'       => get_home_url(),
				'online'    => ! ( new Status() )->is_offline_mode(),
				'assetPath' => plugins_url( $internal_path, JETPACK_BOOST_PATH ),
				'isAtomic'  => ( new Host() )->is_woa_site(),
				'postTypes' => self::get_custom_post_types(),
			),
			'isPremium'     => Premium_Features::has_any(),
			'preferences'   => array(
				'prioritySupport' => Premium_Features::has_feature( Premium_Features::PRIORITY_SUPPORT ),
			),

			/**
			 * A bit of necessary magic,
			 * Explained more in the Nonce class.
			 *
			 * Nonces are automatically generated when registering routes.
			 */
			'nonces'        => Nonce::get_generated_nonces(),
		);

		// Give each module an opportunity to define extra constants.
		return apply_filters( 'jetpack_boost_js_constants', $constants );
	}

	/**
	 * Check for permissions.
	 *
	 * @return bool
	 */
	public function check_for_permissions() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Flag get started as complete if a module is enabled.
	 *
	 * @param string $module Module Slug.
	 * @param bool   $enabled Enabled status.
	 */
	public function on_module_status_change( $module, $status ) {
		if ( $status ) {
			self::set_getting_started( false );
		}
	}

	/**
	 * Enable of disable getting started page.
	 *
	 * If enabled, trying to open boost dashboard will take a user to the getting started page.
	 */
	public static function set_getting_started( $value ) {
		return \update_option( 'jb_get_started', $value, false );
	}

	/**
	 * Check if force redirect to getting started page is enabled.
	 */
	public static function is_getting_started() {
		// Aside from the boolean flag in the database, we also assume site already got started if they have premium features.
		return ! Premium_Features::has_feature( Premium_Features::CLOUD_CSS ) && ! ( new Status() )->is_offline_mode();
	}

	/**
	 * Clear the getting started option.
	 * @deprecated - This option is no longer used.
	 * We'll keep the value cleaning here for a while, but it should be removed in the future.
	 */
	public static function clear_getting_started() {
		\delete_option( 'jb_get_started' );
	}

	/**
	 * Retrieves custom post types.
	 *
	 * @return array Associative array of custom post types
	 * with their labels as keys and names as values.
	 */
	public static function get_custom_post_types() {
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
