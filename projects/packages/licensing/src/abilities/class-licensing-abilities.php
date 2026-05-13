<?php
/**
 * Jetpack Licensing Abilities Registration.
 *
 * Registers Jetpack Licensing abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack-licensing
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Licensing\Abilities;

use Automattic\Jetpack\Licensing;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;

/**
 * Registers Jetpack Licensing abilities with the WordPress Abilities API.
 *
 * Exposes a small, agent-shaped surface around the user-licensing endpoints
 * the package already provides: list attached / unattached licenses,
 * surface the last attach-error, and attach a new license key. The three
 * abilities wrap `Licensing::get_user_licenses`, `Licensing::last_error`
 * and `Licensing::attach_licenses` respectively so the standard
 * `wp-abilities/v1` REST surface can drive end-to-end licensing flows.
 */
class Licensing_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-licensing';
	const ERROR_PREFIX  = 'jetpack_licensing_';

	/**
	 * Pagination ceiling for list-licenses.
	 */
	const MAX_PER_PAGE = 100;

	/**
	 * Default page size for list-licenses.
	 */
	const DEFAULT_PER_PAGE = 20;

	/**
	 * Allowed status filter values for list-licenses.
	 *
	 * - `attached`  -> attached_at !== null && revoked_at === null
	 * - `detached`  -> attached_at === null && revoked_at === null
	 * - `expired`   -> revoked_at !== null OR expires_at in the past
	 * - `active`    -> attached + not expired (the agent's "what's actually
	 *                  protecting this site right now?" question)
	 */
	const STATUSES = array( 'active', 'expired', 'attached', 'detached' );

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
			// "Jetpack Licensing" is a product name and should not be translated.
			'label'       => 'Jetpack Licensing',
			'description' => __( 'Abilities for listing Jetpack licenses, inspecting attach errors, and attaching new license keys.', 'jetpack-licensing' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-licensing/list-licenses'  => self::spec_list_licenses(),
			'jetpack-licensing/get-error-info' => self::spec_get_error_info(),
			'jetpack-licensing/attach-license' => self::spec_attach_license(),
		);
	}

	/*
	 * ---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-licensing/list-licenses.
	 */
	private static function spec_list_licenses(): array {
		return array(
			'label'               => __( 'List Jetpack licenses', 'jetpack-licensing' ),
			'description'         => __(
				'Return the licenses owned by the current Jetpack-connected user, optionally filtered by status or by `license_id`. Shape: array of { id, slug, product_name, attached_at, status, expires_at }. The per-entry `status` value is one of "active" (attached and not expired), "expired" (revoked or past expiry), or "detached" (never attached). As an input filter, `status` also accepts "attached", which returns every license whose `attached_at` is set — including expired ones — so callers do not have to issue separate calls for active and expired-but-attached. Pass `license_id` to look up a single license — the result is a 0- or 1-element array, not a different shape; an unknown id returns []. Pagination defaults to per_page=20, max 100; use `page` to walk additional results. Precondition: the site must have a connected user with Jetpack; otherwise returns jetpack_licensing_data_unavailable. Related: call jetpack-licensing/get-error-info if a recent attach attempt failed.',
				'jetpack-licensing'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => array(
					'status'     => array(
						'type'        => 'string',
						'description' => __( 'Optional status filter.', 'jetpack-licensing' ),
						'enum'        => self::STATUSES,
					),
					'license_id' => array(
						'type'        => 'integer',
						'description' => __( 'Optional license id to look up. Result is a 0- or 1-element array.', 'jetpack-licensing' ),
						'minimum'     => 1,
					),
					'page'       => array(
						'type'        => 'integer',
						'description' => __( '1-based page index.', 'jetpack-licensing' ),
						'minimum'     => 1,
						'default'     => 1,
					),
					'per_page'   => array(
						'type'        => 'integer',
						'description' => __( 'Results per page (1-100).', 'jetpack-licensing' ),
						'minimum'     => 1,
						'maximum'     => self::MAX_PER_PAGE,
						'default'     => self::DEFAULT_PER_PAGE,
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'  => 'array',
				'items' => array(
					'type'       => 'object',
					'properties' => array(
						'id'           => array( 'type' => 'integer' ),
						'slug'         => array( 'type' => 'string' ),
						'product_name' => array( 'type' => 'string' ),
						'attached_at'  => array( 'type' => array( 'string', 'null' ) ),
						'status'       => array( 'type' => 'string' ),
						'expires_at'   => array( 'type' => array( 'string', 'null' ) ),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'list_licenses' ),
			'permission_callback' => array( __CLASS__, 'can_manage_licensing' ),
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
		);
	}

	/**
	 * Spec: jetpack-licensing/get-error-info.
	 */
	private static function spec_get_error_info(): array {
		return array(
			'label'               => __( 'Get last Jetpack license attach error', 'jetpack-licensing' ),
			'description'         => __(
				'Return the latest license-attach error recorded by the Licensing package. Shape: { has_error, message, code, last_attempt_at }. `has_error` is false and the other fields are empty/null when no error is pending. `code` and `last_attempt_at` are best-effort and may be null even when `has_error` is true (the underlying option only stores a human-readable message). Useful immediately after calling jetpack-licensing/attach-license to disambiguate which key(s) failed and why. Reading the error does not clear it — it remains visible until the next attach attempt overwrites the option.',
				'jetpack-licensing'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'has_error'       => array( 'type' => 'boolean' ),
					'message'         => array( 'type' => 'string' ),
					'code'            => array( 'type' => array( 'string', 'null' ) ),
					'last_attempt_at' => array( 'type' => array( 'string', 'null' ) ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_error_info' ),
			'permission_callback' => array( __CLASS__, 'can_manage_licensing' ),
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
		);
	}

	/**
	 * Spec: jetpack-licensing/attach-license.
	 */
	private static function spec_attach_license(): array {
		return array(
			'label'               => __( 'Attach a Jetpack license key', 'jetpack-licensing' ),
			'description'         => __(
				'Attach a single Jetpack license key to this site. Shape: { attached, license_id, products_activated, error }. `attached` is true on success — including when the key was already attached (idempotent: re-attaching an attached key returns attached=true with the same product list, not an error). `license_id` and `products_activated` come straight from the WP.com Subscription Server response (license_id may be null when the key was already attached and the server does not surface it again). On failure `attached` is false and `error` is { code, message }; common codes are jetpack_licensing_not_connected (no connection owner — connect Jetpack first), jetpack_licensing_invalid_key (revoked / unknown / mistyped key), and jetpack_licensing_request_failed (the WP.com XML-RPC call itself errored). After a failure, call jetpack-licensing/get-error-info for the same message stored on-site for the UI. Precondition: site must have a connected Jetpack owner.',
				'jetpack-licensing'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'license_key' ),
				'properties'           => array(
					'license_key' => array(
						'type'        => 'string',
						'description' => __( 'The Jetpack license key to attach. Trimmed and sanitized server-side.', 'jetpack-licensing' ),
						'minLength'   => 1,
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'attached'           => array( 'type' => 'boolean' ),
					'license_id'         => array( 'type' => array( 'integer', 'null' ) ),
					'products_activated' => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
					'error'              => array( 'type' => array( 'object', 'null' ) ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'attach_license' ),
			'permission_callback' => array( __CLASS__, 'can_manage_licensing' ),
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
		);
	}

	/*
	 * ---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Both reads and writes share `manage_options` — the same gate the
	 * existing /jetpack/v4/licensing REST surface uses (see
	 * Endpoints::can_manage_options_check). Keeping a single callback rather
	 * than splitting read/write avoids a divergence the REST surface itself
	 * never made; if the underlying endpoint cap changes later, this is the
	 * one place to update.
	 *
	 * @return bool
	 */
	public static function can_manage_licensing(): bool {
		return current_user_can( 'manage_options' );
	}

	/*
	 * ---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: list-licenses.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function list_licenses( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$status     = isset( $input['status'] ) && in_array( $input['status'], self::STATUSES, true ) ? $input['status'] : null;
		$license_id = isset( $input['license_id'] ) && is_numeric( $input['license_id'] ) && (int) $input['license_id'] > 0
			? (int) $input['license_id']
			: null;
		$page       = self::clamp_int( $input['page'] ?? 1, 1, PHP_INT_MAX, 1 );
		$per_page   = self::clamp_int( $input['per_page'] ?? self::DEFAULT_PER_PAGE, 1, self::MAX_PER_PAGE, self::DEFAULT_PER_PAGE );

		$items = static::fetch_user_licenses();
		if ( is_wp_error( $items ) ) {
			return $items;
		}

		$normalized = array();
		foreach ( $items as $item ) {
			$entry = self::normalize_license( $item );
			if ( null === $entry ) {
				continue;
			}
			if ( null !== $license_id && $entry['id'] !== $license_id ) {
				continue;
			}
			if ( null !== $status && ! self::matches_status_filter( $entry, $status ) ) {
				continue;
			}
			$normalized[] = $entry;
		}

		// Apply pagination AFTER filtering so callers see a stable result-set
		// rather than empty pages at the tail of an unrelated filter.
		$offset = ( $page - 1 ) * $per_page;
		return array_slice( $normalized, $offset, $per_page );
	}

	/**
	 * Execute: get-error-info.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array
	 */
	public static function get_error_info( $input = null ) {
		unset( $input );

		$message = (string) static::get_licensing()->last_error();

		return array(
			'has_error'       => '' !== $message,
			'message'         => $message,
			// The underlying option stores only the message string; code and
			// timestamp are not tracked. Returning explicit nulls (rather than
			// dropping the keys) keeps the response shape uniform.
			'code'            => null,
			'last_attempt_at' => null,
		);
	}

	/**
	 * Execute: attach-license.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function attach_license( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		if ( ! isset( $input['license_key'] ) || ! is_string( $input['license_key'] ) || '' === trim( $input['license_key'] ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_license_key',
				__( 'A non-empty `license_key` string is required.', 'jetpack-licensing' )
			);
		}

		$license_key = trim( sanitize_text_field( $input['license_key'] ) );

		$results = static::get_licensing()->attach_licenses( array( $license_key ) );

		if ( is_wp_error( $results ) ) {
			// Underlying `attach_licenses()` returns a top-level WP_Error only for
			// not-connected / request-failure cases. Surface as a structured
			// failure response so the agent can branch on `attached` rather than
			// having to differentiate WP_Error vs. array.
			return array(
				'attached'           => false,
				'license_id'         => null,
				'products_activated' => array(),
				'error'              => array(
					'code'    => self::map_error_code( $results->get_error_code() ),
					'message' => (string) $results->get_error_message(),
				),
			);
		}

		// Expected: one entry corresponding to the one license key we sent.
		$first = isset( $results[0] ) ? $results[0] : null;

		if ( is_wp_error( $first ) ) {
			return array(
				'attached'           => false,
				'license_id'         => null,
				'products_activated' => array(),
				'error'              => array(
					'code'    => self::ERROR_PREFIX . 'invalid_key',
					'message' => (string) $first->get_error_message(),
				),
			);
		}

		// `true` is the legacy multicall ack for "already attached, nothing new
		// to activate" — treat as a successful idempotent attach.
		if ( true === $first ) {
			return array(
				'attached'           => true,
				'license_id'         => null,
				'products_activated' => array(),
				'error'              => null,
			);
		}

		$entry = is_array( $first ) ? $first : array();

		$license_id         = isset( $entry['license_id'] ) ? (int) $entry['license_id'] : null;
		$products_activated = array();

		// The XML-RPC response uses `activatedProductId` (singular) for the
		// canonical single-license response, but agents prefer a list. Promote
		// a singleton to a one-element array of the product slug or numeric id.
		if ( isset( $entry['activatedProductId'] ) ) {
			$products_activated[] = (string) $entry['activatedProductId'];
		}
		if ( isset( $entry['products'] ) && is_array( $entry['products'] ) ) {
			foreach ( $entry['products'] as $product ) {
				if ( is_string( $product ) || is_numeric( $product ) ) {
					$products_activated[] = (string) $product;
				}
			}
		}

		return array(
			'attached'           => true,
			'license_id'         => $license_id,
			'products_activated' => array_values( array_unique( $products_activated ) ),
			'error'              => null,
		);
	}

	/*
	 * ---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Return a Licensing singleton. Extracted as a seam so tests can swap in
	 * a partial mock without needing to install a real Jetpack connection.
	 *
	 * @return Licensing
	 */
	protected static function get_licensing(): Licensing {
		return Licensing::instance();
	}

	/**
	 * Fetch the current user's licenses from WP.com.
	 *
	 * Returns either the list of license items (objects), an empty array, or
	 * a WP_Error when the request failed. `Licensing::get_user_licenses()`
	 * itself returns `[]` on failure and on success; we use the underlying
	 * `Endpoints::get_user_licenses()` directly so genuine fetch failures
	 * surface as a structured WP_Error instead of looking like "no licenses".
	 *
	 * @return array|WP_Error
	 */
	protected static function fetch_user_licenses() {
		$licenses = \Automattic\Jetpack\Licensing\Endpoints::get_user_licenses();
		if ( is_wp_error( $licenses ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'data_unavailable',
				__( 'Could not fetch your Jetpack licenses from WordPress.com. Confirm the site has a connected user and try again.', 'jetpack-licensing' )
			);
		}

		if ( empty( $licenses ) || empty( $licenses->items ) || ! is_array( $licenses->items ) ) {
			return array();
		}

		return $licenses->items;
	}

	/**
	 * Normalize a single WP.com license object into the response shape.
	 *
	 * @param object|array|mixed $item Raw license entry from WP.com.
	 * @return array|null Normalized license or null when the entry is unusable.
	 */
	private static function normalize_license( $item ): ?array {
		if ( is_object( $item ) ) {
			$item = (array) $item;
		}
		if ( ! is_array( $item ) ) {
			return null;
		}

		$id           = isset( $item['id'] ) ? (int) $item['id'] : 0;
		$attached_at  = self::nullable_string( $item, 'attached_at' );
		$revoked_at   = self::nullable_string( $item, 'revoked_at' );
		$expires_at   = self::nullable_string( $item, 'expires_at' );
		$product_name = isset( $item['product_name'] ) ? (string) $item['product_name'] : '';
		$slug         = isset( $item['product_slug'] ) ? (string) $item['product_slug'] : ( isset( $item['slug'] ) ? (string) $item['slug'] : '' );

		return array(
			'id'           => $id,
			'slug'         => $slug,
			'product_name' => $product_name,
			'attached_at'  => $attached_at,
			'status'       => self::compute_status( $attached_at, $revoked_at, $expires_at ),
			'expires_at'   => $expires_at,
		);
	}

	/**
	 * Derive the canonical `status` string from raw attach / revoke / expiry
	 * timestamps. This is the single value returned in the response; the
	 * `attached` filter category (legacy / "did this license ever attach,
	 * regardless of expiry?") is honored separately by `matches_status_filter`
	 * to avoid drift between display state and filter state.
	 *
	 * @param string|null $attached_at Attach timestamp or null.
	 * @param string|null $revoked_at  Revoke timestamp or null.
	 * @param string|null $expires_at  Expiry timestamp or null.
	 * @return string One of `active`, `expired`, `detached`.
	 */
	private static function compute_status( ?string $attached_at, ?string $revoked_at, ?string $expires_at ): string {
		if ( null !== $revoked_at ) {
			return 'expired';
		}
		if ( null !== $expires_at && self::is_past( $expires_at ) ) {
			return 'expired';
		}
		if ( null === $attached_at ) {
			return 'detached';
		}
		return 'active';
	}

	/**
	 * Whether a normalized license entry matches the caller's status filter.
	 *
	 * `active`, `expired`, `detached` are taken verbatim from the computed
	 * status. `attached` is broader: any entry whose `attached_at` is set
	 * (including expired entries that were attached before their expiry).
	 *
	 * @param array  $entry  Normalized license entry from `normalize_license`.
	 * @param string $status Caller-supplied status filter.
	 * @return bool
	 */
	private static function matches_status_filter( array $entry, string $status ): bool {
		if ( 'attached' === $status ) {
			return null !== $entry['attached_at'];
		}
		return $entry['status'] === $status;
	}

	/**
	 * Whether the given timestamp string is in the past relative to now.
	 *
	 * @param string $when ISO-8601-ish timestamp.
	 * @return bool
	 */
	private static function is_past( string $when ): bool {
		$ts = strtotime( $when );
		if ( false === $ts ) {
			return false;
		}
		return $ts < time();
	}

	/**
	 * Read a value from an array, coercing to string or null.
	 *
	 * @param array  $arr Source.
	 * @param string $key Key.
	 * @return string|null
	 */
	private static function nullable_string( array $arr, string $key ): ?string {
		if ( ! array_key_exists( $key, $arr ) ) {
			return null;
		}
		$value = $arr[ $key ];
		if ( null === $value || '' === $value ) {
			return null;
		}
		return (string) $value;
	}

	/**
	 * Map an underlying error code from `attach_licenses()` onto our
	 * vocabulary so agents can branch on stable codes.
	 *
	 * @param string|int $code Raw error code.
	 * @return string
	 */
	private static function map_error_code( $code ): string {
		$code = (string) $code;
		switch ( $code ) {
			case 'not_connected':
				return self::ERROR_PREFIX . 'not_connected';
			case 'request_failed':
				return self::ERROR_PREFIX . 'request_failed';
			default:
				// Unknown upstream code — namespace it so callers can still
				// distinguish jetpack-licensing failures from generic errors.
				return self::ERROR_PREFIX . 'attach_failed';
		}
	}

	/**
	 * Clamp an integer into [$min, $max] with a default on bad input.
	 *
	 * @param mixed $raw     Raw input.
	 * @param int   $min     Minimum.
	 * @param int   $max     Maximum.
	 * @param int   $default Default on bad input.
	 * @return int
	 */
	private static function clamp_int( $raw, int $min, int $max, int $default ): int {
		if ( ! is_numeric( $raw ) ) {
			return $default;
		}
		$v = (int) $raw;
		if ( $v < $min ) {
			return $min;
		}
		if ( $v > $max ) {
			return $max;
		}
		return $v;
	}
}
