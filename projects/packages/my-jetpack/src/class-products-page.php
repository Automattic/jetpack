<?php
/**
 * Gating logic for the flagged "products-only" My Jetpack interface.
 *
 * When enabled on WordPress.com Simple and Atomic sites, the My Jetpack admin page renders
 * only the products grid (no tabs). All signals are filterable so a mu-plugin can force the
 * site type / plan state for testing (e.g. on a Jurassic Ninja site).
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Host;

/**
 * Computes whether the products-only mode is active and how it should behave.
 */
class Products_Page {

	/**
	 * Constant that turns the products-only mode on.
	 */
	const FLAG_CONSTANT = 'JETPACK_MY_JETPACK_PRODUCTS_ONLY';

	/**
	 * The wpcom "site has feature" slug that identifies a business-class plan on Atomic.
	 *
	 * This is a best-guess default; the can_manage_modules() result is fully filterable so QA
	 * is not blocked on the exact slug.
	 */
	const BUSINESS_PLAN_FEATURE = 'install-plugins';

	/**
	 * Whether the products-only feature flag (constant) is set.
	 *
	 * @return bool
	 */
	public static function is_flag_enabled() {
		return Constants::is_true( self::FLAG_CONSTANT );
	}

	/**
	 * The site type relevant to this feature.
	 *
	 * @return string One of 'simple', 'atomic' or 'other'.
	 */
	public static function get_site_type() {
		$host = new Host();
		if ( $host->is_wpcom_simple() ) {
			$type = 'simple';
		} elseif ( $host->is_woa_site() ) {
			$type = 'atomic';
		} else {
			$type = 'other';
		}

		/**
		 * Filter the site type used by the My Jetpack products-only mode.
		 *
		 * Lets a mu-plugin force 'simple' or 'atomic' for testing.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $type One of 'simple', 'atomic' or 'other'.
		 */
		return apply_filters( 'my_jetpack_products_page_site_type', $type );
	}

	/**
	 * Whether the products-only interface should be shown.
	 *
	 * True when the flag is on and the site is Simple or Atomic.
	 *
	 * @return bool
	 */
	public static function is_products_only_enabled() {
		$enabled = self::is_flag_enabled()
			&& in_array( self::get_site_type(), array( 'simple', 'atomic' ), true );

		/**
		 * Filter whether the My Jetpack products-only mode is enabled.
		 *
		 * Lets a mu-plugin force the whole mode on or off (e.g. on a self-hosted test site).
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Whether the products-only mode is enabled.
		 */
		return (bool) apply_filters( 'my_jetpack_products_page_enabled', $enabled );
	}

	/**
	 * Whether module activate/deactivate toggles should be usable.
	 *
	 * Simple sites can never toggle modules. Atomic sites can only when they have a business
	 * plan. Any other host (the no-op case) keeps the default behavior.
	 *
	 * @return bool
	 */
	public static function can_manage_modules() {
		$type = self::get_site_type();
		if ( 'simple' === $type ) {
			$can = false;
		} elseif ( 'atomic' === $type ) {
			$can = Product::does_site_have_feature( self::BUSINESS_PLAN_FEATURE );
		} else {
			$can = true;
		}

		/**
		 * Filter whether module toggles are usable in the My Jetpack products-only mode.
		 *
		 * Lets a mu-plugin force the toggle capability for testing (business plan on/off).
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $can Whether module toggles should be rendered/usable.
		 */
		return (bool) apply_filters( 'my_jetpack_products_page_can_manage_modules', $can );
	}
}
