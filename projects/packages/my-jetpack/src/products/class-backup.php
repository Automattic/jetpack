<?php
/**
 * Backup product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\My_Jetpack\Hybrid_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Automattic\Jetpack\Redirect;
use WP_Error;

/**
 * Class responsible for handling the Backup product
 */
class Backup extends Hybrid_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'backup';

	/**
	 * The filename (id) of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_filename = array(
		'jetpack-backup/jetpack-backup.php',
		'backup/jetpack-backup.php',
		'jetpack-backup-dev/jetpack-backup.php',
	);

	/**
	 * The slug of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_slug = 'jetpack-backup';

	/**
	 * Backup has a standalone plugin
	 *
	 * @var bool
	 */
	public static $has_standalone_plugin = true;

	/**
	 * Whether this product has a free offering
	 *
	 * @var bool
	 */
	public static $has_free_offering = false;

	/**
	 * Whether this product requires a plan to work at all
	 *
	 * @var bool
	 */
	public static $requires_plan = true;

	/**
	 * The feature slug that identifies the paid plan
	 *
	 * @var string
	 */
	public static $feature_identifying_paid_plan = 'backups';

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'VaultPress Backup';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack VaultPress Backup';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		if ( static::is_active() ) {
			return __( 'Save every change', 'jetpack-my-jetpack' );
		}

		return __( 'Secure your site with automatic backups and one-click restores', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Never lose a word, image, page, or time worrying about your site with automated backups & one-click restores.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Backup features list
	 */
	public static function get_features() {
		return array(
			_x( 'Real-time cloud backups', 'Backup Product Feature', 'jetpack-my-jetpack' ),
			_x( '10GB of backup storage', 'Backup Product Feature', 'jetpack-my-jetpack' ),
			_x( '30-day archive & activity log*', 'Backup Product Feature', 'jetpack-my-jetpack' ),
			_x( 'One-click restores', 'Backup Product Feature', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get disclaimers corresponding to a feature
	 *
	 * @return array Backup disclaimers list
	 */
	public static function get_disclaimers() {
		return array(
			array(
				'text'      => _x( '* Subject to your usage and storage limit.', 'Backup Product Disclaimer', 'jetpack-my-jetpack' ),
				'link_text' => _x( 'Learn more', 'Backup Product Disclaimer', 'jetpack-my-jetpack' ),
				'url'       => Redirect::get_url( 'jetpack-faq-backup-disclaimer' ),
			),
		);
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_backup_t1_yearly';
	}

	/**
	 * Get the URL where the user should be redirected after checkout
	 */
	public static function get_post_checkout_url() {
		return self::get_manage_url();
	}

	/**
	 * Get the product princing details
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
	 * Hits the wpcom api to check rewind status.
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

		$site_id = \Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/rewind', $site_id ) . '?force=wpcom',
			'2',
			array( 'timeout' => 2 ),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			$status = new WP_Error( 'rewind_state_fetch_failed' );
			return $status;
		}

		$body   = wp_remote_retrieve_body( $response );
		$status = json_decode( $body );
		return $status;
	}

	/**
	 * Hits the wpcom api to retrieve the last 10 backup records.
	 *
	 * @return Object|WP_Error
	 */
	public static function get_latest_backups() {
		static $backups = null;

		if ( $backups !== null ) {
			return $backups;
		}

		$site_id  = \Jetpack_Options::get_option( 'id' );
		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/rewind/backups', $site_id ) . '?force=wpcom',
			'2',
			array( 'timeout' => 2 ),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			$backups = new WP_Error( 'rewind_backups_fetch_failed' );
			return $backups;
		}

		$body    = wp_remote_retrieve_body( $response );
		$backups = json_decode( $body );
		return $backups;
	}

	/**
	 * Determines whether the module/plugin/product needs the users attention.
	 * Typically due to some sort of error where user troubleshooting is needed.
	 *
	 * @return boolean|array
	 */
	public static function does_module_need_attention() {
		$backup_failed_status = false;
		// First check the status of Rewind for failure.
		$rewind_state = self::get_state_from_wpcom();
		if ( ! is_wp_error( $rewind_state ) ) {
			if ( $rewind_state->state !== 'active' && $rewind_state->state !== 'provisioning' && $rewind_state->state !== 'awaiting_credentials' ) {
				$backup_failed_status = array(
					'type' => 'error',
					'data' => array(
						'source'       => 'rewind',
						'status'       => isset( $rewind_state->reason ) && ! empty( $rewind_state->reason ) ? $rewind_state->reason : $rewind_state->state,
						'last_updated' => $rewind_state->last_updated,
					),
				);
			}
		}
		// Next check for a failed last backup.
		$latest_backups = self::get_latest_backups();
		if ( ! is_wp_error( $latest_backups ) ) {
			// Get the last/latest backup record.
			$last_backup = null;
			foreach ( $latest_backups as $backup ) {
				if ( $backup->is_backup ) {
					$last_backup = $backup;
					break;
				}
			}

			if ( $last_backup && isset( $last_backup->status ) ) {
				if ( $last_backup->status !== 'started' && ! preg_match( '/-will-retry$/', $last_backup->status ) && $last_backup->status !== 'finished' ) {
					$backup_failed_status = array(
						'type' => 'error',
						'data' => array(
							'source'       => 'last_backup',
							'status'       => $last_backup->status,
							'last_updated' => $last_backup->last_updated,
						),
					);
				}
			}
		}

		return $backup_failed_status;
	}

	/**
	 * Return product bundles list
	 * that supports the product.
	 *
	 * @return boolean|array Products bundle list.
	 */
	public static function is_upgradable_by_bundle() {
		return array( 'security', 'complete' );
	}

	/**
	 * Get the URL the user is taken after activating the product
	 *
	 * @return ?string
	 */
	public static function get_post_activation_url() {
		return ''; // stay in My Jetpack page or continue the purchase flow if needed.
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		// check standalone first
		if ( static::is_standalone_plugin_active() ) {
			return admin_url( 'admin.php?page=jetpack-backup' );
			// otherwise, check for the main Jetpack plugin
		} elseif ( static::is_jetpack_plugin_active() ) {
			return Redirect::get_url( 'my-jetpack-manage-backup' );
		}
	}

	/**
	 * Get the product-slugs of the paid plans for this product.
	 * (Do not include bundle plans, unless it's a bundle plan itself).
	 *
	 * @return array
	 */
	public static function get_paid_plan_product_slugs() {
		return array(
			'jetpack_backup_daily',
			'jetpack_backup_daily_monthly',
			'jetpack_backup_realtime',
			'jetpack_backup_realtime_monthly',
			'jetpack_backup_t1_yearly',
			'jetpack_backup_t1_monthly',
			'jetpack_backup_t1_bi_yearly',
			'jetpack_backup_t2_yearly',
			'jetpack_backup_t2_monthly',
			'jetpack_backup_t0_yearly',
			'jetpack_backup_t0_monthly',
		);
	}
}
