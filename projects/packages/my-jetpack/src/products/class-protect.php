<?php
/**
 * Protect product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\My_Jetpack\Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Jetpack_Options;
use WP_Error;

/**
 * Class responsible for handling the Protect product
 */
class Protect extends Product {

	const FREE_TIER_SLUG             = 'free';
	const UPGRADED_TIER_SLUG         = 'upgraded';
	const UPGRADED_TIER_PRODUCT_SLUG = 'jetpack_scan';

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
	 * Whether this product requires a user connection
	 *
	 * @var string
	 */
	public static $requires_user_connection = false;

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'Protect', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return __( 'Jetpack Protect', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Powerful, automated site security', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Protect your site and scan for security vulnerabilities listed in our database.', 'jetpack-my-jetpack' );
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
	 * Hits the wpcom api to check scan status.
	 *
	 * @todo Maybe add caching.
	 *
	 * @return Object|WP_Error
	 */
	private static function get_state_from_wpcom() {
		static $status = null;

		if ( $status !== null ) {
			return $status;
		}

		$site_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d/scan', $site_id ) . '?force=wpcom', '2', array( 'timeout' => 2 ), null, 'wpcom' );

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'scan_state_fetch_failed' );
		}

		$body   = wp_remote_retrieve_body( $response );
		$status = json_decode( $body );
		return $status;
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
	 * Checks if the site has a paid plan for the product
	 *
	 * @return bool
	 */
	public static function has_paid_plan_for_product() {
		$scan_data = static::get_state_from_wpcom();
		if ( is_wp_error( $scan_data ) ) {
			return false;
		}
		return is_object( $scan_data ) && isset( $scan_data->state ) && 'unavailable' !== $scan_data->state;
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return admin_url( 'admin.php?page=jetpack-protect' );
	}

	/**
	 * Return product bundles list
	 * that supports the product.
	 *
	 * @return array Products bundle list.
	 */
	public static function is_upgradable_by_bundle() {
		return array( 'security' );
	}
}
