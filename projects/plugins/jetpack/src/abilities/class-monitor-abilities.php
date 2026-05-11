<?php
/**
 * Jetpack Monitor Abilities Registration
 *
 * Registers Jetpack Downtime Monitor abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Plugin\Abilities;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\WP_Abilities\Registrar;
use Jetpack;
use Jetpack_IXR_Client;

/**
 * Registers Jetpack Downtime Monitor abilities with the WordPress Abilities API.
 *
 * Exposes a zero-arg overview read (`get-monitor-status`) and a declarative
 * state-setter (`set-notifications`) so AI agents can inspect and configure the
 * site's Downtime Monitor through the standard `wp-abilities/v1` REST surface.
 */
class Monitor_Abilities extends Registrar {

	private const MODULE_SLUG = 'monitor';

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return 'jetpack-monitor';
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// translators: "Jetpack" is a product name and should not be translated.
			'label'       => __( 'Jetpack Monitor', 'jetpack' ),
			'description' => __( 'Abilities for inspecting and configuring Jetpack Downtime Monitor.', 'jetpack' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-monitor/get-monitor-status' => array(
				'label'               => __( 'Get Jetpack Monitor status', 'jetpack' ),
				'description'         => __( 'Return the current Downtime Monitor state as { module_active, user_connected, notifications_enabled, last_status_change }. notifications_enabled is a boolean (does the current user receive downtime alerts). last_status_change is the timestamp of the most recent up/down status transition recorded by the Monitor service, as a "YYYY-MM-DD HH:mm:ss" UTC string, or null when no transition has been recorded — this reflects the legacy last_status_change projection, not necessarily the last time downtime began. Both notifications_enabled and last_status_change are null when the user is not connected to Jetpack or the remote service is unreachable. These abilities are only registered while the Monitor module is active; if they are absent from wp_get_abilities(), activate the Monitor module first.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'module_active'         => array( 'type' => 'boolean' ),
						'user_connected'        => array( 'type' => 'boolean' ),
						'notifications_enabled' => array( 'type' => array( 'boolean', 'null' ) ),
						'last_status_change'    => array( 'type' => array( 'string', 'null' ) ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'get_monitor_status' ),
				'permission_callback' => array( __CLASS__, 'can_view_monitor' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-monitor/set-notifications'  => array(
				'label'               => __( 'Set Jetpack Monitor notifications', 'jetpack' ),
				'description'         => __( 'Enable or disable downtime email notifications for the current user. Idempotent — setting the state to the current value returns changed=false. Returns { enabled, changed }. Preconditions: the Monitor module must be active and the current user must be connected to Jetpack; call jetpack-monitor/get-monitor-status first to verify the connection. Fails with jetpack_monitor_module_inactive (activate the Monitor module first — these abilities are only registered while the module is active, so this error indicates a race) or jetpack_monitor_not_connected when preconditions are not met.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'enabled' ),
					'properties'           => array(
						'enabled' => array(
							'type'        => 'boolean',
							'description' => __( 'Desired notification state. true enables downtime email notifications for the current user; false disables them.', 'jetpack' ),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'enabled' => array( 'type' => 'boolean' ),
						'changed' => array( 'type' => 'boolean' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'set_notifications' ),
				'permission_callback' => array( __CLASS__, 'can_manage_monitor' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),
		);
	}

	/**
	 * Permission check: can the current user read Monitor status?
	 */
	public static function can_view_monitor(): bool {
		return current_user_can( 'jetpack_admin_page' );
	}

	/**
	 * Permission check: can the current user manage Monitor notifications?
	 *
	 * Notifications are a per-user preference that affects the caller's own inbox,
	 * so `jetpack_admin_page` (the same capability that gates the admin settings UI)
	 * is the right gate — no stricter cap is warranted.
	 */
	public static function can_manage_monitor(): bool {
		return current_user_can( 'jetpack_admin_page' );
	}

	/**
	 * Execute: overview read. Always returns the same shape; fields that depend
	 * on the remote service degrade to null when the user is not connected to
	 * Jetpack or the service is unreachable. `module_active` is always true here
	 * — these abilities are only registered while the Monitor module is active —
	 * but the field is kept in the output for explicit, self-describing responses.
	 *
	 * @param array|null $input Ability input (no parameters accepted).
	 * @return array
	 */
	public static function get_monitor_status( $input = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Abilities API contract requires execute callbacks to accept the input array even when the schema declares no parameters.
		$module_active  = Jetpack::is_module_active( self::MODULE_SLUG );
		$user_connected = static::is_user_connected_to_jetpack();

		$notifications_enabled = null;
		$last_status_change    = null;

		if ( $module_active && $user_connected ) {
			$state = static::fetch_notifications_state();
			if ( ! is_wp_error( $state ) ) {
				$notifications_enabled = $state;
			}

			$status_change = static::fetch_last_status_change();
			if ( ! is_wp_error( $status_change ) ) {
				$last_status_change = $status_change;
			}
		}

		return array(
			'module_active'         => $module_active,
			'user_connected'        => $user_connected,
			'notifications_enabled' => $notifications_enabled,
			'last_status_change'    => $last_status_change,
		);
	}

	/**
	 * Execute: declarative state-setter. Idempotent — compares desired vs current
	 * and returns changed=false when they match.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function set_notifications( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		if ( ! array_key_exists( 'enabled', $input ) ) {
			return new \WP_Error(
				'jetpack_monitor_missing_enabled',
				__( 'A desired enabled state (boolean) is required.', 'jetpack' )
			);
		}
		if ( ! is_bool( $input['enabled'] ) ) {
			return new \WP_Error(
				'jetpack_monitor_invalid_enabled',
				__( 'The enabled parameter must be a boolean. Strings like "true" / "false" are not accepted.', 'jetpack' )
			);
		}

		if ( ! Jetpack::is_module_active( self::MODULE_SLUG ) ) {
			return new \WP_Error(
				'jetpack_monitor_module_inactive',
				__( 'The Monitor module is not active. Activate it before configuring notifications.', 'jetpack' )
			);
		}

		if ( ! static::is_user_connected_to_jetpack() ) {
			return new \WP_Error(
				'jetpack_monitor_not_connected',
				__( 'The current user is not connected to Jetpack. Connect the user to Jetpack before configuring Monitor notifications.', 'jetpack' )
			);
		}

		$desired = $input['enabled'];
		$current = static::fetch_notifications_state();
		if ( is_wp_error( $current ) ) {
			return $current;
		}

		if ( $desired === $current ) {
			return array(
				'enabled' => $current,
				'changed' => false,
			);
		}

		$applied = static::apply_notifications_update( $desired );
		if ( is_wp_error( $applied ) ) {
			return $applied;
		}

		// Mirror the write to the `monitor_receive_notifications` option so the
		// legacy `Jetpack_Core_Json_Api_Endpoints::get_remote_value` reader — the
		// only other reader of this option — stays in sync with the remote state.
		update_option( 'monitor_receive_notifications', $desired );

		return array(
			'enabled' => $desired,
			'changed' => true,
		);
	}

	/**
	 * Whether the current user is connected to Jetpack.
	 *
	 * Extracted as a protected seam so tests can override the connection check
	 * without standing up a full Jetpack token fixture.
	 */
	protected static function is_user_connected_to_jetpack(): bool {
		return ( new Connection_Manager( 'jetpack' ) )->is_user_connected();
	}

	/**
	 * Send the IXR `jetpack.monitor.setNotifications` request to apply the
	 * desired state on the remote Monitor service.
	 *
	 * @param bool $enabled Desired notification state.
	 * @return true|\WP_Error True on success, WP_Error on remote failure.
	 */
	protected static function apply_notifications_update( bool $enabled ) {
		$xml = new Jetpack_IXR_Client( array( 'user_id' => get_current_user_id() ) );
		$xml->query( 'jetpack.monitor.setNotifications', $enabled );
		if ( $xml->isError() ) {
			return new \WP_Error(
				'jetpack_monitor_notifications_update_failed',
				sprintf( '%s: %s', $xml->getErrorCode(), $xml->getErrorMessage() )
			);
		}
		return true;
	}

	/**
	 * Fetch the current notifications state from the remote Monitor service.
	 *
	 * @return bool|\WP_Error Boolean preference when the remote call succeeds,
	 *                        WP_Error when the remote call fails.
	 */
	protected static function fetch_notifications_state() {
		$xml = new Jetpack_IXR_Client( array( 'user_id' => get_current_user_id() ) );
		$xml->query( 'jetpack.monitor.isUserInNotifications' );
		if ( $xml->isError() ) {
			return new \WP_Error(
				'jetpack_monitor_notifications_data_unavailable',
				sprintf( '%s: %s', $xml->getErrorCode(), $xml->getErrorMessage() )
			);
		}
		return (bool) $xml->getResponse();
	}

	/**
	 * Fetch the last up/down status-change timestamp from the remote Monitor
	 * service, reusing the same transient key and 10-minute TTL written by the
	 * legacy module.
	 *
	 * The remote `jetpack.monitor.getLastDowntime` XML-RPC method returns the
	 * legacy `last_status_change` projection — the time of the most recent
	 * up/down transition, not strictly when downtime began. The transient key
	 * stays `monitor_last_downtime` because that is what the legacy module
	 * writes and we share its cache.
	 *
	 * @return string|null|\WP_Error YYYY-MM-DD HH:mm:ss string, null when no
	 *                               transition has been recorded, or WP_Error
	 *                               on a remote failure.
	 */
	protected static function fetch_last_status_change() {
		$cached = get_transient( 'monitor_last_downtime' );
		if ( false !== $cached ) {
			return is_string( $cached ) && '' !== $cached ? $cached : null;
		}

		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.monitor.getLastDowntime' );
		if ( $xml->isError() ) {
			return new \WP_Error(
				'jetpack_monitor_downtime_data_unavailable',
				sprintf( '%s: %s', $xml->getErrorCode(), $xml->getErrorMessage() )
			);
		}

		$response = $xml->getResponse();
		set_transient( 'monitor_last_downtime', $response, 10 * MINUTE_IN_SECONDS );
		return is_string( $response ) && '' !== $response ? $response : null;
	}
}
