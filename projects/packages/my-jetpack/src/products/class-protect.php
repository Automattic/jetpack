<?php
/**
 * Protect product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Hybrid_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Automattic\Jetpack\Protect_Status\Status as Protect_Status;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Waf\Waf_Runner;
use WP_Error;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

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
	 * Keys from Waf_Runner::get_config() that may be exposed to users without `manage_options`.
	 *
	 * My Jetpack is reachable with `edit_posts`, and the Protect card renders these two as
	 * on/off status indicators. Everything else the WAF config carries (IP allow/block lists,
	 * the bootstrap file path, data sharing settings) is administrator-only.
	 *
	 * @var string[]
	 */
	private const NON_ADMIN_WAF_CONFIG_KEYS = array(
		'jetpack_waf_automatic_rules',
		'brute_force_protection',
	);

	/**
	 * Status_Model properties that may be exposed to users without `manage_options`.
	 *
	 * My Jetpack is reachable with `edit_posts`, and the Protect card renders scan counts and the
	 * last scan time from these. The rest of the status report -- the scan state, the error
	 * details, the list of fixable threat IDs -- is administrator-only.
	 *
	 * @var string[]
	 */
	private const NON_ADMIN_SCAN_DATA_KEYS = array(
		'last_checked',
		'num_threats',
		'num_plugins_threats',
		'num_themes_threats',
		'threats',
		'plugins',
		'themes',
		'core',
		'files',
		'database',
	);

	/**
	 * Threat_Model properties that may be exposed to users without `manage_options`.
	 *
	 * The card counts threats and critical (severity >= 5) threats; it never renders a threat.
	 * Everything else a threat carries -- the infected file path, the surrounding source, the
	 * signature, the database table and the vulnerable extension version -- is administrator-only.
	 *
	 * @var string[]
	 */
	private const NON_ADMIN_THREAT_KEYS = array( 'severity' );

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'protect';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'protect';

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
	 * Defines whether or not to show a product interstitial as tiered pricing or not
	 *
	 * @var bool
	 */
	public static $is_tiered_pricing = true;

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
	 * Setup Protect REST API endpoints
	 *
	 * @return void
	 */
	public static function register_endpoints(): void {
		parent::register_endpoints();
		// Get Jetpack Protect data.
		register_rest_route(
			'my-jetpack/v1',
			'/site/protect/data',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_protect_data',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);
	}

	/**
	 * Checks if the user has the correct permissions
	 */
	public static function permissions_callback() {
		return current_user_can( 'edit_posts' );
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
				'name'  => __( 'Account protection', 'jetpack-my-jetpack' ),
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
		$scan_data             = Protect_Status::get_status();

		// Check if there are scan threats.
		$protect_data = $scan_data;
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
		if ( static::is_standalone_plugin_active() ) {
			// Protect admin dashboard.
			return admin_url( 'admin.php?page=jetpack-protect' );
		}

		if ( static::has_paid_plan_for_product() ) {
			// Paid users without standalone plugin go to Jetpack Cloud Scan dashboard.
			return Redirect::get_url( 'my-jetpack-manage-scan' );
		}

		// Free users without standalone plugin go to the Protect details page.
		return admin_url( 'admin.php?page=my-jetpack#/protect-details' );
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

	/**
	 * Return site Jetpack Protect data for the REST API.
	 *
	 * @return WP_Rest_Response|WP_Error
	 */
	public static function get_site_protect_data() {
		$scan_data = Protect_Status::get_status();

		$waf_config     = array();
		$waf_supported  = false;
		$is_waf_enabled = false;

		if ( class_exists( 'Automattic\Jetpack\Waf\Waf_Runner' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			$waf_config = Waf_Runner::get_config();
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			$is_waf_enabled = Waf_Runner::is_enabled();
			// @phan-suppress-next-line PhanUndeclaredClassMethod
			$waf_supported = Waf_Runner::is_supported_environment();
		}

		return rest_ensure_response(
			array(
				'scanData'  => self::filter_scan_data_by_capability( $scan_data ),
				'wafConfig' => array_merge(
					self::filter_waf_config_by_capability( $waf_config ),
					array(
						'waf_supported' => $waf_supported,
						'waf_enabled'   => $is_waf_enabled,
					),
					array( 'blocked_logins' => (int) get_site_option( 'jetpack_protect_blocked_attempts', 0 ) )
				),
			)
		);
	}

	/**
	 * Reduce the WAF configuration to the keys the current user is allowed to read.
	 *
	 * @param array $waf_config The WAF configuration as returned by Waf_Runner::get_config().
	 * @return array
	 */
	private static function filter_waf_config_by_capability( array $waf_config ) {
		if ( current_user_can( 'manage_options' ) ) {
			return $waf_config;
		}

		return array_intersect_key( $waf_config, array_flip( self::NON_ADMIN_WAF_CONFIG_KEYS ) );
	}

	/**
	 * Reduce the scan status to the parts the current user is allowed to read.
	 *
	 * @param \Automattic\Jetpack\Protect_Models\Status_Model $scan_data The scan status as returned by Protect_Status::get_status().
	 * @return \Automattic\Jetpack\Protect_Models\Status_Model|array
	 */
	private static function filter_scan_data_by_capability( $scan_data ) {
		if ( current_user_can( 'manage_options' ) ) {
			return $scan_data;
		}

		$filtered = array_intersect_key( (array) $scan_data, array_flip( self::NON_ADMIN_SCAN_DATA_KEYS ) );

		// `files` and `database` hold Threat_Model instances, not extensions.
		foreach ( array( 'threats', 'files', 'database' ) as $key ) {
			$filtered[ $key ] = array_map( array( __CLASS__, 'redact_threat' ), (array) ( $filtered[ $key ] ?? array() ) );
		}

		foreach ( array( 'plugins', 'themes' ) as $key ) {
			$filtered[ $key ] = array_map( array( __CLASS__, 'redact_extension' ), (array) ( $filtered[ $key ] ?? array() ) );
		}

		$filtered['core'] = self::redact_extension( $filtered['core'] ?? array() );

		return $filtered;
	}

	/**
	 * Reduce a threat to the properties a user without `manage_options` may read.
	 *
	 * @param object|array $threat A Threat_Model instance.
	 * @return array
	 */
	private static function redact_threat( $threat ) {
		return array_intersect_key( (array) $threat, array_flip( self::NON_ADMIN_THREAT_KEYS ) );
	}

	/**
	 * Reduce an extension to the properties a user without `manage_options` may read.
	 *
	 * Only the nested threats survive: the extension's name, slug and installed version identify
	 * which vulnerable software the site is running.
	 *
	 * @param object|array $extension An Extension_Model instance.
	 * @return array
	 */
	private static function redact_extension( $extension ) {
		$threats = ( (array) $extension )['threats'] ?? array();

		return array( 'threats' => array_map( array( __CLASS__, 'redact_threat' ), (array) $threats ) );
	}
}
