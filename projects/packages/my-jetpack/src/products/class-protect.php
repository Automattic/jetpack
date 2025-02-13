<?php
/**
 * Protect product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Hybrid_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Automattic\Jetpack\Protect_Models\Status_Model;
use Automattic\Jetpack\Protect_Status\Status as Protect_Status;
use Automattic\Jetpack\Redirect;

/**
 * Class responsible for handling the Protect product
 */
class Protect extends Hybrid_Product {

	const FREE_TIER_SLUG             = 'free';
	const UPGRADED_TIER_SLUG         = 'upgraded';
	const UPGRADED_TIER_PRODUCT_SLUG = 'jetpack_scan';

	const SCAN_FEATURE_SLUG     = 'scan';
	const FIREWALL_FEATURE_SLUG = 'firewall';

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'protect';

	/**
	 * The filename (id) of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_filename = array(
		'jetpack-protect/jetpack-protect.php',
		'protect/jetpack-protect.php',
		'jetpack-protect-dev/jetpack-protect.php',
	);

	/**
	 * The slug of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_slug = 'jetpack-protect';

	/**
	 * The category of the product
	 *
	 * @var string
	 */
	public static $category = 'security';

	/**
	 * Whether this product requires a user connection
	 *
	 * @var string
	 */
	public static $requires_user_connection = false;

	/**
	 * Whether this product has a free offering
	 *
	 * @var bool
	 */
	public static $has_free_offering = true;

	/**
	 * Protect has a standalone plugin
	 *
	 * @var bool
	 */
	public static $has_standalone_plugin = true;

	/**
	 * The feature slug that identifies the paid plan
	 *
	 * @var string
	 */
	public static $feature_identifying_paid_plan = 'scan';

	/**
	 * Holds the scan data
	 *
	 * @var Status_Model
	 */
	private static $scan_data;

	/**
	 * Protect constructor.
	 */
	public static function initialize() {
		self::$scan_data = Protect_Status::get_status();
	}

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'Protect';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack Protect';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Guard against malware and bad actors 24/7', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Protect your site from bad actors and malware 24/7. Clean up security vulnerabilities with one click.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Protect features list
	 */
	public static function get_features() {
		return array(
			__( 'Over 20,000 listed vulnerabilities', 'jetpack-my-jetpack' ),
			__( 'Daily automatic scans', 'jetpack-my-jetpack' ),
			__( 'Check plugin and theme version status', 'jetpack-my-jetpack' ),
			__( 'Easy to navigate and use', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the product's available tiers
	 *
	 * @return string[] Slugs of the available tiers
	 */
	public static function get_tiers() {
		return array(
			self::UPGRADED_TIER_SLUG,
			self::FREE_TIER_SLUG,
		);
	}

	/**
	 * Get the normalized protect/scan data
	 *
	 * @return Status_Model
	 */
	public static function get_protect_data() {
		return self::$scan_data;
	}

	/**
	 * Get the internationalized comparison of free vs upgraded features
	 *
	 * @return array[] Protect features comparison
	 */
	public static function get_features_by_tier() {
		return array(
			array(
				'name'  => __( 'Scan for threats and vulnerabilities', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array(
						'included'    => true,
						'description' => __( 'Check items against database', 'jetpack-my-jetpack' ),
					),
					self::UPGRADED_TIER_SLUG => array(
						'included'    => true,
						'description' => __( 'Line by line malware scanning', 'jetpack-my-jetpack' ),
					),
				),
			),
			array(
				'name'  => __( 'Daily automated scans', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array(
						'included'    => true,
						'description' => __( 'Plus on-demand manual scans', 'jetpack-my-jetpack' ),
					),
				),
			),
			array(
				'name'  => __( 'Web Application Firewall', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array(
						'included'    => false,
						'description' => __( 'Manual rules only', 'jetpack-my-jetpack' ),
					),
					self::UPGRADED_TIER_SLUG => array(
						'included'    => true,
						'description' => __( 'Automatic protection and rule updates', 'jetpack-my-jetpack' ),
					),
				),
			),
			array(
				'name'  => __( 'Brute force protection', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Access to scan on Cloud', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'One-click auto fixes', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Notifications', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Severity labels', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
		);
	}

	/**
	 * Get the product pricing details
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		return array(
			'tiers' => array(
				self::FREE_TIER_SLUG     => array(
					'available' => true,
					'is_free'   => true,
				),
				self::UPGRADED_TIER_SLUG => array_merge(
					array(
						'available'          => true,
						'wpcom_product_slug' => self::UPGRADED_TIER_PRODUCT_SLUG,
					),
					Wpcom_Products::get_product_pricing( self::UPGRADED_TIER_PRODUCT_SLUG )
				),
			),
		);
	}

	/**
	 * Determines whether the module/plugin/product needs the users attention.
	 * Typically due to some sort of error where user troubleshooting is needed.
	 *
	 * @return boolean|array
	 */
	public static function does_module_need_attention() {
		$protect_threat_status = false;

		// Check if there are scan threats.
		$protect_data = self::$scan_data;
		if ( is_wp_error( $protect_data ) ) {
			return $protect_threat_status; // false
		}
		$critical_threat_count = false;
		if ( ! empty( $protect_data->threats ) ) {
			$critical_threat_count = array_reduce(
				$protect_data->threats,
				function ( $accum, $threat ) {
					return $threat->severity >= 5 ? ++$accum : $accum;
				},
				0
			);

			$protect_threat_status = array(
				'type' => $critical_threat_count ? 'error' : 'warning',
				'data' => array(
					'threat_count'          => count( $protect_data->threats ),
					'critical_threat_count' => $critical_threat_count,
					'fixable_threat_ids'    => $protect_data->fixable_threat_ids,
				),
			);
		}

		return $protect_threat_status;
	}

	/**
	 * Get the product-slugs of the paid plans for this product.
	 * (Do not include bundle plans, unless it's a bundle plan itself).
	 *
	 * @return array
	 */
	public static function get_paid_plan_product_slugs() {
		return array(
			'jetpack_scan',
			'jetpack_scan_monthly',
			'jetpack_scan_bi_yearly',
		);
	}

	/**
	 * Checks whether the product can be upgraded - i.e. this shows the /#add-protect interstitial
	 *
	 * @return boolean
	 */
	public static function is_upgradable() {
		return ! self::has_paid_plan_for_product();
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
	 * Get the URL the user is taken after purchasing the product through the checkout for each product feature
	 *
	 * @return ?array
	 */
	public static function get_post_checkout_urls_by_feature() {
		return array(
			self::SCAN_FEATURE_SLUG     => self::get_post_checkout_url(),
			self::FIREWALL_FEATURE_SLUG => admin_url( 'admin.php?page=jetpack-protect#/firewall' ),
		);
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		// check standalone first
		if ( static::is_standalone_plugin_active() ) {
			return admin_url( 'admin.php?page=jetpack-protect' );
			// otherwise, check for the main Jetpack plugin
		} elseif ( static::is_jetpack_plugin_active() ) {
			return Redirect::get_url( 'my-jetpack-manage-scan' );
		}
	}

	/**
	 * Get the URL where the user manages the product for each product feature
	 *
	 * @return ?array
	 */
	public static function get_manage_urls_by_feature() {
		return array(
			self::SCAN_FEATURE_SLUG     => self::get_manage_url(),
			self::FIREWALL_FEATURE_SLUG => admin_url( 'admin.php?page=jetpack-protect#/firewall' ),
		);
	}

	/**
	 * Return product bundles list
	 * that supports the product.
	 *
	 * @return array Products bundle list.
	 */
	public static function is_upgradable_by_bundle() {
		return array( 'security', 'complete' );
	}
}
