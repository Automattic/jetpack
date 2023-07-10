<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Handles fetching of the site's plan and products from WordPress.com and caching values locally.
 *
 * @deprecated 12.3 use Automattic\Jetpack\Current_Plan instead.
 *
 * Not to be confused with the `Jetpack_Plans` class (in `_inc/lib/plans.php`), which
 * fetches general information about all available plans from WordPress.com, side-effect free.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Current_Plan;

/**
 * Provides methods methods for fetching the site's plan and products from WordPress.com.
 */
class Jetpack_Plan {
	/**
	 * The name of the option that will store the site's plan.
	 *
	 * @deprecated 12.3 use Automattic\Jetpack\Current_Plan::PLAN_OPTION
	 *
	 * @var string
	 */
	const PLAN_OPTION = Current_Plan::PLAN_OPTION;

	/**
	 * The name of the option that will store the site's products.
	 *
	 * @deprecated 12.3 use Automattic\Jetpack\Current_Plan::SITE_PRODUCTS_OPTION
	 *
	 * @var string
	 */
	const SITE_PRODUCTS_OPTION = Current_Plan::SITE_PRODUCTS_OPTION;

	/**
	 * Array of products supported by each plan.
	 *
	 * @deprecated 12.3 use Automattic\Jetpack\Current_Plan::PLAN_DATA
	 *
	 * @var array
	 */
	const PLAN_DATA = Current_Plan::PLAN_DATA;

	/**
	 * Given a response to the `/sites/%d` endpoint, will parse the response and attempt to set the
	 * site's plan and products from the response.
	 *
	 * @deprecated 12.3 use Automattic\Jetpack\Current_Plan::update_from_sites_response instead.
	 *
	 * @param array $response The response from `/sites/%d`.
	 * @return bool Was the plan successfully updated?
	 */
	public static function update_from_sites_response( $response ) {
		_deprecated_function( __METHOD__, '12.3', 'Automattic\Jetpack\Current_Plan::update_from_sites_response' );

		return Current_Plan::update_from_sites_response( $response );
	}

	/**
	 * Make an API call to WordPress.com for plan status
	 *
	 * @deprecated 12.3 use Automattic\Jetpack\Current_Plan::refresh_from_wpcom instead.
	 *
	 * @access public
	 * @static
	 *
	 * @return bool True if plan is updated, false if no update
	 */
	public static function refresh_from_wpcom() {
		_deprecated_function( __METHOD__, '12.3', 'Automattic\Jetpack\Current_Plan::refresh_from_wpcom' );

		return Current_Plan::refresh_from_wpcom();
	}

	/**
	 * Get the plan that this Jetpack site is currently using.
	 *
	 * @deprecated 12.3 use Automattic\Jetpack\Current_Plan::get instead.
	 *
	 * @access public
	 * @static
	 *
	 * @return array Active Jetpack plan details
	 */
	public static function get() {
		_deprecated_function( __METHOD__, '12.3', 'Automattic\Jetpack\Current_Plan::get' );

		return Current_Plan::get();
	}

	/**
	 * Get the site's products.
	 *
	 * @deprecated 12.3 use Automattic\Jetpack\Current_Plan::get_products instead.
	 *
	 * @access public
	 * @static
	 *
	 * @return array Active Jetpack products
	 */
	public static function get_products() {
		_deprecated_function( __METHOD__, '12.3', 'Automattic\Jetpack\Current_Plan::get_products' );

		return Current_Plan::get_products();
	}

	/**
	 * Gets the minimum plan slug that supports the given feature
	 *
	 * @deprecated 12.3 use Automattic\Jetpack\Current_Plan::get_minimum_plan_for_feature instead.
	 *
	 * @param string $feature The name of the feature.
	 * @return string|bool The slug for the minimum plan that supports.
	 *  the feature or false if not found
	 */
	public static function get_minimum_plan_for_feature( $feature ) {
		_deprecated_function( __METHOD__, '12.3', 'Automattic\Jetpack\Current_Plan::get_minimum_plan_for_feature' );

		return Current_Plan::get_minimum_plan_for_feature( $feature );
	}

	/**
	 * Determine whether the active plan supports a particular feature
	 *
	 * @deprecated 12.3 use Automattic\Jetpack\Current_Plan::supports instead.
	 *
	 * @access public
	 * @static
	 *
	 * @param string $feature The module or feature to check.
	 *
	 * @return bool True if plan supports feature, false if not
	 */
	public static function supports( $feature ) {
		_deprecated_function( __METHOD__, '12.3', 'Automattic\Jetpack\Current_Plan::supports' );

		return Current_Plan::supports( $feature );
	}
}
