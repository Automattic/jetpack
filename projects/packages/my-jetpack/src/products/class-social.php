<?php
/**
 * Jetpack Social product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Hybrid_Product;
use Automattic\Jetpack\My_Jetpack\Products;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class responsible for handling the Social product
 */
class Social extends Hybrid_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'social';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'publicize';

	/**
	 * The slug of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_slug = 'jetpack-social';

	/**
	 * The category of the product
	 *
	 * @var string
	 */
	public static $category = 'growth';

	/**
	 * Social has a standalone plugin
	 *
	 * @var bool
	 */
	public static $has_standalone_plugin = true;

	/**
	 * The filename (id) of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_filename = array(
		'jetpack-social/jetpack-social.php',
		'social/jetpack-social.php',
		'jetpack-social-dev/jetpack-social.php',
	);

	/**
	 * Whether this product has a free offering
	 *
	 * @var bool
	 */
	public static $has_free_offering = true;

	/**
	 * The feature slug that identifies the paid plan
	 *
	 * @var string
	 */
	public static $feature_identifying_paid_plan = 'social-enhanced-publishing';

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'Social';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack Social';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Auto‑share your posts to social networks and track engagement in one place.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Grow your following by sharing your content across social media automatically.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Social features list
	 */
	public static function get_features() {
		return array(
			__( 'Post to social networks', 'jetpack-my-jetpack' ),
			__( 'Schedule publishing', 'jetpack-my-jetpack' ),
			__( 'Supports the major social networks', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the product pricing details
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		return array_merge(
			array(
				'available'          => true,
				'wpcom_product_slug' => static::get_wpcom_product_slug(),
			),
			Wpcom_Products::get_product_pricing( static::get_wpcom_product_slug() )
		);
	}

	/**
	 * Get the URL the user is taken after purchasing the product through the checkout
	 *
	 * @return ?string
	 */
	public static function get_post_checkout_url() {
		return self::get_manage_url();
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_social_v1_yearly';
	}

	/**
	 * Gets the 'status' of the Social product
	 *
	 * @return string
	 */
	public static function get_status() {
		$status = parent::get_status();
		if ( Products::STATUS_NEEDS_PLAN === $status ) {
			// If the status says that the site needs a plan,
			// My Jetpack shows "Learn more" CTA,
			// We want to instead show the "Activate" CTA.
			$status = Products::STATUS_NEEDS_ACTIVATION;
		}
		return $status;
	}

	/**
	 * Get the product-slugs of the paid plans for this product (not including bundles)
	 *
	 * @return array
	 */
	public static function get_paid_plan_product_slugs() {
		return array(
			'jetpack_social_v1_yearly',
			'jetpack_social_v1_monthly',
			'jetpack_social_v1_bi_yearly',
			'jetpack_social_basic_yearly',
			'jetpack_social_monthly',
			'jetpack_social_basic_monthly',
			'jetpack_social_basic_bi_yearly',
			'jetpack_social_advanced_yearly',
			'jetpack_social_advanced_monthly',
			'jetpack_social_advanced_bi_yearly',
		);
	}

	/**
	 * Checks whether the current plan (or purchases) of the site already supports the product
	 *
	 * @return boolean
	 */
	public static function has_paid_plan_for_product() {
		if ( parent::has_paid_plan_for_product() ) {
			return true;
		}

		// For atomic sites, do a feature check to see if the republicize feature is available
		// This feature is available by default on all Jetpack sites
		if ( ( new Host() )->is_woa_site() && static::does_site_have_feature( 'republicize' ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Get the URL where the user manages the product.
	 *
	 * @return string
	 */
	public static function get_manage_url() {
		return admin_url( 'admin.php?page=jetpack-social' );
	}

	/**
	 * Return product bundles list
	 * that supports the product.
	 *
	 * @return boolean|array Products bundle list.
	 */
	public static function is_upgradable_by_bundle() {
		return array( 'growth', 'complete' );
	}
}
