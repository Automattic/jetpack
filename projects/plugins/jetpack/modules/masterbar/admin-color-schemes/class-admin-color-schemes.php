<?php
/**
 * Unifies admin color scheme selection across WP.com sites.
 *
 * @deprecated 13.7 Use Automattic\Jetpack\Masterbar\Admin_Color_Schemes instead.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\Admin_Color_Schemes as Masterbar_Admin_Color_Schemes;

/**
 * Unifies admin color scheme selection across WP.com sites.
 */
class Admin_Color_Schemes {

	/**
	 * Instance of \Automattic\Jetpack\Masterbar\Admin_Color_Schemes
	 * Used for deprecation purposes.
	 *
	 * @var \Automattic\Jetpack\Masterbar\Admin_Color_Schemes
	 */
	private $admin_cs_wrapper;

	/**
	 * Admin_Color_Schemes constructor.
	 *
	 * @deprecated 13.7
	 */
	public function __construct() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Color_Schemes::__construct' );
		$this->admin_cs_wrapper = new Masterbar_Admin_Color_Schemes();
	}

	/**
	 * Makes admin_color available in users REST API endpoint.
	 *
	 * @deprecated 13.7
	 */
	public function register_admin_color_meta() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Color_Schemes::register_admin_color_meta' );
		$this->admin_cs_wrapper->register_admin_color_meta();
	}

	/**
	 * Permission callback to edit the `admin_color` user meta.
	 *
	 * @deprecated 13.7
	 *
	 * @param bool   $allowed   Whether the given user is allowed to edit this meta value.
	 * @param string $meta_key  Meta key. In this case `admin_color`.
	 * @param int    $object_id Queried user ID.
	 * @return bool
	 */
	public function update_admin_color_permissions_check( $allowed, $meta_key, $object_id ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Color_Schemes::update_admin_color_permissions_check' );
		return $this->admin_cs_wrapper->update_admin_color_permissions_check( $allowed, $meta_key, $object_id );
	}

	/**
	 * Get the admin color scheme URL based on the environment
	 *
	 * @deprecated 13.7
	 *
	 * @param string $color_scheme  The color scheme to get the URL for.
	 * @return string
	 */
	public function get_admin_color_scheme_url( $color_scheme ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Color_Schemes::get_admin_color_scheme_url' );
		return $this->admin_cs_wrapper->get_admin_color_scheme_url( $color_scheme );
	}

	/**
	 * Registers new admin color schemes
	 *
	 * @deprecated 13.7
	 */
	public function register_admin_color_schemes() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Color_Schemes::register_admin_color_schemes' );
		$this->admin_cs_wrapper->register_admin_color_schemes();
	}

	/**
	 * Enqueues current color-scheme overrides for core color schemes
	 *
	 * @deprecated 13.7
	 */
	public function enqueue_core_color_schemes_overrides() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Admin_Color_Schemes::enqueue_core_color_schemes_overrides' );
		$this->admin_cs_wrapper->enqueue_core_color_schemes_overrides();
	}
}
