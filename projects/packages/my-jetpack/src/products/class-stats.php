<?php
/**
 * Jetpack Stats product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Module_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Jetpack_Options;

/**
 * Class responsible for handling the Jetpack Stats product
 */
class Stats extends Module_Product {
	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'stats';

	/**
	 * The Jetpack module name associated with this product
	 *
	 * @var string|null
	 */
	public static $module_name = 'stats';

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'Stats', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return __( 'Jetpack Stats', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Simple, yet powerful analytics', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'With Jetpack Stats, you don’t need to be a data scientist to see how your site is performing.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array CRM features list
	 */
	public static function get_features() {
		return array(
			__( 'Instant access to upcoming features', 'jetpack-my-jetpack' ),
			__( 'Priority support', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the product princing details
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		return array_merge(
			array(
				'available'               => true,
				'wpcom_product_slug'      => static::get_wpcom_product_slug(),
				'wpcom_free_product_slug' => static::get_wpcom_free_product_slug(),
				'wpcom_pwyw_product_slug' => static::get_wpcom_pwyw_product_slug(),
			),
			// TODO: replace with `Wpcom_Products::get_product_pricing` once available.
			// This is not yet used anywhere, so it's fine to leave it as is for now.
			array(
				'currency_code'  => 'USD',
				'full_price'     => 10,
				'discount_price' => 10,
				'product_term'   => 'month',
			)
		);
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_stats_monthly';
	}

	/**
	 * Get the WPCOM Pay Whatever You Want product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_pwyw_product_slug() {
		return 'jetpack_stats_pwyw_yearly';
	}

	/**
	 * Get the WPCOM free product slug
	 *
	 * @return ?string
	 */
	public static function get_wpcom_free_product_slug() {
		return 'jetpack_stats_free_yearly';
	}

	/**
	 * Checks whether the site already supports this product through an existing plan or purchase
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
				if ( 0 === strpos( $purchase->product_slug, 'jetpack_stats' ) ) {
					return true;
				}
				if ( 0 === strpos( $purchase->product_slug, 'jetpack_complete' ) ) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Checks whether the product can be upgraded to a different product.
	 * Only Jetpack Stats Commercial plan is not upgradable.
	 *
	 * @return boolean
	 */
	public static function is_upgradable() {
		$purchases_data = Wpcom_Products::get_site_current_purchases();
		if ( is_wp_error( $purchases_data ) ) {
			return false;
		}
		if ( is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
			foreach ( $purchases_data as $purchase ) {
				if (
					(
						// Purchase is Jetpack Stats...
						0 === strpos( $purchase->product_slug, 'jetpack_stats' ) &&
						// but not Jetpack Stats Free...
						false === strpos( $purchase->product_slug, 'free' )
					) || 0 === strpos( $purchase->product_slug, 'jetpack_complete' )
				) {
					// Only Jetpack Stats paid plans should be eligible for this conditional.
					// Sample product slugs: jetpack_stats_monthly
					return false;
				}
			}
		}
		return true;
	}

	/**
	 * Checks whether the product supports trial or not.
	 * Since Jetpack Stats has been widely available as a free product in the past, it "supports" a trial.
	 *
	 * @return boolean
	 */
	public static function has_trial_support() {
		return true;
	}

	/**
	 * Get the WordPress.com URL for purchasing Jetpack Stats for the current site.
	 *
	 * @return ?string
	 */
	public static function get_purchase_url() {
		// The returning URL could be customized by changing the `redirect_uri` param with relative path.
		return sprintf(
			'%s#!/stats/purchase/%d?from=jetpack-my-jetpack&redirect_uri=%s',
			admin_url( 'admin.php?page=stats' ),
			Jetpack_Options::get_option( 'id' ),
			rawurlencode( 'admin.php?page=stats' )
		);
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return admin_url( 'admin.php?page=stats' );
	}
}
