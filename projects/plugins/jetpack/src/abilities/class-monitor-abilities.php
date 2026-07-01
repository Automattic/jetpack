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
	 *
	 * Monitor abilities live under the WordPress core `site` category — it is
	 * registered by the Abilities API itself, so we reference it by slug and
	 * never register it ourselves (see the no-op `register_category()` below).
	 */
	public static function get_category_slug(): string {
		return 'site';
	}

	/**
	 * {@inheritDoc}
	 *
	 * Unused: the `site` category is owned by WordPress core, so
	 * `register_category()` is a no-op and this definition is never passed to
	 * `wp_register_ability_category()`. It remains only to satisfy the abstract
	 * Registrar contract.
	 */
	public static function get_category_definition(): array {
		return array();
	}

	/**
	 * No-op: the `site` ability category is registered by the WordPress core
	 * Abilities API. Re-registering it here would clobber the core definition,
	 * so this registrar only references the category by slug.
	 *
	 * @return void
	 */
	public static function register_category() {}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-monitor/get-monitor-status' => array(
				'label'               => __( 'Get Jetpack Monitor status', 'jetpack' ),
				'description'         => __( 'Return the current Downtime Monitor state as { module_active, user_connected, notifications_enabled, last_status_change }. notifications_enabled is a boolean (does the current user receive downtime alerts). last_status_change is the timestamp of the most recent up/down status transition recorded by the Monitor service, as a "YYYY-MM-DD HH:mm:ss" UTC string, or null when no transition has been recorded — this reflects the legacy last_status_change projection, not necessarily the last time downtime began. Fails with jetpack_monitor_not_connected when the current user is not connected to Jetpack (connect first via the My Jetpack admin page), or jetpack_monitor_service_unreachable when the remote Monitor service cannot be reached. These abilities are only registered while the Monitor module is active; if they are absent from wp_get_abilities(), activate the Monitor module first.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'module_active'         => array( 'type' => 'boolean' ),
						'user_connected'        => array( 'type' => 'boolean' ),
						'notifications_enabled' => array( 'type' => 'boolean' ),
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
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool',
					),
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
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool',
					),
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
	 * Execute: overview read. Returns the full
	 * `{ module_active, user_connected, notifications_enabled, last_status_change }`
	 * shape on the happy path. Surfaces precondition and transport failures as
	 * `WP_Error` so callers (especially AI agents) get an actionable next step
	 * instead of opaque null fields:
	 *
	 * - `jetpack_monitor_module_inactive` — Monitor module is not active.
	 *   Defensive: in practice this is unreachable because the abilities are
	 *   only registered while the module is active.
	 * - `jetpack_monitor_not_connected` — the current user is not connected to
	 *   Jetpack; the remote read needs the user's token. Steers the caller to
	 *   the My Jetpack admin page to connect.
	 * - `jetpack_monitor_service_unreachable` — the remote Monitor service
	 *   returned an error for one of the two underlying XML-RPC reads
	 *   (`isUserInNotifications` or `getLastDowntime`). Transient — retry later.
	 *
	 * `last_status_change` remains `null` on the happy path when no up/down
	 * transition has been recorded yet; that is the documented "no data yet"
	 * signal, not a failure.
	 *
	 * @param array|null $input Ability input (no parameters accepted).
	 * @return array|\WP_Error
	 */
	public static function get_monitor_status( $input = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Abilities API contract requires execute callbacks to accept the input array even when the schema declares no parameters.
		$module_active  = Jetpack::is_module_active( self::MODULE_SLUG );
		$user_connected = static::is_user_connected_to_jetpack();

		if ( ! $module_active ) {
			return new \WP_Error(
				'jetpack_monitor_module_inactive',
				__( 'The Monitor module is not active. Activate it before reading Monitor status.', 'jetpack' )
			);
		}

		if ( ! $user_connected ) {
			return new \WP_Error(
				'jetpack_monitor_not_connected',
				__( 'User is not connected to Jetpack. Connect first via the My Jetpack admin page, then retry this ability.', 'jetpack' )
			);
		}

		$state = static::fetch_notifications_state();
		if ( is_wp_error( $state ) ) {
			return new \WP_Error(
				'jetpack_monitor_service_unreachable',
				__( 'The remote Jetpack Monitor service is unreachable. Retry shortly; this is typically transient.', 'jetpack' ),
				array( 'underlying' => $state->get_error_code() )
			);
		}

		$status_change = static::fetch_last_status_change();
		if ( is_wp_error( $status_change ) ) {
			return new \WP_Error(
				'jetpack_monitor_service_unreachable',
				__( 'The remote Jetpack Monitor service is unreachable. Retry shortly; this is typically transient.', 'jetpack' ),
				array( 'underlying' => $status_change->get_error_code() )
			);
		}

		return array(
			'module_active'         => $module_active,
			'user_connected'        => $user_connected,
			'notifications_enabled' => (bool) $state,
			'last_status_change'    => $status_change,
		);
	}

	/**
	 * Execute: declarative state-setter. Idempotent — compares desired vs current
	 * and returns changed=false when they match. Either way the local
	 * `monitor_receive_notifications` option is synced to the remote value (after
	 * the write on a change, and on the no-op path) so the legacy REST reader,
	 * which trusts that option first, never reports a stale state.
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
			// Sync the local `monitor_receive_notifications` option to the
			// known-good remote value even on a no-op. The legacy
			// `Jetpack_Core_Json_Api_Endpoints::get_remote_value` reader trusts
			// this option before falling back to a remote read, so a stale local
			// value would let it report the wrong state. The changed=true path
			// below mirrors the option after a write; mirroring here keeps the
			// unchanged path self-healing too.
			update_option( 'monitor_receive_notifications', $current );

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
			return self::normalize_last_status_change( $cached );
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
		return self::normalize_last_status_change( $response );
	}

	/**
	 * Normalize a `last_status_change` value into the documented contract:
	 * a `YYYY-MM-DD HH:mm:ss` UTC string, or `null` for "no transition yet".
	 *
	 * Jetpack Monitor v1 returns an empty string when no transition has been
	 * recorded; Monitor v2 may instead surface a MySQL zero-date
	 * (`0000-00-00 00:00:00`) or some other sentinel. Collapse every "no value"
	 * representation to `null` so the ability's `null` contract stays stable
	 * regardless of which backend is active.
	 *
	 * @param mixed $value Raw remote/cached value.
	 * @return string|null Pass-through timestamp string, or null when absent.
	 */
	protected static function normalize_last_status_change( $value ) {
		if ( ! is_string( $value ) ) {
			return null;
		}

		$value = trim( $value );
		if ( '' === $value || 0 === strncmp( $value, '0000-00-00', 10 ) ) {
			return null;
		}

		$ts = strtotime( $value );
		if ( false === $ts || $ts <= 0 ) {
			return null;
		}

		return $value;
	}
}
