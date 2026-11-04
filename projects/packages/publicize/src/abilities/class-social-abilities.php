<?php
/**
 * Jetpack Social Abilities Registration.
 *
 * Registers Jetpack Social abilities with the WordPress Abilities API so AI
 * agents can list connections, share a published post and remove a connection.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers Jetpack Social abilities with the WordPress Abilities API.
 *
 * Each ability calls the matching `wpcom/v2/publicize` REST route in-process, so
 * the route's own permission and ownership checks run and Jetpack and WordPress.com
 * sites share one code path. Creating a connection needs OAuth and stays in the UI.
 *
 * - `jetpack-social/get-connections` — list the connected social accounts.
 * - `jetpack-social/share-post` — share a published post to its connections now.
 * - `jetpack-social/delete-connection` — remove one connection.
 */
class Social_Abilities extends Registrar {

	const CONNECTIONS_ROUTE = '/wpcom/v2/publicize/connections';
	const SHARE_POST_ROUTE  = '/wpcom/v2/publicize/share-post';
	const MAX_SKIPPED       = 100;

	/**
	 * Return the ability category slug.
	 *
	 * @return string
	 */
	public static function get_category_slug(): string {
		return 'jetpack-social';
	}

	/**
	 * Return the ability category definition.
	 *
	 * @return array
	 */
	public static function get_category_definition(): array {
		return array(
			'label'       => __( 'Jetpack Social', 'jetpack-publicize-pkg' ),
			'description' => __( 'Abilities for the social networks connected to the site and for sharing posts to them.', 'jetpack-publicize-pkg' ),
		);
	}

	/**
	 * Return the abilities this Registrar exposes, keyed by slug.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public static function get_abilities(): array {
		$connection_id_schema = array(
			'type'        => 'integer',
			'minimum'     => 1,
			'description' => __( 'Connection ID, as returned by jetpack-social/get-connections.', 'jetpack-publicize-pkg' ),
		);

		$mcp = array(
			'public' => true,
			'type'   => 'tool',
		);

		return array(
			'jetpack-social/get-connections'   => array(
				'label'               => __( 'Get social connections', 'jetpack-publicize-pkg' ),
				'description'         => __(
					'List the social network accounts connected to this site through Jetpack Social. Shape: { total, connections: [ { connection_id, service_name, service_label, display_name, external_handle, profile_link, shared, status } ] }. `status` is ok, broken or must_reauth; a connection that is not ok cannot publish until it is reconnected in the Jetpack Social settings. `shared` is true when every author on the site can use the connection. Filter by `service_name` (for example facebook or linkedin). Set `test_connections` to check each connection against its network, which is slower. Returns an empty list when nothing is connected. Use connection_id with jetpack-social/delete-connection. On a Jetpack site the current user must be connected to WordPress.com.',
					'jetpack-publicize-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'service_name'     => array(
							'type'        => 'string',
							'description' => __( 'Only return connections to this network, for example facebook.', 'jetpack-publicize-pkg' ),
							'pattern'     => '^[a-z0-9_-]+$',
						),
						'test_connections' => array(
							'type'        => 'boolean',
							'description' => __( 'Check each connection against its network before answering.', 'jetpack-publicize-pkg' ),
							'default'     => false,
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'total'       => array( 'type' => 'integer' ),
						'connections' => array(
							'type'  => 'array',
							'items' => self::connection_schema(),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'get_connections' ),
				'permission_callback' => array( __CLASS__, 'can_view_connections' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
					'mcp'          => $mcp,
				),
			),
			'jetpack-social/share-post'        => array(
				'label'               => __( 'Share a post to social networks', 'jetpack-publicize-pkg' ),
				'description'         => __(
					'Share one published post to the site\'s connected social networks right now, as a new public post on each network. Shape: { post_id, results: [ { connection_id, service_name, status } ], errors: [ { connection_id, message } ] }. Each call publishes again, so repeating it posts a duplicate. Only published posts can be shared. `message` is the text posted with the link. Connections listed in `skipped_connections` are left out; list connection IDs with jetpack-social/get-connections. Requires at least one working connection. Works on posts the user can edit. On a Jetpack site the current user must be connected to WordPress.com. The call waits for every network, so a timeout error does not mean the share failed: check the post on the social network before sharing again.',
					'jetpack-publicize-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'post_id', 'message' ),
					'properties'           => array(
						'post_id'             => array(
							'type'        => 'integer',
							'minimum'     => 1,
							'description' => __( 'ID of the published post to share.', 'jetpack-publicize-pkg' ),
						),
						'message'             => array(
							'type'        => 'string',
							'minLength'   => 1,
							'maxLength'   => 1000,
							'description' => __( 'Text to post with the link.', 'jetpack-publicize-pkg' ),
						),
						'skipped_connections' => array(
							'type'        => 'array',
							'description' => __( 'Connection IDs to leave out of this share.', 'jetpack-publicize-pkg' ),
							'items'       => $connection_id_schema,
							'maxItems'    => self::MAX_SKIPPED,
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'post_id' => array( 'type' => 'integer' ),
						'results' => array( 'type' => 'array' ),
						'errors'  => array( 'type' => 'array' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'share_post' ),
				'permission_callback' => array( __CLASS__, 'can_share_post' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => true,
						'idempotent'  => false,
					),
					'show_in_rest' => true,
					'mcp'          => $mcp,
				),
			),
			'jetpack-social/delete-connection' => array(
				'label'               => __( 'Delete a social connection', 'jetpack-publicize-pkg' ),
				'description'         => __(
					'Remove one connected social account from the site. Shape: { deleted: bool, connection_id }. Posts already shared stay on the network; future shares skip this account. A connection cannot be restored through abilities, because connecting an account needs a sign-in on the network in the Jetpack Social settings. Editors can delete any connection; other users can delete their own. An unknown connection_id returns an error. Find IDs with jetpack-social/get-connections. On a Jetpack site the current user must be connected to WordPress.com.',
					'jetpack-publicize-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'connection_id' ),
					'properties'           => array(
						'connection_id' => $connection_id_schema,
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'deleted'       => array( 'type' => 'boolean' ),
						'connection_id' => array( 'type' => 'integer' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'delete_connection' ),
				'permission_callback' => array( __CLASS__, 'can_view_connections' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => true,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
					'mcp'          => $mcp,
				),
			),
		);
	}

	/**
	 * Output schema for one connection.
	 *
	 * @return array
	 */
	private static function connection_schema(): array {
		return array(
			'type'       => 'object',
			'properties' => array(
				'connection_id'   => array( 'type' => 'integer' ),
				'service_name'    => array( 'type' => 'string' ),
				'service_label'   => array( 'type' => 'string' ),
				'display_name'    => array( 'type' => 'string' ),
				'external_handle' => array( 'type' => array( 'string', 'null' ) ),
				'profile_link'    => array( 'type' => 'string' ),
				'shared'          => array( 'type' => 'boolean' ),
				'status'          => array( 'type' => array( 'string', 'null' ) ),
			),
		);
	}

	/**
	 * Can the current user see and manage Jetpack Social connections?
	 *
	 * @return bool
	 */
	public static function can_view_connections(): bool {
		global $publicize;

		return ! empty( $publicize ) && $publicize->current_user_can_access_publicize_data();
	}

	/**
	 * Can the current user share this post?
	 *
	 * @param mixed $input Ability input.
	 * @return bool
	 */
	public static function can_share_post( $input = null ): bool {
		global $publicize;

		$post_id = is_array( $input ) ? (int) ( $input['post_id'] ?? 0 ) : 0;

		return $post_id > 0 && ! empty( $publicize ) && $publicize->current_user_can_access_publicize_data( $post_id ) && current_user_can( 'edit_post', $post_id );
	}

	/**
	 * Execute jetpack-social/get-connections.
	 *
	 * @param mixed $input Ability input.
	 * @return array|WP_Error
	 */
	public static function get_connections( $input = null ) {
		$input   = is_array( $input ) ? $input : array();
		$request = new WP_REST_Request( 'GET', self::CONNECTIONS_ROUTE );
		$request->set_param( 'test_connections', rest_sanitize_boolean( $input['test_connections'] ?? false ) );

		$items = self::dispatch( $request );
		if ( is_wp_error( $items ) ) {
			return $items;
		}

		$service     = isset( $input['service_name'] ) && is_string( $input['service_name'] ) ? $input['service_name'] : '';
		$connections = array();
		foreach ( (array) $items as $item ) {
			if ( ! is_array( $item ) || ( '' !== $service && ( $item['service_name'] ?? '' ) !== $service ) ) {
				continue;
			}
			$connections[] = array(
				'connection_id'   => (int) ( $item['connection_id'] ?? 0 ),
				'service_name'    => (string) ( $item['service_name'] ?? '' ),
				'service_label'   => (string) ( $item['service_label'] ?? '' ),
				'display_name'    => (string) ( $item['display_name'] ?? '' ),
				'external_handle' => isset( $item['external_handle'] ) ? (string) $item['external_handle'] : null,
				'profile_link'    => (string) ( $item['profile_link'] ?? '' ),
				'shared'          => ! empty( $item['shared'] ),
				'status'          => isset( $item['status'] ) ? (string) $item['status'] : null,
			);
		}

		return array(
			'total'       => count( $connections ),
			'connections' => $connections,
		);
	}

	/**
	 * Execute jetpack-social/share-post.
	 *
	 * @param mixed $input Ability input.
	 * @return array|WP_Error
	 */
	public static function share_post( $input = null ) {
		$input   = is_array( $input ) ? $input : array();
		$post_id = (int) ( $input['post_id'] ?? 0 );
		$message = trim( (string) ( $input['message'] ?? '' ) );

		if ( '' === $message ) {
			return new WP_Error( 'jetpack_social_missing_message', __( 'message is required and cannot be empty.', 'jetpack-publicize-pkg' ) );
		}

		$body = array( 'message' => $message );
		if ( ! empty( $input['skipped_connections'] ) && is_array( $input['skipped_connections'] ) ) {
			$body['skipped_connections'] = array_map( 'absint', $input['skipped_connections'] );
		}

		// A JSON body is what the Jetpack-site proxy forwards to WordPress.com.
		$request = new WP_REST_Request( 'POST', self::SHARE_POST_ROUTE . '/' . $post_id );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( (string) wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );

		$result = self::dispatch( $request );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$result = (array) $result;

		return array(
			'post_id' => $post_id,
			'results' => array_values( (array) ( $result['results'] ?? array() ) ),
			'errors'  => array_values( (array) ( $result['errors'] ?? array() ) ),
		);
	}

	/**
	 * Execute jetpack-social/delete-connection.
	 *
	 * @param mixed $input Ability input.
	 * @return array|WP_Error
	 */
	public static function delete_connection( $input = null ) {
		$input         = is_array( $input ) ? $input : array();
		$connection_id = (int) ( $input['connection_id'] ?? 0 );

		$result = self::dispatch( new WP_REST_Request( 'DELETE', self::CONNECTIONS_ROUTE . '/' . $connection_id ) );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return array(
			'deleted'       => true,
			'connection_id' => $connection_id,
		);
	}

	/**
	 * Run a request against the REST server and return its data, or a WP_Error.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return mixed|WP_Error
	 */
	private static function dispatch( WP_REST_Request $request ) {
		$response = rest_do_request( $request );

		if ( $response instanceof WP_REST_Response && $response->is_error() ) {
			$error = $response->as_error();
			return new WP_Error(
				'jetpack_social_' . $error->get_error_code(),
				$error->get_error_message(),
				$error->get_error_data()
			);
		}

		return $response instanceof WP_REST_Response ? $response->get_data() : $response;
	}
}
