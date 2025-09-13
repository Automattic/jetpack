<?php
/**
 * Sets up the Red Bubble Notifications rest api endpoint and helper functions
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Registers REST route for getting red bubble notification data
 * and includes all helper functions related to red bubble notifications
 */
class Red_Bubble_Notifications {
	private const MISSING_CONNECTION_NOTIFICATION_KEY = 'missing-connection';
	private const MY_JETPACK_RED_BUBBLE_TRANSIENT_KEY = 'my-jetpack-red-bubble-transient';

	/**
	 * Summary of register_rest_routes
	 *
	 * @return void
	 */
	public static function register_rest_endpoints() {
		register_rest_route(
			'my-jetpack/v1',
			'red-bubble-notifications',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => __CLASS__ . '::rest_api_get_red_bubble_alerts',
				'permission_callback' => __CLASS__ . '::permissions_callback',
				'args'                => array(
					'dismissal_cookies' => array(
						'type'              => 'array',
						'description'       => 'Array of dismissal cookies to set for the red bubble notifications.',
						'required'          => false,
						'items'             => array(
							'type' => 'string',
						),
						'sanitize_callback' => function ( $param ) {
							return array_map( 'sanitize_text_field', $param );
						},
					),
				),
			)
		);
	}

	/**
	 * Check user capability to access the endpoint.
	 *
	 * @access public
	 * @static
	 *
	 * @return true|WP_Error
	 */
	public static function permissions_callback() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Gets the plugins that need installed or activated for each paid plan.
	 *
	 * @return array
	 */
	public static function get_paid_plans_plugins_requirements() {
		$plugin_requirements = array();
		foreach ( Products::get_products_classes() as $slug => $product_class ) {
			// Skip these- we don't show them in My Jetpack.
			if ( in_array( $slug, Products::get_not_shown_products(), true ) ) {
				continue;
			}
			// Skip CRM from installation requirements - e.g. don't enforce installation for Complete plan users
			if ( $slug === 'crm' ) {
				continue;
			}
			if ( ! $product_class::has_paid_plan_for_product() ) {
				continue;
			}
			$purchase = $product_class::get_paid_plan_purchase_for_product();
			if ( ! $purchase ) {
				continue;
			}
			// Check if required plugin needs installed or activated.
			if ( ! $product_class::is_plugin_installed() ) {
				// Plugin needs installed (and activated)
				$plugin_requirements[ $purchase->product_slug ]['needs_installed'][] = $product_class::$slug;
			} elseif ( ! $product_class::is_plugin_active() ) {
				// Plugin is installed, but not activated.
				$plugin_requirements[ $purchase->product_slug ]['needs_activated_only'][] = $product_class::$slug;
			}
		}

		return $plugin_requirements;
	}

	/**
	 * Check for features broken by a disconnected user or site
	 *
	 * @return array
	 */
	public static function check_for_broken_modules() {
		$connection        = new Connection_Manager();
		$is_user_connected = $connection->is_user_connected() || $connection->has_connected_owner();
		$is_site_connected = $connection->is_connected();
		$broken_modules    = array(
			'needs_site_connection' => array(),
			'needs_user_connection' => array(),
		);

		if ( $is_user_connected && $is_site_connected ) {
			return $broken_modules;
		}

		$products                    = Products::get_products_classes();
		$historically_active_modules = Jetpack_Options::get_option( 'historically_active_modules', array() );

		foreach ( $products as $product ) {
			if ( ! in_array( $product::$slug, $historically_active_modules, true ) ) {
				continue;
			}

			if ( $product::$requires_user_connection && ! $is_user_connected ) {
				if ( ! in_array( $product::$slug, $broken_modules['needs_user_connection'], true ) ) {
					$broken_modules['needs_user_connection'][] = $product::$slug;
				}
			} elseif ( ! $is_site_connected ) {
				if ( ! in_array( $product::$slug, $broken_modules['needs_site_connection'], true ) ) {
					$broken_modules['needs_site_connection'][] = $product::$slug;
				}
			}
		}

		return $broken_modules;
	}

	/**
	 * Add an alert slug if the site is missing a site connection
	 *
	 * @param array $red_bubble_slugs - slugs that describe the reasons the red bubble is showing.
	 * @return array
	 */
	public static function alert_if_missing_connection( array $red_bubble_slugs ) {
		$broken_modules = self::check_for_broken_modules();
		$connection     = new Connection_Manager();

		// Checking for site connection issues first.
		if ( ! empty( $broken_modules['needs_site_connection'] ) ) {
			$red_bubble_slugs[ self::MISSING_CONNECTION_NOTIFICATION_KEY ] = array(
				'type'     => 'site',
				'is_error' => true,
			);
			return $red_bubble_slugs;
		}

		if ( ! empty( $broken_modules['needs_user_connection'] ) ) {
			$red_bubble_slugs[ self::MISSING_CONNECTION_NOTIFICATION_KEY ] = array(
				'type'     => 'user',
				'is_error' => true,
			);
			return $red_bubble_slugs;
		}

		if ( ! $connection->is_connected() ) {
			$red_bubble_slugs[ self::MISSING_CONNECTION_NOTIFICATION_KEY ] = array(
				'type'     => 'site',
				'is_error' => false,
			);
			return $red_bubble_slugs;
		}

		return $red_bubble_slugs;
	}

	/**
	 * Add an alert slug if Backups are failing or having an issue.
	 *
	 * @param array $red_bubble_slugs - slugs that describe the reasons the red bubble is showing.
	 * @return array
	 */
	public static function alert_if_last_backup_failed( array $red_bubble_slugs ) {
		// Make sure the Notice wasn't previously dismissed.
		if ( ! empty( $_COOKIE['backup_failure_dismissed'] ) ) {
			return $red_bubble_slugs;
		}
		// Make sure there's a Backup paid plan
		if ( ! Products\Backup::is_plugin_active() || ! Products\Backup::has_paid_plan_for_product() ) {
			return $red_bubble_slugs;
		}
		// Make sure the plan isn't just recently purchased in last 30min.
		// Give some time to queue & run the first backup.
		$purchase = Products\Backup::get_paid_plan_purchase_for_product();
		if ( $purchase ) {
			$thirty_minutes_after_plan_purchase = strtotime( $purchase->subscribed_date . ' +30 minutes' );
			if ( strtotime( 'now' ) < $thirty_minutes_after_plan_purchase ) {
				return $red_bubble_slugs;
			}
		}

		$backup_failed_status = Products\Backup::does_module_need_attention();
		if ( $backup_failed_status ) {
			$red_bubble_slugs['backup_failure'] = $backup_failed_status;
		}

		return $red_bubble_slugs;
	}

	/**
	 * Add an alert slug if Protect has scan threats/vulnerabilities.
	 *
	 * @param array $red_bubble_slugs - slugs that describe the reasons the red bubble is showing.
	 * @return array
	 */
	public static function alert_if_protect_has_threats( array $red_bubble_slugs ) {
		// Make sure the Notice hasn't been dismissed.
		if ( ! empty( $_COOKIE['protect_threats_detected_dismissed'] ) ) {
			return $red_bubble_slugs;
		}
		// Make sure we're dealing with the Protect product only
		if ( ! Products\Protect::has_paid_plan_for_product() ) {
			return $red_bubble_slugs;
		}

		$protect_threats_status = Products\Protect::does_module_need_attention();

		if ( $protect_threats_status ) {
			$red_bubble_slugs['protect_has_threats'] = $protect_threats_status;
		}

		return $red_bubble_slugs;
	}

	/**
	 * Add an alert slug if any paid plan/products are expiring or expired.
	 *
	 * @param array $red_bubble_slugs - slugs that describe the reasons the red bubble is showing.
	 * @return array
	 */
	public static function alert_if_paid_plan_expiring( array $red_bubble_slugs ) {
		$connection = new Connection_Manager();
		if ( ! $connection->is_connected() ) {
			return $red_bubble_slugs;
		}
		$product_classes = Products::get_products_classes();

		$products_included_in_expiring_plan = array();
		foreach ( $product_classes as $key => $product ) {
			// Skip these- we don't show them in My Jetpack.
			if ( in_array( $key, Products::get_not_shown_products(), true ) ) {
				continue;
			}

			if ( $product::has_paid_plan_for_product() ) {
				$purchase = $product::get_paid_plan_purchase_for_product();
				if ( $purchase ) {
					// Check if this product is covered by an active bundle plan
					$is_covered_by_active_bundle = false;
					if ( ! $product::is_bundle_product() ) {
						foreach ( $product_classes as $bundle_product ) {
							if ( $bundle_product::is_bundle_product() &&
								$bundle_product::has_paid_plan_for_product() &&
								! $bundle_product::is_paid_plan_expired() &&
								method_exists( $bundle_product, 'get_supported_products' ) &&
								in_array( $key, $bundle_product::get_supported_products(), true ) ) {
								$is_covered_by_active_bundle = true;
								break;
							}
						}
					}

					// Only show expiration alerts if not covered by an active bundle
					if ( ! $is_covered_by_active_bundle ) {
						$redbubble_notice_data = array(
							'product_slug'   => $purchase->product_slug,
							'product_name'   => $purchase->product_name,
							'expiry_date'    => $purchase->expiry_date,
							'expiry_message' => $purchase->expiry_message,
							'manage_url'     => $product::get_manage_paid_plan_purchase_url(),
						);

						if ( $product::is_paid_plan_expired() && empty( $_COOKIE[ "$purchase->product_slug--plan_expired_dismissed" ] ) ) {
							$red_bubble_slugs[ "$purchase->product_slug--plan_expired" ] = $redbubble_notice_data;
							if ( ! $product::is_bundle_product() ) {
								$products_included_in_expiring_plan[ "$purchase->product_slug--plan_expired" ][] = $product::get_name();
							}
						}
						if ( $product::is_paid_plan_expiring() && empty( $_COOKIE[ "$purchase->product_slug--plan_expiring_soon_dismissed" ] ) ) {
							$red_bubble_slugs[ "$purchase->product_slug--plan_expiring_soon" ]               = $redbubble_notice_data;
							$red_bubble_slugs[ "$purchase->product_slug--plan_expiring_soon" ]['manage_url'] = $product::get_renew_paid_plan_purchase_url();
							if ( ! $product::is_bundle_product() ) {
								$products_included_in_expiring_plan[ "$purchase->product_slug--plan_expiring_soon" ][] = $product::get_name();
							}
						}
					}
				}
			}
		}

		foreach ( $products_included_in_expiring_plan as $expiring_plan => $products ) {
			$red_bubble_slugs[ $expiring_plan ]['products_effected'] = $products;
		}

		return $red_bubble_slugs;
	}

	/**
	 * Add an alert slug if a site's paid plan requires a plugin install and/or activation.
	 *
	 * @param array $red_bubble_slugs - slugs that describe the reasons the red bubble is showing.
	 * @return array
	 */
	public static function alert_if_paid_plan_requires_plugin_install_or_activation( array $red_bubble_slugs ) {
		$connection = new Connection_Manager();
		// Don't trigger red bubble (and show notice) when the site is not connected or if the
		// user doesn't have plugin installation/activation permissions.
		if ( ! $connection->is_connected() || ! current_user_can( 'activate_plugins' ) ) {
			return $red_bubble_slugs;
		}

		$plugins_needing_installed_activated = self::get_paid_plans_plugins_requirements();
		if ( empty( $plugins_needing_installed_activated ) ) {
			return $red_bubble_slugs;
		}

		foreach ( $plugins_needing_installed_activated as $plan_slug => $plugins_requirements ) {
			if ( empty( $_COOKIE[ "$plan_slug--plugins_needing_installed_dismissed" ] ) ) {
				$red_bubble_slugs[ "$plan_slug--plugins_needing_installed_activated" ] = $plugins_requirements;
			}
		}

		return $red_bubble_slugs;
	}

	/**
	 *  Add relevant red bubble notifications
	 *
	 * @param array $red_bubble_slugs - slugs that describe the reasons the red bubble is showing.
	 * @return array
	 */
	public static function add_red_bubble_alerts( array $red_bubble_slugs ) {
		if ( wp_doing_ajax() ) {
			return array();
		}
		$connection               = new Connection_Manager();
		$welcome_banner_dismissed = Jetpack_Options::get_option( 'dismissed_welcome_banner', false );
		if ( Initializer::is_jetpack_user_new() && ! $welcome_banner_dismissed ) {
			$red_bubble_slugs['welcome-banner-active'] = array(
				'is_silent' => $connection->is_connected(), // we don't display the red bubble if the user is connected
			);
			return $red_bubble_slugs;
		} else {
			return array_merge(
				self::alert_if_missing_connection( $red_bubble_slugs ),
				self::alert_if_last_backup_failed( $red_bubble_slugs ),
				self::alert_if_paid_plan_expiring( $red_bubble_slugs ),
				self::alert_if_protect_has_threats( $red_bubble_slugs ),
				self::alert_if_paid_plan_requires_plugin_install_or_activation( $red_bubble_slugs )
			);
		}
	}

	/**
	 * Collect all possible alerts that we might use a red bubble notification for
	 *
	 * @param bool $bypass_cache - whether to bypass the red bubble cache.
	 * @return array
	 */
	public static function get_red_bubble_alerts( bool $bypass_cache = false ) {
		static $red_bubble_alerts = array();

		// check for stored alerts
		$stored_alerts = get_transient( self::MY_JETPACK_RED_BUBBLE_TRANSIENT_KEY );

		// Cache bypass for red bubbles should only happen on the My Jetpack page
		if ( $stored_alerts !== false && ! ( $bypass_cache ) ) {
			return $stored_alerts;
		}

		// go find the alerts
		$red_bubble_alerts = apply_filters( 'my_jetpack_red_bubble_notification_slugs', $red_bubble_alerts );

		// cache the alerts for one hour
		set_transient( self::MY_JETPACK_RED_BUBBLE_TRANSIENT_KEY, $red_bubble_alerts, 3600 );

		return $red_bubble_alerts;
	}

	/**
	 * Get the red bubble alerts, bypassing cache when called via the REST API
	 *
	 * @param WP_REST_Request $request The REST API request object.
	 *
	 * @return WP_Error|WP_REST_Response
	 */
	public static function rest_api_get_red_bubble_alerts( $request ) {
		add_filter( 'my_jetpack_red_bubble_notification_slugs', array( __CLASS__, 'add_red_bubble_alerts' ) );

		$cookies = $request->get_param( 'dismissal_cookies' );

		// Update $_COOKIE superglobal with the provided cookies
		if ( ! empty( $cookies ) && is_array( $cookies ) ) {
			foreach ( $cookies as $cookie_string ) {
				// Parse cookie string in format "name=value"
				$parts = explode( '=', $cookie_string, 2 );
				if ( count( $parts ) === 2 ) {
					$name             = trim( $parts[0] );
					$value            = trim( $parts[1] );
					$_COOKIE[ $name ] = $value;
				}
			}
		}

		$red_bubble_alerts = self::get_red_bubble_alerts( true );
		return rest_ensure_response( $red_bubble_alerts );
	}
}
