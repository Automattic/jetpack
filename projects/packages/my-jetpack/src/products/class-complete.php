<?php
/**
 * Complete plan
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Module_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use WP_Error;

/**
 * Class responsible for handling the Complete plan
 */
class Complete extends Module_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'complete';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'complete';

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'Complete Bundle';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack Complete';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'The ultimate tool kit for best-in-class websites.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Get the full Jetpack suite with real-time security tools, improved site performance, and tools to grow your business.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 * Most of these are not translated as they are product names
	 *
	 * @return array Complete features list
	 */
	public static function get_features() {
		return array(
			'VaultPress Backup',
			'Scan',
			'Akismet Anti-spam',
			'VideoPress',
			'Boost',
			'Social',
			'Search',
			_x( 'Stats (100K site views, upgradeable)', 'Complete Product Feature', 'jetpack-my-jetpack' ),
			_x( 'CRM Entrepreneur', 'Complete Product Feature', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the product pricing details
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		$product_slug = static::get_wpcom_product_slug();
		return array_merge(
			array(
				'available'          => true,
				'wpcom_product_slug' => $product_slug,
			),
			Wpcom_Products::get_product_pricing( $product_slug )
		);
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_complete';
	}

	/**
	 * Checks whether the Jetpack module is active
	 *
	 * This is a bundle and not a product. We should not use this information for anything
	 *
	 * @return bool
	 */
	public static function is_module_active() {
		return false;
	}

	/**
	 * Activates the product by installing and activating its plugin
	 *
	 * @param WP_Error|bool $current_result Is the result of the top level activation actions. You probably won't do anything if it is an WP_Error.
	 * @return bool|\WP_Error
	 */
	public static function do_product_specific_activation( $current_result ) {
		$product_activation = parent::do_product_specific_activation( $current_result );

		// A bundle is not a module. There's nothing in the plugin to be activated, so it's ok to fail to activate the module.
		if ( is_wp_error( $product_activation ) && 'module_activation_failed' === $product_activation->get_error_code() ) {
			return $product_activation;
		}

		// At this point, Jetpack plugin is installed. Let's activate each individual product.
		$activation = Social::activate();
		if ( is_wp_error( $activation ) ) {
			return $activation;
		}

		$activation = Stats::activate();
		if ( is_wp_error( $activation ) ) {
			return $activation;
		}

		$activation = Anti_Spam::activate();
		if ( is_wp_error( $activation ) ) {
			return $activation;
		}

		$activation = Backup::activate();
		if ( is_wp_error( $activation ) ) {
			return $activation;
		}

		$activation = Scan::activate();
		if ( is_wp_error( $activation ) ) {
			return $activation;
		}

		$activation = Boost::activate();
		if ( is_wp_error( $activation ) ) {
			return $activation;
		}

		$activation = CRM::activate();
		if ( is_wp_error( $activation ) ) {
			return $activation;
		}

		$activation = Search::activate();
		if ( is_wp_error( $activation ) ) {
			return $activation;
		}

		$activation = VideoPress::activate();
		if ( is_wp_error( $activation ) ) {
			return $activation;
		}

		return $activation;
	}

	/**
	 * Checks whether the Product is active
	 *
	 * Security is a bundle and not a module. Activation takes place on WPCOM. So lets consider it active if jetpack is active and has the plan.
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return static::is_jetpack_plugin_active() && static::has_required_plan();
	}

	/**
	 * Checks whether the current plan (or purchases) of the site already supports the product
	 *
	 * @return boolean
	 */
	public static function has_required_plan() {
		$purchases_data = Wpcom_Products::get_site_current_purchases();
		if ( is_wp_error( $purchases_data ) ) {
			return false;
		}
		if ( is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
			foreach ( $purchases_data as $purchase ) {
				if ( str_starts_with( $purchase->product_slug, 'jetpack_complete' ) ) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Get the product-slugs of the paid plans for this product.
	 * (Do not include bundle plans, unless it's a bundle plan itself).
	 *
	 * @return array
	 */
	public static function get_paid_plan_product_slugs() {
		return array(
			'jetpack_complete',
			'jetpack_complete_monthly',
			'jetpack_complete_bi_yearly',
		);
	}

	/**
	 * Checks whether product is a bundle.
	 *
	 * @return boolean True
	 */
	public static function is_bundle_product() {
		return true;
	}

	/**
	 * Return all the products it contains.
	 *
	 * @return array Product slugs
	 */
	public static function get_supported_products() {
		return array(
			'anti-spam',
			'backup',
			'boost',
			'crm',
			'scan',
			'search',
			'social',
			'stats',
			'videopress',
		);
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return '';
	}
}
