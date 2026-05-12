<?php
/**
 * Jetpack Protect Abilities Registration
 *
 * Registers Jetpack Protect read abilities and the Account Protection
 * toggle with the WordPress Abilities API.
 *
 * @package automattic/jetpack-protect-plugin
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Protect\Abilities;

use Automattic\Jetpack\Account_Protection\Account_Protection;
use Automattic\Jetpack\Account_Protection\Settings as Account_Protection_Settings;
use Automattic\Jetpack\Protect_Status\Status;
use Automattic\Jetpack\WP_Abilities\Registrar;

/**
 * Registers Jetpack Protect abilities with the WordPress Abilities API.
 *
 * The surface mirrors the read-only routes of the Protect REST controller
 * (`projects/plugins/protect/src/class-rest-controller.php`) plus the
 * Account Protection get/set pair. Destructive writes (fix-threat,
 * ignore-threat, request-scan) are deliberately omitted from the v1
 * surface; they need a follow-up design pass.
 */
class Protect_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-protect';

	/**
	 * Per_page cap for list-threats.
	 *
	 * Aligns with the token-thrift guidance: a single 100-element response
	 * is the upper bound; callers paginate past that.
	 */
	const LIST_THREATS_MAX_PER_PAGE = 100;

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// translators: "Jetpack" is a product name and should not be translated.
			'label'       => __( 'Jetpack Protect', 'jetpack-protect' ),
			'description' => __( 'Abilities for inspecting Jetpack Protect scan status, threats, and Account Protection state.', 'jetpack-protect' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-protect/get-status'                     => array(
				'label'               => __( 'Get Jetpack Protect status', 'jetpack-protect' ),
				'description'         => __( 'Return the current Protect plan and scan state as { has_plan, last_scan: { timestamp, status, threats_found }, threat_counts: { total, fixable, critical }, scan_in_progress }. Read-only; safe to call repeatedly. Use jetpack-protect/list-threats next to enumerate individual threats. Fails with jetpack_protect_status_data_unavailable when Status::get_status() returns no usable data (typically a transient remote failure or a disconnected site).', 'jetpack-protect' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'has_plan'          => array( 'type' => 'boolean' ),
						'last_scan'         => array(
							'type'       => array( 'object', 'null' ),
							'properties' => array(
								'timestamp'     => array( 'type' => array( 'string', 'null' ) ),
								'status'        => array( 'type' => array( 'string', 'null' ) ),
								'threats_found' => array( 'type' => 'integer' ),
							),
						),
						'threat_counts'     => array(
							'type'       => 'object',
							'properties' => array(
								'total'    => array( 'type' => 'integer' ),
								'fixable'  => array( 'type' => 'integer' ),
								'critical' => array( 'type' => 'integer' ),
							),
						),
						'scan_in_progress' => array( 'type' => 'boolean' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'get_status' ),
				'permission_callback' => array( __CLASS__, 'can_view_protect' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-protect/list-threats'                   => array(
				'label'               => __( 'List Jetpack Protect threats', 'jetpack-protect' ),
				'description'         => __( 'Return a paginated array of currently open threats with optional severity/type filters. Each entry is { id, signature, title, description, severity, type, fixable, ignored, first_detected, source }. severity is bucketed as "critical" (raw >=5), "high" (3-4), "medium" (2), or "low" (<2). type is one of "core" | "plugin" | "theme" | "file". Pagination defaults to per_page=20, capped at 100. Read-only. Call jetpack-protect/get-status first for the overview, then drill in with this ability; use jetpack-protect/get-threat for a single threat by id.', 'jetpack-protect' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'severity' => array(
							'type'        => 'string',
							'enum'        => array( 'critical', 'high', 'medium', 'low' ),
							'description' => __( 'Filter by severity bucket. Threats are bucketed from the raw 1-5 severity score: critical (>=5), high (3-4), medium (2), low (<2).', 'jetpack-protect' ),
						),
						'type'     => array(
							'type'        => 'string',
							'enum'        => array( 'core', 'plugin', 'theme', 'file' ),
							'description' => __( 'Filter by threat surface: WordPress core, a plugin, a theme, or a file on disk.', 'jetpack-protect' ),
						),
						'page'     => array(
							'type'    => 'integer',
							'minimum' => 1,
							'default' => 1,
						),
						'per_page' => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => self::LIST_THREATS_MAX_PER_PAGE,
							'default' => 20,
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'id'             => array( 'type' => array( 'string', 'null' ) ),
							'signature'      => array( 'type' => array( 'string', 'null' ) ),
							'title'          => array( 'type' => array( 'string', 'null' ) ),
							'description'    => array( 'type' => array( 'string', 'null' ) ),
							'severity'       => array( 'type' => array( 'string', 'null' ) ),
							'type'           => array( 'type' => array( 'string', 'null' ) ),
							'fixable'        => array( 'type' => 'boolean' ),
							'ignored'        => array( 'type' => 'boolean' ),
							'first_detected' => array( 'type' => array( 'string', 'null' ) ),
							'source'         => array( 'type' => array( 'string', 'null' ) ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'list_threats' ),
				'permission_callback' => array( __CLASS__, 'can_view_protect' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-protect/get-threat'                     => array(
				'label'               => __( 'Get a single Jetpack Protect threat', 'jetpack-protect' ),
				'description'         => __( 'Return a single threat detail by id as a 1-element array of { id, signature, title, description, severity, type, fixable, ignored, first_detected, source, recommended_action }, or an empty array when no such threat exists (consolidated-read pattern — unknown ids are not errors). Read-only. Pair with jetpack-protect/list-threats for enumeration.', 'jetpack-protect' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'id' ),
					'properties'           => array(
						'id' => array(
							'type'        => 'string',
							'description' => __( 'Threat identifier as returned by jetpack-protect/list-threats. Both numeric ids (legacy "12345") and synthetic vulnerability ids ("plugin-jetpack-1.2.3") are accepted as strings.', 'jetpack-protect' ),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => array( 'type' => 'object' ),
				),
				'execute_callback'    => array( __CLASS__, 'get_threat' ),
				'permission_callback' => array( __CLASS__, 'can_view_protect' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-protect/get-account-protection-status'  => array(
				'label'               => __( 'Get Account Protection status', 'jetpack-protect' ),
				'description'         => __( 'Return the current Account Protection state as { enabled, supported, last_event, attempt_count_24h, blocked_count_24h }. supported is false on environments where Account Protection cannot run (WordPress.com Simple, killswitch). last_event, attempt_count_24h, and blocked_count_24h are null/0 until activity data is available. Read-only. Use jetpack-protect/set-account-protection to toggle.', 'jetpack-protect' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'enabled'            => array( 'type' => 'boolean' ),
						'supported'          => array( 'type' => 'boolean' ),
						'last_event'         => array( 'type' => array( 'string', 'null' ) ),
						'attempt_count_24h'  => array( 'type' => 'integer' ),
						'blocked_count_24h'  => array( 'type' => 'integer' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'get_account_protection_status' ),
				'permission_callback' => array( __CLASS__, 'can_view_protect' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-protect/set-account-protection'         => array(
				'label'               => __( 'Set Account Protection state', 'jetpack-protect' ),
				'description'         => __( 'Enable or disable the Account Protection module. Idempotent — setting the state to the current value returns changed=false without making a write. Returns { enabled, changed }. Preconditions: Account Protection must be supported in the current environment; call jetpack-protect/get-account-protection-status first to verify (supported=true). Fails with jetpack_protect_account_protection_unsupported on unsupported environments, jetpack_protect_account_protection_toggle_failed when the underlying module activation/deactivation returns false.', 'jetpack-protect' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'enabled' ),
					'properties'           => array(
						'enabled' => array(
							'type'        => 'boolean',
							'description' => __( 'Desired Account Protection state. true activates the module; false deactivates it.', 'jetpack-protect' ),
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
				'execute_callback'    => array( __CLASS__, 'set_account_protection' ),
				'permission_callback' => array( __CLASS__, 'can_manage_protect' ),
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
	 * Permission check: can the current user read Protect data?
	 *
	 * Mirrors the REST controller's `current_user_can( 'manage_options' )` gate
	 * on every Protect read route. We do not introduce a narrower Jetpack-Protect
	 * cap here — the REST surface itself does not define one.
	 */
	public static function can_view_protect(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Permission check: can the current user manage Protect (toggle Account Protection)?
	 *
	 * Same `manage_options` gate as the underlying toggle route.
	 */
	public static function can_manage_protect(): bool {
		return current_user_can( 'manage_options' );
	}

	// -------------------- Execute callbacks --------------------

	/**
	 * Execute: zero-arg overview read.
	 *
	 * Wraps `Protect_Status_REST_Controller::api_get_status()` and
	 * `Protect_Status\Status::get_status()` with a high-signal projection of
	 * the underlying Status_Model: counts (total/fixable/critical), the last
	 * scan summary, and a scan_in_progress boolean.
	 *
	 * @param array|null $input Ability input (no parameters accepted).
	 * @return array|\WP_Error
	 */
	public static function get_status( $input = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Abilities API contract requires execute callbacks to accept the input array even when the schema declares no parameters.
		$status = static::fetch_status();

		if ( ! is_object( $status ) ) {
			return new \WP_Error(
				'jetpack_protect_status_data_unavailable',
				__( 'Could not load Jetpack Protect status. Retry shortly; this is typically transient.', 'jetpack-protect' )
			);
		}

		$threats          = is_array( $status->threats ?? null ) ? $status->threats : array();
		$fixable_threats  = is_array( $status->fixable_threat_ids ?? null ) ? $status->fixable_threat_ids : array();
		$status_string    = is_string( $status->status ?? null ) ? $status->status : null;
		$scan_in_progress = in_array( $status_string, array( 'in_progress', 'scanning', 'provisioning', 'scheduled' ), true );

		$critical_count = 0;
		foreach ( $threats as $threat ) {
			if ( static::severity_bucket( $threat->severity ?? null ) === 'critical' ) {
				++$critical_count;
			}
		}

		return array(
			'has_plan'         => static::has_required_plan(),
			'last_scan'        => array(
				'timestamp'     => is_string( $status->last_checked ?? null ) && '' !== $status->last_checked ? $status->last_checked : null,
				'status'        => $status_string,
				'threats_found' => count( $threats ),
			),
			'threat_counts'    => array(
				'total'    => count( $threats ),
				'fixable'  => count( $fixable_threats ),
				'critical' => $critical_count,
			),
			'scan_in_progress' => $scan_in_progress,
		);
	}

	/**
	 * Execute: paginated, filterable read of currently open threats.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function list_threats( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$severity = isset( $input['severity'] ) ? (string) $input['severity'] : null;
		$type     = isset( $input['type'] ) ? (string) $input['type'] : null;
		$page     = isset( $input['page'] ) ? max( 1, (int) $input['page'] ) : 1;
		$per_page = isset( $input['per_page'] ) ? (int) $input['per_page'] : 20;
		$per_page = max( 1, min( self::LIST_THREATS_MAX_PER_PAGE, $per_page ) );

		$status = static::fetch_status();
		if ( ! is_object( $status ) ) {
			return new \WP_Error(
				'jetpack_protect_status_data_unavailable',
				__( 'Could not load Jetpack Protect threats. Retry shortly; this is typically transient.', 'jetpack-protect' )
			);
		}

		$threats = is_array( $status->threats ?? null ) ? $status->threats : array();

		if ( null !== $severity ) {
			$threats = array_values(
				array_filter(
					$threats,
					static function ( $threat ) use ( $severity ) {
						return self::severity_bucket( $threat->severity ?? null ) === $severity;
					}
				)
			);
		}

		if ( null !== $type ) {
			$threats = array_values(
				array_filter(
					$threats,
					static function ( $threat ) use ( $type ) {
						return self::threat_type( $threat ) === $type;
					}
				)
			);
		}

		$offset = ( $page - 1 ) * $per_page;
		$slice  = array_slice( $threats, $offset, $per_page );

		return array_map( array( __CLASS__, 'project_threat' ), $slice );
	}

	/**
	 * Execute: single-threat read by id. Consolidated-read pattern — returns
	 * an empty array (not a WP_Error) when no threat with that id exists.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function get_threat( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		if ( ! isset( $input['id'] ) || ! is_string( $input['id'] ) || '' === $input['id'] ) {
			return new \WP_Error(
				'jetpack_protect_missing_id',
				__( 'A threat id is required.', 'jetpack-protect' )
			);
		}

		$id = $input['id'];

		$status = static::fetch_status();
		if ( ! is_object( $status ) ) {
			return new \WP_Error(
				'jetpack_protect_status_data_unavailable',
				__( 'Could not load Jetpack Protect threats. Retry shortly; this is typically transient.', 'jetpack-protect' )
			);
		}

		$threats = is_array( $status->threats ?? null ) ? $status->threats : array();
		foreach ( $threats as $threat ) {
			$threat_id = isset( $threat->id ) ? (string) $threat->id : null;
			if ( null === $threat_id || $threat_id !== $id ) {
				continue;
			}

			$projected                       = self::project_threat( $threat );
			$projected['recommended_action'] = self::recommended_action( $threat );
			return array( $projected );
		}

		// Unknown id → empty array (consolidated-read contract).
		return array();
	}

	/**
	 * Execute: zero-arg Account Protection state read.
	 *
	 * @param array|null $input Ability input (no parameters accepted).
	 * @return array
	 */
	public static function get_account_protection_status( $input = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Abilities API contract requires execute callbacks to accept the input array even when the schema declares no parameters.
		$settings = static::fetch_account_protection_settings();

		return array(
			'enabled'           => (bool) ( $settings['isEnabled'] ?? false ),
			'supported'         => (bool) ( $settings['isSupported'] ?? false ),
			'last_event'        => null,
			'attempt_count_24h' => 0,
			'blocked_count_24h' => 0,
		);
	}

	/**
	 * Execute: declarative Account Protection state-setter. Idempotent —
	 * compares desired vs current and returns changed=false when they match.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function set_account_protection( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		if ( ! array_key_exists( 'enabled', $input ) ) {
			return new \WP_Error(
				'jetpack_protect_missing_enabled',
				__( 'A desired enabled state (boolean) is required.', 'jetpack-protect' )
			);
		}
		if ( ! is_bool( $input['enabled'] ) ) {
			return new \WP_Error(
				'jetpack_protect_invalid_enabled',
				__( 'The enabled parameter must be a boolean. Strings like "true" / "false" are not accepted.', 'jetpack-protect' )
			);
		}

		$account_protection = static::account_protection();

		if ( ! $account_protection->is_supported_environment() ) {
			return new \WP_Error(
				'jetpack_protect_account_protection_unsupported',
				__( 'Account Protection is not supported in the current environment.', 'jetpack-protect' )
			);
		}

		$desired = $input['enabled'];
		$current = (bool) $account_protection->is_enabled();

		if ( $desired === $current ) {
			return array(
				'enabled' => $current,
				'changed' => false,
			);
		}

		$applied = $desired ? $account_protection->enable() : $account_protection->disable();
		if ( ! $applied ) {
			return new \WP_Error(
				'jetpack_protect_account_protection_toggle_failed',
				__( 'Failed to toggle Account Protection. Retry shortly; this is typically transient.', 'jetpack-protect' )
			);
		}

		return array(
			'enabled' => $desired,
			'changed' => true,
		);
	}

	// -------------------- Internal seams --------------------

	/**
	 * Bucket the raw 1-5 severity score into the agent-facing label.
	 *
	 * Mirrors the UI's ThreatSeverityBadge thresholds (>=5 critical, >=3 high,
	 * <3 low), with an explicit "medium" bucket for severity 2 so the four-bucket
	 * input filter exposed in the schema is invertible.
	 *
	 * @param mixed $severity Raw severity (int|null).
	 * @return string|null One of 'critical' | 'high' | 'medium' | 'low', or null when no severity is recorded.
	 */
	protected static function severity_bucket( $severity ): ?string {
		if ( null === $severity || ! is_numeric( $severity ) ) {
			return null;
		}
		$value = (int) $severity;
		if ( $value >= 5 ) {
			return 'critical';
		}
		if ( $value >= 3 ) {
			return 'high';
		}
		if ( $value >= 2 ) {
			return 'medium';
		}
		return 'low';
	}

	/**
	 * Derive the threat type bucket from a Threat_Model-shaped object.
	 *
	 * The remote payload may already include `extension->type` (one of
	 * 'plugin'|'theme'|'core'), or the threat may carry only `filename`
	 * (file scan) — we normalize those to the four-value enum the input
	 * filter accepts.
	 *
	 * @param object|null $threat Threat-like object.
	 * @return string|null
	 */
	protected static function threat_type( $threat ): ?string {
		if ( ! is_object( $threat ) ) {
			return null;
		}
		if ( isset( $threat->extension->type ) && is_string( $threat->extension->type ) ) {
			$type = $threat->extension->type;
			if ( in_array( $type, array( 'plugin', 'theme', 'core' ), true ) ) {
				return $type;
			}
		}
		if ( ! empty( $threat->filename ) ) {
			return 'file';
		}
		return null;
	}

	/**
	 * Project a Threat_Model-shaped object into the documented ability shape.
	 *
	 * @param object $threat Threat-like object.
	 * @return array
	 */
	protected static function project_threat( $threat ): array {
		$type = self::threat_type( $threat );

		// `fixable` on the Threat_Model is either falsy (no auto-fix), or an
		// object describing the auto-fix; coerce to a plain boolean.
		$fixable = isset( $threat->fixable ) ? (bool) $threat->fixable : false;

		// `status` on the Threat_Model uses the legacy "ignored" string when
		// a threat has been hidden by the operator.
		$ignored = isset( $threat->status ) && 'ignored' === $threat->status;

		return array(
			'id'             => isset( $threat->id ) ? (string) $threat->id : null,
			'signature'      => isset( $threat->signature ) ? (string) $threat->signature : null,
			'title'          => isset( $threat->title ) ? (string) $threat->title : null,
			'description'    => isset( $threat->description ) ? (string) $threat->description : null,
			'severity'       => self::severity_bucket( $threat->severity ?? null ),
			'type'           => $type,
			'fixable'        => $fixable,
			'ignored'        => $ignored,
			'first_detected' => isset( $threat->first_detected ) ? (string) $threat->first_detected : null,
			'source'         => isset( $threat->source ) ? (string) $threat->source : null,
		);
	}

	/**
	 * Compute a high-signal "what should the operator do next" hint for a
	 * single threat. Kept inside the ability rather than projected onto the
	 * list to avoid bloating list responses.
	 *
	 * @param object $threat Threat-like object.
	 * @return string
	 */
	protected static function recommended_action( $threat ): string {
		$fixable = isset( $threat->fixable ) ? (bool) $threat->fixable : false;
		if ( $fixable ) {
			return 'fix'; // Operator can ask Protect to auto-fix.
		}
		if ( isset( $threat->status ) && 'ignored' === $threat->status ) {
			return 'unignore_or_keep_ignored';
		}
		return 'review_and_ignore_or_resolve_manually';
	}

	/**
	 * Fetch the current Protect status. Extracted as a protected seam so
	 * tests can substitute a fixture without touching the remote service.
	 *
	 * @return object|null Status_Model-like object on success, null on failure.
	 */
	protected static function fetch_status() {
		return Status::get_status();
	}

	/**
	 * Fetch the Account Protection settings. Extracted as a protected seam.
	 *
	 * @return array Settings array { isEnabled, isSupported, ... }.
	 */
	protected static function fetch_account_protection_settings(): array {
		return ( new Account_Protection_Settings() )->get();
	}

	/**
	 * Get the Account Protection instance. Extracted as a protected seam so
	 * tests can inject a mock without touching the singleton.
	 *
	 * @return Account_Protection
	 */
	protected static function account_protection(): Account_Protection {
		return Account_Protection::instance();
	}

	/**
	 * Whether the site has the required Protect/Scan plan. Extracted as a
	 * protected seam (the underlying call has its own remote behavior).
	 *
	 * @return bool
	 */
	protected static function has_required_plan(): bool {
		return (bool) \Automattic\Jetpack\Protect_Status\Plan::has_required_plan();
	}
}
