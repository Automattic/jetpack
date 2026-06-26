<?php
/**
 * Gating logic for the flagged "products-only" My Jetpack interface.
 *
 * When enabled on WordPress.com Simple and Atomic sites that cannot manage Jetpack modules, the
 * My Jetpack admin page renders only the products grid (no tabs, no module toggles, no modules
 * footer link, and no onboarding redirect). Sites that can manage modules get the full My Jetpack.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Host;

/**
 * Computes whether the products-only mode is active.
 */
class Products_Page {

	/**
	 * Constant that turns the products-only mode on.
	 */
	const FLAG_CONSTANT = 'JETPACK_MY_JETPACK_PRODUCTS_ONLY';

	/**
	 * The wpcom feature that grants module management and the full My Jetpack experience
	 * (i.e. access to more than just the products grid).
	 */
	const MANAGE_MODULES_FEATURE = 'manage-plugins';

	/**
	 * Whether the products-only feature flag (constant) is set.
	 *
	 * @return bool
	 */
	private static function is_flag_enabled() {
		return Constants::is_true( self::FLAG_CONSTANT );
	}

	/**
	 * Whether this is a WordPress.com Simple or Atomic site.
	 *
	 * @return bool
	 */
	private static function is_wpcom_site() {
		$host = new Host();
		return $host->is_wpcom_simple() || $host->is_woa_site();
	}

	/**
	 * Whether the site can manage Jetpack modules (and so access more than just products).
	 *
	 * Uses the wpcom "site has feature" lookup, which only exists on WordPress.com / Atomic.
	 * Self-hosted sites (no such function) are unaffected by this feature.
	 *
	 * @return bool
	 */
	private static function can_manage_modules() {
		return function_exists( 'wpcom_site_has_feature' )
			&& wpcom_site_has_feature( self::MANAGE_MODULES_FEATURE );
	}

	/**
	 * Whether the products-only interface should be shown.
	 *
	 * True when the flag is on and the site is a Simple/Atomic site that cannot manage modules.
	 *
	 * @return bool
	 */
	public static function is_products_only_enabled() {
		return self::is_flag_enabled()
			&& self::is_wpcom_site()
			&& ! self::can_manage_modules();
	}
}
