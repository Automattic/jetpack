<?php
/**
 * Jetpack Stats product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Initializer;
use Automattic\Jetpack\My_Jetpack\Module_Product;
use Automattic\Jetpack\My_jetpack\Products;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Automattic\Jetpack\Status\Host;
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
	 * The Plugin slug associated with stats
	 *
	 * @var string|null
	 */
	public static $plugin_slug = self::JETPACK_PLUGIN_SLUG;

	/**
	 * The Plugin file associated with stats
	 *
	 * @var string|null
	 */
	public static $plugin_filename = self::JETPACK_PLUGIN_FILENAME;

	/**
	 * Stats only requires site connection, not user connection
	 *
	 * @var bool
	 */
	public static $requires_user_connection = false;

	/**
	 * Stats does not have a standalone plugin (yet?)
	 *
	 * @var bool
	 */
	public static $has_standalone_plugin = false;

	/**
	 * Whether this product has a free offering
	 *
	 * @var bool
	 */
	public static $has_free_offering = true;

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'Stats';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack Stats';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'The simplest way to track visitor insights and unlock your site’s growth', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'With Jetpack Stats, you don’t need to be a data scientist to see how your site is performing, understand your visitors, and grow your site.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array CRM features list
	 */
	public static function get_features() {
		return array(
			__( 'Real-time data on visitors', 'jetpack-my-jetpack' ),
			__( 'Traffic stats and trends for post and pages', 'jetpack-my-jetpack' ),
			__( 'Detailed statistics about links leading to your site', 'jetpack-my-jetpack' ),
			__( 'GDPR compliant', 'jetpack-my-jetpack' ),
			__( 'Access to upcoming advanced features', 'jetpack-my-jetpack' ),
			__( 'Priority support', 'jetpack-my-jetpack' ),
			__( 'Commercial use', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the product pricing details
	 * Only showing the pricing details for the commercial product
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
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_stats_yearly';
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
	 * Gets the 'status' of the Stats product
	 *
	 * @return string
	 */
	public static function get_status() {
		$status = parent::get_status();
		if ( Products::STATUS_MODULE_DISABLED === $status && ! Initializer::is_registered() ) {
			// If the site has never been connected before, show the "Learn more" CTA,
			// that points to the add Stats product interstitial.
			$status = Products::STATUS_NEEDS_FIRST_SITE_CONNECTION;
		}
		return $status;
	}
	/**
	 * Checks whether the product can be upgraded to a different product.
	 * Stats Commercial plan (highest tier) & Jetpack Complete are not upgradable.
	 * Also we don't push PWYW users to upgrade.
	 *
	 * @return boolean
	 */
	public static function is_upgradable() {
		// For now, atomic sites with stats are not in a position to upgrade
		if ( ( new Host() )->is_woa_site() ) {
			return false;
		}

		$purchases_data = Wpcom_Products::get_site_current_purchases();
		if ( ! is_wp_error( $purchases_data ) && is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
			foreach ( $purchases_data as $purchase ) {
				// Jetpack complete includes Stats commercial & cannot be upgraded
				if ( str_starts_with( $purchase->product_slug, 'jetpack_complete' ) ) {
					return false;
				} elseif (
					// Stats commercial purchased with highest tier cannot be upgraded.
					in_array(
						$purchase->product_slug,
						array( 'jetpack_stats_yearly', 'jetpack_stats_monthly', 'jetpack_stats_bi_yearly' ),
						true
					) && $purchase->current_price_tier_slug === 'more_than_1m_views'
				) {
					return false;
				} elseif (
					// If user already has Stats PWYW, we won't push them to upgrade.
					$purchase->product_slug === 'jetpack_stats_pwyw_yearly'
				) {
					return false;
				}
			}
		}
		return true;
	}

	/**
	 * Checks if the site has a paid plan that supports this product
	 *
	 * @return boolean
	 */
	public static function has_paid_plan_for_product() {
		$purchases_data = Wpcom_Products::get_site_current_purchases();
		if ( is_wp_error( $purchases_data ) ) {
			return false;
		}
		if ( is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
			foreach ( $purchases_data as $purchase ) {
				// Stats is available as standalone product and as part of the Complete plan.
				if ( strpos( $purchase->product_slug, 'jetpack_stats' ) !== false || str_starts_with( $purchase->product_slug, 'jetpack_complete' ) ) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Returns a productType parameter for an upgrade URL, determining whether
	 * to show the PWYW upgrade interstitial or commercial upgrade interstitial.
	 *
	 * @return string
	 */
	public static function get_url_product_type() {
		$purchases_data     = Wpcom_Products::get_site_current_purchases();
		$is_commercial_site = Initializer::is_commercial_site();
		if ( is_wp_error( $purchases_data ) ) {
			return $is_commercial_site ? '&productType=commercial' : '';
		}
		if ( $is_commercial_site ) {
			return '&productType=commercial';
		}
		if ( is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
			foreach ( $purchases_data as $purchase ) {
				if (
					str_starts_with( $purchase->product_slug, static::get_wpcom_free_product_slug() )
				) {
					return '&productType=personal';
				} elseif (
					in_array(
						$purchase->product_slug,
						array( 'jetpack_stats_yearly', 'jetpack_stats_monthly', 'jetpack_stats_bi_yearly' ),
						true
					) &&
					! empty( $purchase->current_price_tier_slug )
				) {
					return '&productType=commercial';
				}
			}
		}
		return '';
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
			'%s#!/stats/purchase/%d?from=jetpack-my-jetpack%s&redirect_uri=%s',
			admin_url( 'admin.php?page=stats' ),
			Jetpack_Options::get_option( 'id' ),
			static::get_url_product_type(),
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
