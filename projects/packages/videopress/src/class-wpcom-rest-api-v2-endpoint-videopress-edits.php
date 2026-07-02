<?php
/**
 * VideoPress Studio edits REST endpoints (WPCOM proxy).
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Local Studio edits/storyboard routes backed by the real WPCOM v1.1
 * endpoints (`videos/%s/edits` and `videos/%s/storyboard`, blog-signed).
 *
 * The routes, methods and permission checks are identical to the ones the
 * development mock (VideoPress_Studio_Mock_Edits) serves, so the frontend is
 * agnostic to which backend is active. Each handler is a thin passthrough:
 * the incoming JSON body and query parameters are forwarded, and the
 * upstream body and status come back with one translation — the v1.1 API
 * serializes a WP_Error as `{ error, message }` (plus `data` only when the
 * error carries `additional_data`), so proxy_request() remaps `error` to
 * `code` on failures to restore the canonical WP REST error shape the editor
 * matches on (`code === 'edits_conflict'`, `data.current_revision`, …). The
 * upstream status (409/400/422 …) is always preserved; only transport
 * failures (no HTTP response at all) become a local 500.
 *
 * The local DELETE route (restore original) maps to POST
 * `videos/%s/edits/delete` upstream: the v1.x JSON API dispatcher only
 * serves GET and POST, and `/delete` sub-paths are its deletion convention
 * (`videos/%s/delete`, `videos/%s/tracks/delete`).
 *
 * Requests are blog-signed (site auth, WPCOM user 0). The upstream
 * endpoints accept that explicitly via `is_jetpack_authorized_for_site()`,
 * but their rollout gate (`videopress_studio_edits_enabled()`) then only
 * passes for sites carrying the `videopress-studio-edits` blog sticker —
 * the Automattician bypass never applies to user 0. Sandbox testers: stick
 * the test blog.
 *
 * See the mock class docblock for the full JSON contract.
 *
 * @phan-constructor-used-for-side-effects
 */
class WPCOM_REST_API_V2_Endpoint_VideoPress_Edits {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Whether the proxy endpoints should register at all.
	 *
	 * Mirrors the guard in Initializer so the class is self-contained and the
	 * gating is testable without driving the whole initializer: Studio must be
	 * enabled, and the development mock must not have been opted into (the
	 * mock claims the exact same routes).
	 *
	 * @return bool
	 */
	public static function should_register() {
		/** This filter is documented in projects/packages/videopress/src/class-videopress-studio-mock-edits.php */
		return Admin_UI::is_studio_enabled() && ! apply_filters( 'videopress_studio_mock_edits', false );
	}

	/**
	 * Register the edits and storyboard routes.
	 */
	public function register_routes() {
		if ( ! self::should_register() ) {
			return;
		}

		$guid_arg = array(
			'guid' => array(
				'description' => __( 'The VideoPress GUID.', 'jetpack-videopress-pkg' ), // @phan-suppress-current-line PhanPluginMixedKeyNoKey
				'type'        => 'string',
				'required'    => true,
			),
		);

		register_rest_route(
			'wpcom/v2',
			'videopress/(?P<guid>\w+)/edits',
			array(
				'args' => $guid_arg,
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_edits' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'args'                => array(
						'base_revision' => array(
							'description' => __( 'The revision the client based its edits on.', 'jetpack-videopress-pkg' ),
							'type'        => 'integer',
							'required'    => true,
						),
					),
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save_edits' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'restore_original' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			)
		);

		register_rest_route(
			'wpcom/v2',
			'videopress/(?P<guid>\w+)/storyboard',
			array(
				'args' => $guid_arg,
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_storyboard' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			)
		);
	}

	/**
	 * Permission check shared by every route.
	 *
	 * @return bool
	 */
	public function permissions_check() {
		return Data::can_perform_action() && current_user_can( 'upload_files' );
	}

	/**
	 * GET /wpcom/v2/videopress/{guid}/edits — current edit state.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_edits( $request ) {
		return $this->proxy_request( $request, sprintf( 'videos/%s/edits', $request['guid'] ), 'GET' );
	}

	/**
	 * POST /wpcom/v2/videopress/{guid}/edits — save an operations list.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_edits( $request ) {
		return $this->proxy_request( $request, sprintf( 'videos/%s/edits', $request['guid'] ), 'POST' );
	}

	/**
	 * DELETE /wpcom/v2/videopress/{guid}/edits — restore the original master.
	 *
	 * Maps to POST `videos/%s/edits/delete` upstream: the v1.x JSON API
	 * dispatcher rejects any method other than GET/POST with a 405 before an
	 * endpoint could even see the request, so deletions are conventionally
	 * POSTs to a `/delete` sub-path.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function restore_original( $request ) {
		return $this->proxy_request( $request, sprintf( 'videos/%s/edits/delete', $request['guid'] ), 'POST' );
	}

	/**
	 * GET /wpcom/v2/videopress/{guid}/storyboard — filmstrip tile sheet data.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_storyboard( $request ) {
		return $this->proxy_request( $request, sprintf( 'videos/%s/storyboard', $request['guid'] ), 'GET' );
	}

	/**
	 * Forward a request to the blog-signed WPCOM v1.1 endpoint and hand the
	 * upstream JSON body and status code back.
	 *
	 * The request's raw JSON body (when present) and its query parameters
	 * (minus WP-internal ones) are forwarded untouched, so upstream owns all
	 * payload validation. The upstream status is preserved even for errors —
	 * the contract's 409/400/422 responses must reach the client with the
	 * status WPCOM produced. Error bodies are normalized from the v1.1
	 * serialization to the canonical WP REST shape (see normalize_error_body).
	 * Only a transport failure (the request never got an HTTP response)
	 * becomes a local 500 WP_Error.
	 *
	 * @param WP_REST_Request $request The incoming request (body source).
	 * @param string          $path    WPCOM REST v1.1 path.
	 * @param string          $method  HTTP method to use upstream.
	 * @return WP_REST_Response|WP_Error
	 */
	private function proxy_request( $request, $path, $method ) {
		$args = array( 'method' => $method );

		$query_params = $request->get_query_params();
		unset( $query_params['rest_route'] );
		foreach ( array_keys( $query_params ) as $key ) {
			// WP REST meta params (_locale, _envelope, _fields, …) mean nothing upstream.
			if ( str_starts_with( (string) $key, '_' ) ) {
				unset( $query_params[ $key ] );
			}
		}
		if ( $query_params ) {
			$path = add_query_arg( urlencode_deep( $query_params ), $path );
		}

		$body = $request->get_body();
		if ( '' === $body ) {
			$body = null;
		} else {
			$args['headers'] = array( 'content-type' => 'application/json' );
		}

		$response = Client::wpcom_json_api_request_as_blog( $path, '1.1', $args, $body, 'rest' );

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'videopress_edits_request_failed',
				$response->get_error_message(),
				array( 'status' => 500 )
			);
		}

		$status  = (int) wp_remote_retrieve_response_code( $response );
		$status  = $status ? $status : 500;
		$decoded = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $status >= 400 ) {
			$decoded = $this->normalize_error_body( $decoded, $status );
		}

		return new WP_REST_Response( $decoded, $status );
	}

	/**
	 * Translate a v1.1 error body into the canonical WP REST error shape.
	 *
	 * The v1.1 API serializes a WP_Error as `{ error: <code>, message }`,
	 * including `data` only when the error carries an `additional_data` key
	 * (WPCOM_JSON_API::serializable_error()). The editor, however, matches
	 * canonical WP REST errors: `code === 'edits_conflict'` and
	 * `data.current_revision` (use-save-video-edits.ts). So on failures the
	 * `error` key is remapped to `code`, `message` is kept, upstream `data`
	 * is passed through when present (the wpcom side packs
	 * `current_revision` there via `additional_data`), and a WP-style
	 * `data.status` is filled in when upstream sent no data at all. Bodies
	 * that already look canonical (or aren't objects) pass through verbatim.
	 *
	 * @param mixed $decoded Decoded upstream body.
	 * @param int   $status  Upstream HTTP status.
	 * @return mixed The normalized body.
	 */
	private function normalize_error_body( $decoded, $status ) {
		if ( ! is_array( $decoded ) || ! isset( $decoded['error'] ) || isset( $decoded['code'] ) ) {
			return $decoded;
		}

		return array(
			'code'    => (string) $decoded['error'],
			'message' => isset( $decoded['message'] ) ? (string) $decoded['message'] : '',
			'data'    => $decoded['data'] ?? array( 'status' => $status ),
		);
	}
}
