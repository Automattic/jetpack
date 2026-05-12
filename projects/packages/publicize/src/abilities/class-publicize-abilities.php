<?php
/**
 * Jetpack Publicize Abilities Registration.
 *
 * Registers Jetpack Publicize abilities with the WordPress Abilities API so AI
 * agents can read social-account connections, inspect per-post share status,
 * and disconnect a single connection through the standard `wp-abilities/v1`
 * REST surface.
 *
 * @package automattic/jetpack-publicize
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions for older-WP compatibility runs.

namespace Automattic\Jetpack\Publicize\Abilities;

use Automattic\Jetpack\Publicize\Connections;
use Automattic\Jetpack\Publicize\REST_API\Proxy_Requests;
use Automattic\Jetpack\Publicize\Share_Status;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;
use WP_REST_Request;

/**
 * Registers Jetpack Publicize abilities with the WordPress Abilities API.
 *
 * Exposes a small, agent-friendly surface for managing Jetpack Social:
 *
 * - `jetpack-publicize/list-connections` — summarise the site's connected social accounts.
 * - `jetpack-publicize/get-share-status` — fetch share results for a single post.
 * - `jetpack-publicize/delete-connection` — disconnect a single social account.
 */
class Publicize_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-publicize';
	const ERROR_PREFIX  = 'jetpack_publicize_';

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
			// "Jetpack Social" is a product name and should not be translated.
			'label'       => 'Jetpack Social',
			'description' => __( 'Abilities for managing Jetpack Social connections and shared posts.', 'jetpack-publicize-pkg' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		$connection_item_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'                    => array( 'type' => 'string' ),
				'service'               => array( 'type' => 'string' ),
				'external_id'           => array( 'type' => array( 'string', 'null' ) ),
				'external_name'         => array( 'type' => array( 'string', 'null' ) ),
				'external_display_name' => array( 'type' => array( 'string', 'null' ) ),
				'external_handle'       => array( 'type' => array( 'string', 'null' ) ),
				'profile_link'          => array( 'type' => array( 'string', 'null' ) ),
				'profile_picture'       => array( 'type' => array( 'string', 'null' ) ),
				'status'                => array( 'type' => array( 'string', 'null' ) ),
				'shared'                => array( 'type' => 'boolean' ),
			),
		);

		$share_item_schema = array(
			'type'       => 'object',
			'properties' => array(
				'connection_id' => array( 'type' => array( 'string', 'integer', 'null' ) ),
				'service'       => array( 'type' => array( 'string', 'null' ) ),
				'status'        => array( 'type' => array( 'string', 'null' ) ),
				'share_id'      => array( 'type' => array( 'string', 'integer', 'null' ) ),
				'timestamp'     => array( 'type' => array( 'integer', 'null' ) ),
				'message'       => array( 'type' => array( 'string', 'null' ) ),
			),
		);

		return array(
			'jetpack-publicize/list-connections'  => array(
				'label'               => __( 'List Jetpack Social connections', 'jetpack-publicize-pkg' ),
				'description'         => __(
					'Return the social accounts connected to this site as a summarised array. Each item: { id, service, external_id, external_name, external_display_name, external_handle, profile_link, profile_picture, status, shared }. `status` is "ok", "broken", "must_reauth", or null when the upstream test was not run. Read-only and idempotent. Use the returned `id` with jetpack-publicize/delete-connection to disconnect an account or with jetpack-publicize/get-share-status to interpret per-share `connection_id` entries. Requires the publish_posts capability; sites with no connections return an empty array.',
					'jetpack-publicize-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => new \stdClass(),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => $connection_item_schema,
				),
				'execute_callback'    => array( __CLASS__, 'execute_list_connections' ),
				'permission_callback' => array( __CLASS__, 'can_view_connections' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-publicize/get-share-status'  => array(
				'label'               => __( 'Get Jetpack Social share status for a post', 'jetpack-publicize-pkg' ),
				'description'         => __(
					'Return the share-status snapshot for a published post: { post_id, can_be_shared, done, shares: [ { connection_id, service, status, share_id, timestamp, message } ], scheduled_shares: [...] }. Read-only and idempotent. `done` is true once the sharing job has finished; per-share `status` is typically "success" or "failure" and `message` carries the shared URL on success. Pass post_id (integer or numeric string). Returns jetpack_publicize_missing_post_id when post_id is absent; jetpack_publicize_invalid_post_id when post_id is not a positive integer; jetpack_publicize_post_not_found when no such post exists; jetpack_publicize_post_not_published when the post is not yet published. Requires edit_post on the target post.',
					'jetpack-publicize-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'post_id' ),
					'properties'           => array(
						'post_id' => array(
							'type'        => array( 'integer', 'string' ),
							'description' => __( 'The post ID to fetch share status for. Must be a positive integer.', 'jetpack-publicize-pkg' ),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'post_id'          => array( 'type' => 'integer' ),
						'can_be_shared'    => array( 'type' => 'boolean' ),
						'done'             => array( 'type' => 'boolean' ),
						'shares'           => array(
							'type'  => 'array',
							'items' => $share_item_schema,
						),
						'scheduled_shares' => array(
							'type'  => 'array',
							'items' => $share_item_schema,
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_get_share_status' ),
				'permission_callback' => array( __CLASS__, 'can_view_share_status' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-publicize/delete-connection' => array(
				'label'               => __( 'Delete a Jetpack Social connection', 'jetpack-publicize-pkg' ),
				'description'         => __(
					'Disconnect a single social account by connection_id. Returns { connection_id, deleted, changed }. Destructive but idempotent: deleting a connection that is already gone returns deleted=true and changed=false. Returns jetpack_publicize_missing_connection_id when connection_id is absent; jetpack_publicize_invalid_connection_id when connection_id is empty or non-string; jetpack_publicize_connection_delete_failed when the upstream service rejects the request. Call jetpack-publicize/list-connections first to discover valid ids. Requires the edit_others_posts capability.',
					'jetpack-publicize-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'connection_id' ),
					'properties'           => array(
						'connection_id' => array(
							'type'        => array( 'string', 'integer' ),
							'description' => __( 'Connection ID returned by jetpack-publicize/list-connections.', 'jetpack-publicize-pkg' ),
							'minLength'   => 1,
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'connection_id' => array( 'type' => 'string' ),
						'deleted'       => array( 'type' => 'boolean' ),
						'changed'       => array( 'type' => 'boolean' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_delete_connection' ),
				'permission_callback' => array( __CLASS__, 'can_manage_connections' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => true,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Read-side permission for listing connections.
	 *
	 * Mirrors the Connections REST controller's `publicize_permissions_check`
	 * intent — any user who can publish posts can see which accounts the site
	 * is connected to. We don't rely on `$publicize` being initialised here
	 * because the ability surface must answer outside the editor lifecycle.
	 *
	 * @return bool
	 */
	public static function can_view_connections(): bool {
		return current_user_can( 'publish_posts' );
	}

	/**
	 * Per-post read permission for share-status lookups.
	 *
	 * The Share_Status_Controller defers to `publicize_permissions_check()`,
	 * which gates on `publish_posts`; the per-post `edit_post` check is the
	 * tighter, agent-friendly default — agents inspecting another user's post
	 * shouldn't get read access without `edit_others_posts` on the target.
	 *
	 * @return bool
	 */
	public static function can_view_share_status(): bool {
		return current_user_can( 'publish_posts' );
	}

	/**
	 * Write-side permission for deleting a connection.
	 *
	 * Mirrors `manage_connection_permission_check()` in the Connections
	 * controller: editors and above can manage any connection. For
	 * connection-owner-only deletes the REST flow falls back to the user's
	 * own connections, but exposing that mode here would require resolving
	 * ownership against an arbitrary id before the permission check fires —
	 * which leaks information about the existence of connections the caller
	 * doesn't own. Gate on `edit_others_posts` for a predictable surface.
	 *
	 * @return bool
	 */
	public static function can_manage_connections(): bool {
		return current_user_can( 'edit_others_posts' );
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: list-connections.
	 *
	 * @param array|null $input Unused; ability accepts no input.
	 * @return array
	 */
	public static function execute_list_connections( $input = null ): array {
		unset( $input );

		$connections = static::fetch_connections();
		if ( ! is_array( $connections ) ) {
			return array();
		}

		$out = array();
		foreach ( $connections as $connection ) {
			if ( ! is_array( $connection ) ) {
				continue;
			}
			$out[] = self::summarize_connection( $connection );
		}

		return $out;
	}

	/**
	 * Execute: get-share-status.
	 *
	 * @param array|null $input Sanitized input.
	 * @return array|WP_Error
	 */
	public static function execute_get_share_status( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		if ( ! isset( $input['post_id'] ) || '' === $input['post_id'] ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_post_id',
				__( 'A post_id is required. Pass the WordPress post ID for the published post you want share status for.', 'jetpack-publicize-pkg' )
			);
		}

		if ( ! is_numeric( $input['post_id'] ) || (int) $input['post_id'] <= 0 ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'invalid_post_id',
				__( 'post_id must be a positive integer.', 'jetpack-publicize-pkg' )
			);
		}

		$post_id = (int) $input['post_id'];
		$post    = get_post( $post_id );

		if ( empty( $post ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'post_not_found',
				__( 'No post matched the supplied post_id.', 'jetpack-publicize-pkg' )
			);
		}

		if ( 'publish' !== $post->post_status ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'post_not_published',
				__( 'Share status is only available for published posts. Publish the post and try again.', 'jetpack-publicize-pkg' )
			);
		}

		$status = Share_Status::get_post_share_status( $post_id );

		$shares = array();
		if ( isset( $status['shares'] ) && is_array( $status['shares'] ) ) {
			foreach ( $status['shares'] as $share ) {
				if ( ! is_array( $share ) ) {
					continue;
				}
				$shares[] = self::summarize_share( $share );
			}
		}

		return array(
			'post_id'          => $post_id,
			'can_be_shared'    => self::current_user_can_share_post( $post_id ),
			'done'             => ! empty( $status['done'] ),
			'shares'           => $shares,
			// Scheduled shares are tracked separately on WPCOM and not yet
			// surfaced through this read; return an empty array so the agent
			// gets a stable shape regardless of upstream availability.
			'scheduled_shares' => array(),
		);
	}

	/**
	 * Execute: delete-connection.
	 *
	 * Idempotent: deleting a connection that is already gone returns
	 * deleted=true / changed=false rather than failing.
	 *
	 * @param array|null $input Sanitized input.
	 * @return array|WP_Error
	 */
	public static function execute_delete_connection( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		if ( ! isset( $input['connection_id'] ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_connection_id',
				__( 'A connection_id is required. Call jetpack-publicize/list-connections to enumerate available ids.', 'jetpack-publicize-pkg' )
			);
		}

		$connection_id = self::normalize_connection_id( $input['connection_id'] );

		if ( '' === $connection_id ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'invalid_connection_id',
				__( 'connection_id must be a non-empty string or positive integer.', 'jetpack-publicize-pkg' )
			);
		}

		// Idempotency: if the connection is already absent, return changed=false.
		// We probe via the same overridable helper the list ability uses so
		// tests can substitute an empty fixture without monkey-patching the
		// `Connections` transient.
		$existing = static::find_connection( $connection_id );
		if ( null === $existing ) {
			return array(
				'connection_id' => $connection_id,
				'deleted'       => true,
				'changed'       => false,
			);
		}

		$result = static::dispatch_delete( $connection_id );

		if ( is_wp_error( $result ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'connection_delete_failed',
				$result->get_error_message(),
				array( 'connection_id' => $connection_id )
			);
		}

		// Bust the package-level cache so the next list-connections call is fresh.
		Connections::clear_cache();

		return array(
			'connection_id' => $connection_id,
			'deleted'       => true,
			'changed'       => true,
		);
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Fetch the full connection list. Wrapped so tests can replace the call.
	 *
	 * @return array
	 */
	protected static function fetch_connections(): array {
		$connections = Connections::get_all();
		return is_array( $connections ) ? $connections : array();
	}

	/**
	 * Locate a single connection by id from the (overridable) fetch helper.
	 *
	 * @param string $connection_id Connection identifier.
	 * @return array|null Raw connection array, or null if not present.
	 */
	protected static function find_connection( string $connection_id ): ?array {
		foreach ( static::fetch_connections() as $connection ) {
			if ( ! is_array( $connection ) ) {
				continue;
			}
			if ( isset( $connection['connection_id'] ) && (string) $connection['connection_id'] === $connection_id ) {
				return $connection;
			}
		}
		return null;
	}

	/**
	 * Dispatch a connection delete to the correct backend.
	 *
	 * On WPCOM we go straight through `Connections::wpcom_delete_connection`;
	 * on Jetpack sites we proxy a DELETE to wpcom — the same code path the
	 * REST controller uses.
	 *
	 * @param string $connection_id Connection identifier.
	 * @return bool|WP_Error
	 */
	protected static function dispatch_delete( string $connection_id ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$result = Connections::wpcom_delete_connection( $connection_id );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
			return true;
		}

		$proxy   = new Proxy_Requests( 'publicize/connections' );
		$request = new WP_REST_Request( 'DELETE' );
		$result  = $proxy->proxy_request_to_wpcom_as_user( $request, $connection_id, array( 'timeout' => 30 ) );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return true;
	}

	/**
	 * Best-effort check that the caller can share the target post.
	 *
	 * Uses `$publicize->current_user_can_access_publicize_data( $post_id )`
	 * when the global is initialised, falling back to a plain `edit_post`
	 * capability check otherwise.
	 *
	 * @param int $post_id Post ID.
	 * @return bool
	 */
	protected static function current_user_can_share_post( int $post_id ): bool {
		global $publicize;

		if ( is_object( $publicize ) && method_exists( $publicize, 'current_user_can_access_publicize_data' ) ) {
			return (bool) $publicize->current_user_can_access_publicize_data( $post_id );
		}

		return current_user_can( 'edit_post', $post_id );
	}

	/**
	 * Project a raw connection array into the ability's documented shape.
	 *
	 * @param array $raw Raw connection from Connections::get_all().
	 * @return array
	 */
	private static function summarize_connection( array $raw ): array {
		// `display_name` / `profile_display_name` are the two names the
		// upstream payload exposes. They're often the same — surface both
		// under the agent-facing keys (`external_name`, `external_display_name`)
		// so the shape matches what `wp-abilities/v1` consumers expect, with
		// `display_name` as the universal fallback for both.
		$display_name         = isset( $raw['display_name'] ) ? (string) $raw['display_name'] : null;
		$profile_display_name = isset( $raw['profile_display_name'] ) && '' !== $raw['profile_display_name']
			? (string) $raw['profile_display_name']
			: $display_name;

		return array(
			'id'                    => isset( $raw['connection_id'] ) ? (string) $raw['connection_id'] : '',
			'service'               => isset( $raw['service_name'] ) ? (string) $raw['service_name'] : '',
			'external_id'           => isset( $raw['external_id'] ) ? (string) $raw['external_id'] : null,
			'external_name'         => $display_name,
			'external_display_name' => $profile_display_name,
			'external_handle'       => isset( $raw['external_handle'] ) ? (string) $raw['external_handle'] : null,
			'profile_link'          => isset( $raw['profile_link'] ) ? (string) $raw['profile_link'] : null,
			'profile_picture'       => isset( $raw['profile_picture'] ) ? (string) $raw['profile_picture'] : null,
			'status'                => isset( $raw['status'] ) ? ( null === $raw['status'] ? null : (string) $raw['status'] ) : null,
			'shared'                => ! empty( $raw['shared'] ),
		);
	}

	/**
	 * Project a raw share entry into the ability's documented shape.
	 *
	 * @param array $raw Raw share entry from Share_Status::get_post_share_status().
	 * @return array
	 */
	private static function summarize_share( array $raw ): array {
		return array(
			'connection_id' => $raw['connection_id'] ?? null,
			'service'       => isset( $raw['service'] ) ? (string) $raw['service'] : null,
			'status'        => isset( $raw['status'] ) ? (string) $raw['status'] : null,
			'share_id'      => $raw['external_id'] ?? null,
			'timestamp'     => isset( $raw['timestamp'] ) ? (int) $raw['timestamp'] : null,
			'message'       => isset( $raw['message'] ) ? (string) $raw['message'] : null,
		);
	}

	/**
	 * Normalise a connection_id input value to a non-empty string.
	 *
	 * Accepts integers and string-typed integers (the REST surface stringifies
	 * ids before returning them in `list-connections`, so both shapes are
	 * legal at the ability boundary).
	 *
	 * @param mixed $raw Raw connection_id from `$input`.
	 * @return string Normalised id, or '' when input is empty/invalid.
	 */
	private static function normalize_connection_id( $raw ): string {
		if ( is_int( $raw ) ) {
			return $raw > 0 ? (string) $raw : '';
		}
		if ( ! is_string( $raw ) ) {
			return '';
		}
		return trim( $raw );
	}
}
