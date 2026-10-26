<?php
/**
 * Backup product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\My_Jetpack\Hybrid_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Automattic\Jetpack\Redirect;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class responsible for handling the Backup product
 */
class Backup extends Hybrid_Product {
	public const BACKUP_STATUS_TRANSIENT_KEY = 'my-jetpack-backup-status';

	public const PLAN_REFRESH_MISS_TRANSIENT_KEY = 'my-jetpack-backup-plan-refresh-miss';

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
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'backup';

	/**
	 * The category of the product
	 *
	 * @var string
	 */
	public static $category = 'security';

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
	 * Backup initialization
	 *
	 * @return void
	 */
	public static function register_endpoints(): void {
		parent::register_endpoints();
		// Get backup undo event
		register_rest_route(
			'my-jetpack/v1',
			'/site/backup/undo-event',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_backup_undo_event',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);
	}

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
		return __( 'Real-time backups save every change, and one-click restores get you back online quickly.', 'jetpack-my-jetpack' );
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
	 * Checks if the user has the correct permissions
	 */
	public static function permissions_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * This will fetch the last rewindable event from the Activity Log and
	 * the last rewind_id prior to that.
	 *
	 * @return array|WP_Error|null
	 */
	public static function get_site_backup_undo_event() {
		$blog_id = \Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/activity/rewindable?force=wpcom',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		$body = json_decode( $response['body'], true );

		if ( ! isset( $body['current'] ) ) {
			return null;
		}

		// Preparing the response structure
		$undo_event = array(
			'last_rewindable_event' => null,
			'undo_backup_id'        => null,
		);

		// List of events that will not be considered to be undo.
		// Basically we should not `undo` a full backup event, but we could
		// use them to undo any other action like plugin updates.
		$last_event_exceptions = array(
			'rewind__backup_only_complete_full',
			'rewind__backup_only_complete_initial',
			'rewind__backup_only_complete',
			'rewind__backup_complete_full',
			'rewind__backup_complete_initial',
			'rewind__backup_complete',
		);

		// Looping through the events to find the last rewindable event and the last backup_id.
		// The idea is to find the last rewindable event and then the last rewind_id before that.
		$found_last_event = false;
		foreach ( $body['current']['orderedItems'] as $event ) {
			if ( $event['is_rewindable'] ) {
				if ( ! $found_last_event && ! in_array( $event['name'], $last_event_exceptions, true ) ) {
					$undo_event['last_rewindable_event'] = $event;
					$found_last_event                    = true;
				} elseif ( $found_last_event ) {
					$undo_event['undo_backup_id'] = $event['rewind_id'];
					break;
				}
			}
		}

		return rest_ensure_response( $undo_event );
	}

	/**
	 * Hits the wpcom api to check rewind status.
	 *
	 * @todo Maybe add caching.
	 *
	 * @return object|WP_Error
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
	 * @return object|WP_Error
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
		$previous_backup_status = get_transient( self::BACKUP_STATUS_TRANSIENT_KEY );

		// If we have a previous backup status, show it.
		if ( ! empty( $previous_backup_status ) ) {
			return $previous_backup_status === 'no_errors' ? false : $previous_backup_status;
		}

		$backup_failed_status = false;
		// First check the status of Rewind for failure.
		$rewind_state = self::get_state_from_wpcom();
		if ( ! is_wp_error( $rewind_state ) ) {
			// Special case: 'unavailable' with 'site_new' reason is a normal provisioning state for brand new sites.
			$is_new_site_provisioning = ( 'unavailable' === $rewind_state->state &&
										'site_new' === ( $rewind_state->reason ?? '' ) );

			if (
				! in_array( $rewind_state->state, array( 'active', 'provisioning', 'awaiting_credentials' ), true ) &&
				! $is_new_site_provisioning
			) {
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

		if ( is_array( $backup_failed_status ) ) {
			set_transient( self::BACKUP_STATUS_TRANSIENT_KEY, $backup_failed_status, 5 * MINUTE_IN_SECONDS );
		} else {
			set_transient( self::BACKUP_STATUS_TRANSIENT_KEY, 'no_errors', HOUR_IN_SECONDS );
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
	 * Whether a plugin that can deliver Backup is on, which is all that matters where the plan decides Backup.
	 *
	 * @return bool
	 */
	public static function is_module_active() {
		if ( ! static::is_plan_driven() ) {
			return parent::is_module_active();
		}

		return static::is_standalone_plugin_active() || static::is_jetpack_plugin_active();
	}

	/**
	 * Whether the site's plan, not the backup module, decides Backup here.
	 *
	 * An older Jetpack plugin still opens its dashboard only while the module is on.
	 *
	 * @since 6.13.0
	 *
	 * @return bool
	 */
	public static function is_plan_driven() {
		return static::is_standalone_plugin_active()
			|| ! class_exists( 'Jetpack', false )
			|| defined( 'Jetpack::BACKUP_FOLLOWS_PLAN' );
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
			// The Jetpack plugin hosts the dashboard wherever it initialized the package, or will on
			// the next request when this one learned of the plan after Jetpack checked for it.
			if ( did_action( 'jetpack_backup_initialized' ) || ( static::is_plan_driven() && static::plan_opens_jetpack_dashboard() ) ) {
				return admin_url( 'admin.php?page=jetpack-backup' );
			}

			return Redirect::get_url( 'my-jetpack-manage-backup' );
		}
	}

	/**
	 * Whether the Jetpack plugin offers its bundled Backup dashboard, which Jetpack::configure_backup_package() asks.
	 *
	 * @since 6.13.0
	 *
	 * @return bool
	 */
	public static function offers_jetpack_dashboard() {
		return static::jetpack_can_host_dashboard() && static::has_plan_on_record();
	}

	/**
	 * Whether the Jetpack plugin could host the dashboard here, whatever the plan.
	 *
	 * @return bool
	 */
	private static function jetpack_can_host_dashboard() {
		$connection = new Connection_Manager();

		/** This filter is documented in projects/plugins/jetpack/class.jetpack.php */
		$connected = apply_filters( 'jetpack_is_connection_ready', $connection->is_connected(), $connection );

		// Not on multisite, which the Backup package does not support, or without a connected
		// owner, since buying and managing backups needs a linked account.
		if ( is_multisite() || ! $connected || ! $connection->has_connected_owner() ) {
			return false;
		}

		/** This filter is documented in projects/plugins/jetpack/class.jetpack.php */
		return (bool) apply_filters( 'jetpack_backup_dashboard_enabled', true );
	}

	/**
	 * Whether Manage opens the bundled dashboard, which is registered only once the stored plan includes Backup.
	 *
	 * @return bool
	 */
	private static function plan_opens_jetpack_dashboard() {
		if ( ! static::jetpack_can_host_dashboard() ) {
			return false;
		}

		if ( static::has_plan_on_record() ) {
			return true;
		}

		// Right after checkout WordPress.com knows of the plan before the stored copy does, so
		// catch that up rather than link to a page the next request would not register.
		if ( get_transient( self::PLAN_REFRESH_MISS_TRANSIENT_KEY ) || ! static::has_paid_plan_for_product() ) {
			return false;
		}

		// Refresh directly: the shared reload may already be spent on another product this request.
		Current_Plan::refresh_from_wpcom();

		if ( static::has_plan_on_record() ) {
			return true;
		}

		// The two can keep disagreeing, so a miss holds off the next refresh.
		set_transient( self::PLAN_REFRESH_MISS_TRANSIENT_KEY, true, 5 * MINUTE_IN_SECONDS );

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

	/**
	 * Whether the site's stored plan or products include Backup, current or expired, without asking WordPress.com.
	 *
	 * @since 6.13.0
	 *
	 * @return bool
	 */
	public static function has_plan_on_record() {
		$feature = static::$feature_identifying_paid_plan;
		$plan    = (array) get_option( Current_Plan::PLAN_OPTION, array() );

		// The stored plan lists the features of every current purchase, standalone products included.
		if ( in_array( $feature, (array) ( $plan['features']['active'] ?? array() ), true ) ) {
			return true;
		}

		// An expired bundle stays the stored plan without listing its features, so match its family by slug.
		$plan_slug = (string) ( $plan['product_slug'] ?? '' );
		foreach ( array( 'jetpack_starter_', 'jetpack_security_', 'jetpack_complete', 'jetpack_personal', 'jetpack_premium', 'jetpack_business' ) as $prefix ) {
			if ( str_starts_with( $plan_slug, $prefix ) ) {
				return true;
			}
		}

		foreach ( (array) Current_Plan::get_products() as $product ) {
			$slug = (string) ( ( (array) $product )['product_slug'] ?? '' );

			foreach ( static::get_paid_plan_product_slugs() as $paid_slug ) {
				if ( false !== strpos( $slug, $paid_slug ) ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Override the product status to return INACTIVE when backups are deactivated.
	 *
	 * @return string
	 */
	public static function get_status() {
		// Get the default status from parent.
		$status = parent::get_status();

		// Check if backups are deactivated (not an error, just manually turned off).
		$needs_attention = static::does_module_need_attention();
		if (
			is_array( $needs_attention ) &&
			isset( $needs_attention['data']['status'] ) &&
			'backups-deactivated' === $needs_attention['data']['status']
		) {
			// Preserve NEEDS_PLAN status - user must purchase before reactivating.
			if ( \Automattic\Jetpack\My_Jetpack\Products::STATUS_NEEDS_PLAN === $status ) {
				return $status;
			}

			return \Automattic\Jetpack\My_Jetpack\Products::STATUS_INACTIVE;
		}

		return $status;
	}
}
