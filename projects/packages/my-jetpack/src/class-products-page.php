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
	 * Whether the products-only interface should be shown.
	 *
	 * The wpcom "site has feature" lookup only exists on WordPress.com / Atomic sites, so its
	 * presence gates this to those sites (self-hosted sites are unaffected). Within them, sites
	 * that cannot manage modules get the products-only experience.
	 *
	 * @return bool
	 */
	public static function is_products_only_enabled() {
		if ( ! self::is_flag_enabled() || ! function_exists( 'wpcom_site_has_feature' ) ) {
			return false;
		}

		return ! wpcom_site_has_feature( self::MANAGE_MODULES_FEATURE );
	}
}
