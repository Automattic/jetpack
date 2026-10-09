<?php
/**
 * Jetpack Pro bundle.
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

/**
 * Pro reuses Complete's product installation and activation.
 */
class Pro extends Complete {
	/**
	 * Product slug.
	 *
	 * @var string
	 */
	public static $slug = 'pro';

	/**
	 * Bundle module name.
	 *
	 * @var string
	 */
	public static $module_name = 'pro';

	/**
	 * Product name.
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'Pro Bundle';
	}

	/**
	 * Product title.
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack Pro';
	}

	/**
	 * Product description.
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Security, performance, and growth tools for your website.', 'jetpack-my-jetpack' );
	}

	/**
	 * Detailed product description.
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return static::get_description();
	}

	/**
	 * Included features and limits.
	 *
	 * @return string[]
	 */
	public static function get_features() {
		return array(
			__( 'VaultPress Backup (50GB, 30 days of history)', 'jetpack-my-jetpack' ),
			__( 'Activity Log (30 days of history)', 'jetpack-my-jetpack' ),
			'Scan',
			__( 'Akismet Anti-spam (10K calls per month)', 'jetpack-my-jetpack' ),
			__( 'Stats (50K site views per month)', 'jetpack-my-jetpack' ),
			__( 'Search (10K records and 10K requests per month)', 'jetpack-my-jetpack' ),
			__( 'VideoPress (1TB storage)', 'jetpack-my-jetpack' ),
			'Boost',
			'Social',
			'AI Assistant',
			_x( 'CRM Entrepreneur', 'Pro Product Feature', 'jetpack-my-jetpack' ),
			_x( 'Newsletter and monetization tools', 'Pro Product Feature', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Store slug for the default term.
	 *
	 * @return string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_pro_yearly';
	}

	/**
	 * Recognized subscription slugs, including billing-only monthly.
	 *
	 * @return string[]
	 */
	public static function get_paid_plan_product_slugs() {
		return array( 'jetpack_pro_yearly', 'jetpack_pro_bi_yearly', 'jetpack_pro_monthly' );
	}

	/**
	 * Keep Pro unavailable for new purchases.
	 *
	 * @return array
	 */
	public static function get_pricing_for_ui() {
		return array(
			'available'          => false,
			'wpcom_product_slug' => static::get_wpcom_product_slug(),
		);
	}

	/**
	 * Whether Pro or Complete covers this bundle.
	 *
	 * @return bool
	 */
	public static function has_required_plan() {
		return static::has_paid_plan_for_product() || Complete::has_required_plan();
	}
}
