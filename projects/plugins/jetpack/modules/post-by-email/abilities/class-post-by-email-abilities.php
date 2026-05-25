<?php
/**
 * Jetpack Post by Email Abilities Registration
 *
 * Registers Jetpack Post by Email abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Plugin\Abilities;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\WP_Abilities\Registrar;
use Jetpack;

/**
 * Registers Jetpack Post by Email abilities with the WordPress Abilities API.
 *
 * Exposes a per-user read of the current user's Post by Email state and a
 * declarative rotate action that mints a fresh address (invalidating the old
 * one) so AI agents can inspect and rotate Post by Email through the standard
 * `wp-abilities/v1` REST surface.
 */
class Post_By_Email_Abilities extends Registrar {

	private const MODULE_SLUG = 'post-by-email';

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return 'jetpack-post-by-email';
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// translators: "Jetpack" is a product name and should not be translated.
			'label'       => __( 'Jetpack Post by Email', 'jetpack' ),
			'description' => __( 'Abilities for inspecting and rotating the current user\'s Post by Email address.', 'jetpack' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-post-by-email/get-status'         => array(
				'label'               => __( 'Get Jetpack Post by Email status', 'jetpack' ),
				'description'         => __( 'Return the current user\'s Post by Email state as { active, address, address_active, last_used_at }. active is whether the Post by Email feature is enabled for the user (an address has been minted). address is the per-user Post by Email address as a string, or null when the user has not enabled Post by Email or the remote read failed transiently. address_active mirrors active and is true when a non-empty address is present. last_used_at is always null in this release — the remote service does not currently expose last-used metadata; the field is reserved so the shape can grow without breaking callers. Fails with jetpack_post_by_email_not_connected when the current user is not connected to Jetpack (connect first via the My Jetpack admin page). These abilities are only registered while the Post by Email module is active; if they are absent from wp_get_abilities(), activate the Post by Email module first. Related: jetpack-post-by-email/regenerate-address rotates the user\'s address.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'active'         => array( 'type' => 'boolean' ),
						'address'        => array( 'type' => array( 'string', 'null' ) ),
						'address_active' => array( 'type' => 'boolean' ),
						'last_used_at'   => array( 'type' => array( 'integer', 'null' ) ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'get_status' ),
				'permission_callback' => array( __CLASS__, 'can_view_post_by_email' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool', // default is already "tool", but can be explicit.
					),
				),
			),

			'jetpack-post-by-email/regenerate-address' => array(
				'label'               => __( 'Regenerate Jetpack Post by Email address', 'jetpack' ),
				'description'         => __( 'Ensure the current user has a Post by Email address by minting a fresh one — creating it when the user has none, or rotating (invalidating + replacing) the existing address. Destructive when an existing address is rotated: any saved drafts pointing at the old address will no longer reach this site. Not idempotent — each call produces a new address even when the previous call succeeded. Returns { address, regenerated_at } where address is the new email string and regenerated_at is a Unix timestamp (seconds) recorded at call time. Preconditions: the Post by Email module must be active and the current user must be connected to Jetpack; call jetpack-post-by-email/get-status first to verify the connection. Fails with jetpack_post_by_email_module_inactive (defensive — the abilities are only registered while the module is active), jetpack_post_by_email_not_connected, or jetpack_post_by_email_service_unreachable when the remote call fails.', 'jetpack' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'address'        => array( 'type' => 'string' ),
						'regenerated_at' => array( 'type' => 'integer' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'regenerate_address' ),
				'permission_callback' => array( __CLASS__, 'can_manage_post_by_email' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => true,
						'idempotent'  => false,
					),
					'show_in_rest' => true,
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool', // default is already "tool", but can be explicit.
					),
				),
			),
		);
	}

	/**
	 * Permission check: can the current user read their own Post by Email state?
	 *
	 * Post by Email is a per-user feature for post authors: each user who can
	 * author posts manages their own address. `current_user_can( 'edit_posts' )`
	 * mirrors the gate used by the existing Post by Email AJAX/REST surface
	 * (`process_rest_proxy_request`) so subscribers — who cannot author posts —
	 * are not exposed to a feature they cannot use.
	 */
	public static function can_view_post_by_email(): bool {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Permission check: can the current user rotate their own Post by Email address?
	 *
	 * Same gate as the read — rotating the caller's own address requires the
	 * same authoring capability as reading it.
	 */
	public static function can_manage_post_by_email(): bool {
		return self::can_view_post_by_email();
	}

	/**
	 * Execute: per-user read. Returns the documented four-key shape on the happy
	 * path. Surfaces precondition failures as `WP_Error` so callers (especially
	 * AI agents) get an actionable next step instead of opaque null fields:
	 *
	 * - `jetpack_post_by_email_module_inactive` — defensive guard; in practice
	 *   unreachable because the abilities are only registered while the module
	 *   is active.
	 * - `jetpack_post_by_email_not_connected` — the current user is not
	 *   connected to Jetpack; the remote read needs the user's token.
	 *
	 * A null `address` on the happy path means either the user has not yet
	 * enabled Post by Email or the remote read failed transiently — the
	 * underlying `Jetpack_Post_By_Email::get_post_by_email_address()` reader
	 * collapses both into null. Callers should treat null as "no usable
	 * address" rather than distinguishing the two cases.
	 *
	 * @param array|null $input Ability input (no parameters accepted).
	 * @return array|\WP_Error
	 */
	public static function get_status( $input = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Abilities API contract requires execute callbacks to accept the input array even when the schema declares no parameters.
		if ( ! Jetpack::is_module_active( self::MODULE_SLUG ) ) {
			return new \WP_Error(
				'jetpack_post_by_email_module_inactive',
				__( 'The Post by Email module is not active. Activate it before reading Post by Email status.', 'jetpack' )
			);
		}

		if ( ! static::is_user_connected_to_jetpack() ) {
			return new \WP_Error(
				'jetpack_post_by_email_not_connected',
				__( 'User is not connected to Jetpack. Connect first via the My Jetpack admin page, then retry this ability.', 'jetpack' )
			);
		}

		$address     = static::fetch_address();
		$has_address = is_string( $address ) && '' !== $address;

		return array(
			'active'         => $has_address,
			'address'        => $has_address ? $address : null,
			'address_active' => $has_address,
			// The remote service does not currently surface last-used metadata.
			// The field is reserved so the response shape can grow without
			// breaking callers; callers should treat null as "unknown", not
			// "never used".
			'last_used_at'   => null,
		);
	}

	/**
	 * Execute: rotate the user's address. Always mints a new address on success
	 * — destructive (invalidates the old one) and not idempotent (each call
	 * produces a new value).
	 *
	 * @param array|null $input Input matching the ability's input_schema (no params).
	 * @return array|\WP_Error
	 */
	public static function regenerate_address( $input = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Abilities API contract requires execute callbacks to accept the input array even when the schema declares no parameters.
		if ( ! Jetpack::is_module_active( self::MODULE_SLUG ) ) {
			return new \WP_Error(
				'jetpack_post_by_email_module_inactive',
				__( 'The Post by Email module is not active. Activate it before rotating the Post by Email address.', 'jetpack' )
			);
		}

		if ( ! static::is_user_connected_to_jetpack() ) {
			return new \WP_Error(
				'jetpack_post_by_email_not_connected',
				__( 'The current user is not connected to Jetpack. Connect the user to Jetpack before rotating the Post by Email address.', 'jetpack' )
			);
		}

		// Choose between 'create' and 'regenerate' on the underlying writer:
		// the remote 'regenerate' endpoint expects an existing address to
		// rotate. Calling it for a user who has never enabled Post by Email
		// fails on the remote side. Inspect the current address first and route
		// accordingly so a fresh user gets a usable address from the same
		// ability instead of an opaque service error.
		$existing = static::fetch_address();
		$action   = is_string( $existing ) && '' !== $existing ? 'regenerate' : 'create';

		$new_address = static::apply_action( $action );
		if ( is_wp_error( $new_address ) ) {
			return new \WP_Error(
				'jetpack_post_by_email_service_unreachable',
				__( 'The remote Jetpack Post by Email service is unreachable. Retry shortly; this is typically transient.', 'jetpack' ),
				array( 'underlying' => $new_address->get_error_code() )
			);
		}

		return array(
			'address'        => $new_address,
			'regenerated_at' => time(),
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
	 * Fetch the current user's Post by Email address from the remote service.
	 *
	 * Delegates to `Jetpack_Post_By_Email::get_post_by_email_address()` so the
	 * abilities path and the legacy AJAX/REST path share a single reader.
	 *
	 * @return string|null Address string when set, or null when the user has
	 *                     not enabled Post by Email or the remote call failed.
	 */
	protected static function fetch_address() {
		return \Jetpack_Post_By_Email::init()->get_post_by_email_address();
	}

	/**
	 * Mint or rotate the current user's Post by Email address on the remote
	 * service. Delegates to `Jetpack_Post_By_Email::process_api_request()` so
	 * the abilities path and the legacy AJAX/REST path share a single writer
	 * (including the `post_by_email_address{user_id}` option mirror used by
	 * `Jetpack_Core_Json_Api_Endpoints::get_remote_value`). The shared helper
	 * returns the new address string on success or `array( 'message' => ... )`
	 * on failure; we adapt the failure shape to WP_Error here.
	 *
	 * @param string $action 'create' (no existing address) or 'regenerate' (rotate existing).
	 * @return string|\WP_Error New address on success, WP_Error on remote failure.
	 */
	protected static function apply_action( string $action ) {
		$result = \Jetpack_Post_By_Email::init()->process_api_request( $action );

		if ( is_string( $result ) && '' !== $result ) {
			return $result;
		}

		$message = is_array( $result ) && isset( $result['message'] )
			? (string) $result['message']
			: __( 'Empty response from remote Post by Email service.', 'jetpack' );

		return new \WP_Error( 'jetpack_post_by_email_regenerate_failed', $message );
	}
}
