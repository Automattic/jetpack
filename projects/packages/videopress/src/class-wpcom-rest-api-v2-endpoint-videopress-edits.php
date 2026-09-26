<?php
/**
 * REST endpoints for trimming and cutting VideoPress videos.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Constants;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Proxies edit operations and original-timeline storyboards to WordPress.com.
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
	 * Register the feature-gated editor routes.
	 */
	public function register_routes() {
		// WordPress.com checks the rollout on the target site in the upstream endpoint.
		if ( ! ( defined( 'IS_WPCOM' ) && IS_WPCOM ) && ! Admin_UI::is_trim_cut_enabled() ) {
			return;
		}

		$guid_arg = array(
			'guid' => array(
				'description' => __( 'The VideoPress GUID.', 'jetpack-videopress-pkg' ),
				'type'        => 'string',
				'required'    => true,
			),
		);

		$edit_args = array(
			'base_revision' => array(
				'description' => __( 'The revision the edits are based on.', 'jetpack-videopress-pkg' ),
				'type'        => 'integer',
				'minimum'     => 0,
				'required'    => true,
			),
			'operations'    => array(
				'description' => __( 'Trim and cut operations on the original video timeline.', 'jetpack-videopress-pkg' ),
				'type'        => 'array',
				'required'    => true,
				'items'       => array(
					'type'                 => 'object',
					'additionalProperties' => false,
					'required'             => array( 'type', 'start_ms', 'end_ms' ),
					'properties'           => array(
						'type'     => array(
							'type' => 'string',
							'enum' => array( 'trim', 'cut' ),
						),
						'start_ms' => array(
							'type'    => 'integer',
							'minimum' => 0,
						),
						'end_ms'   => array(
							'type'    => 'integer',
							'minimum' => 1,
						),
					),
				),
			),
		);

		register_rest_route(
			'wpcom/v2',
			'videopress/(?P<guid>[A-Za-z0-9]{8})/edits',
			array(
				'args' => $guid_arg,
				0      => array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_edits' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				1      => array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save_edits' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $edit_args,
				),
				2      => array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'restore_original' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			)
		);

		register_rest_route(
			'wpcom/v2',
			'videopress/(?P<guid>[A-Za-z0-9]{8})/storyboard',
			array(
				'args'                => $guid_arg,
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_storyboard' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);
		register_rest_route(
			'wpcom/v2',
			'videopress/(?P<guid>[A-Za-z0-9]{8})/edits/retry',
			array(
				'args'                => array_merge(
					$guid_arg,
					array(
						'job_id' => array(
							'type'     => 'string',
							'pattern'  => '^[0-9]+$',
							'required' => true,
						),
					)
				),
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'retry_edits' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);

		$copy_args = array_merge(
			$guid_arg,
			array(
				'request_id' => array(
					'type'     => 'string',
					'pattern'  => '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$',
					'required' => true,
				),
			)
		);
		register_rest_route(
			'wpcom/v2',
			'videopress/(?P<guid>[A-Za-z0-9]{8})/edits/copy',
			array(
				'args'                => array_merge(
					$copy_args,
					$edit_args,
					array(
						'title' => array(
							'type'      => 'string',
							'maxLength' => 1000,
						),
					)
				),
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'copy_edits' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);
		register_rest_route(
			'wpcom/v2',
			'videopress/(?P<guid>[A-Za-z0-9]{8})/edits/copy/(?P<request_id>[a-f0-9-]{36})',
			array(
				'args'                => $copy_args,
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_copy' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);
	}

	/**
	 * Authorize access to the original video and editing controls.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return bool
	 */
	public function permissions_check( $request ) {
		return Data::can_perform_action()
			&& current_user_can( 'upload_files' )
			&& current_user_can( 'edit_post', WPCOM_REST_API_V2_Endpoint_VideoPress::get_video_attachment_id( $request['guid'] ) );
	}

	/**
	 * Fetch the current revision and processing job.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_edits( $request ) {
		return $this->proxy_request( sprintf( 'videos/%s/edits', $request['guid'] ) );
	}

	/**
	 * Submit operations against a specific revision.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_edits( $request ) {
		return $this->proxy_request(
			sprintf( 'videos/%s/edits', $request['guid'] ),
			'POST',
			array(
				'base_revision' => $request['base_revision'],
				'operations'    => $request['operations'],
			)
		);
	}

	/**
	 * Retry the exact failed job without changing the video's identity.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function retry_edits( $request ) {
		return $this->proxy_request(
			sprintf( 'videos/%s/edits/retry', $request['guid'] ),
			'POST',
			array( 'job_id' => $request['job_id'] )
		);
	}

	/**
	 * Create an independent video from original-timeline edits.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function copy_edits( $request ) {
		$body = array(
			'base_revision' => $request['base_revision'],
			'operations'    => $request['operations'],
			'request_id'    => $request['request_id'],
		);
		if ( isset( $request['title'] ) ) {
			$body['title'] = $request['title'];
		}
		return $this->proxy_request( sprintf( 'videos/%s/edits/copy', $request['guid'] ), 'POST', $body, true );
	}

	/**
	 * Fetch progress for the same idempotent copy request.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_copy( $request ) {
		return $this->proxy_request( sprintf( 'videos/%s/edits/copy/%s', $request['guid'], $request['request_id'] ) );
	}

	/**
	 * Restore the original using the upstream API's POST deletion convention.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function restore_original( $request ) {
		return $this->proxy_request( sprintf( 'videos/%s/edits/delete', $request['guid'] ), 'POST' );
	}

	/**
	 * Fetch the original video's storyboard tiles.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_storyboard( $request ) {
		return $this->proxy_request( sprintf( 'videos/%s/storyboard', $request['guid'] ) );
	}

	/**
	 * Preserve upstream statuses and normalize v1.1 errors for REST clients.
	 *
	 * @param string     $path   WordPress.com REST v1.1 path.
	 * @param string     $method HTTP method.
	 * @param array|null $body   JSON request data.
	 * @param bool       $as_user Preserve the connected actor when creating a copy.
	 * @return WP_REST_Response|WP_Error
	 */
	private function proxy_request( $path, $method = 'GET', $body = null, $as_user = false ) {
		$args = array( 'method' => $method );
		if ( null !== $body ) {
			$args['headers'] = array( 'content-type' => 'application/json' );
			$body            = wp_json_encode( $body, JSON_UNESCAPED_SLASHES );
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			try {
				$token = VideoPressToken::videopress_onetime_upload_token();
			} catch ( Upload_Exception $e ) {
				return new WP_Error( 'videopress_edits_request_failed', $e->getMessage(), array( 'status' => 502 ) );
			}
			$args['headers']['Authorization'] = sprintf( 'X_UPLOAD_TOKEN token="%s" blog_id="%s"', $token, VideoPressToken::blog_id() );
			$args['body']                     = $body;
			$args['timeout']                  = 30;
			$args['redirection']              = 0;
			$url                              = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' ) . '/rest/v1.1/' . $path;
			// @phan-suppress-next-line PhanAccessMethodInternal -- Use the poster transport; the direct client only dispatches v2 routes.
			$response = Client::_wp_remote_request( $url, $args );
		} elseif ( $as_user ) {
			$response = Client::wpcom_json_api_request_as_user( $path, '1.1', $args, $body, 'rest' );
		} else {
			$response = Client::wpcom_json_api_request_as_blog( $path, '1.1', $args, $body, 'rest' );
		}
		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'videopress_edits_request_failed', $response->get_error_message(), array( 'status' => 502 ) );
		}

		$status  = (int) wp_remote_retrieve_response_code( $response );
		$decoded = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $decoded ) || $status < 100 ) {
			return new WP_Error(
				'videopress_edits_invalid_response',
				__( 'The video editing service returned an invalid response.', 'jetpack-videopress-pkg' ),
				array( 'status' => 502 )
			);
		}

		if ( $status >= 400 && isset( $decoded['error'] ) && ! isset( $decoded['code'] ) ) {
			$decoded['code'] = $decoded['error'];
			unset( $decoded['error'] );
		}
		if ( $status >= 400 ) {
			$decoded['data']           = isset( $decoded['data'] ) && is_array( $decoded['data'] ) ? $decoded['data'] : array();
			$decoded['data']['status'] = $status;
		}

		return new WP_REST_Response( $decoded, $status );
	}
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	wpcom_rest_api_v2_load_plugin( __NAMESPACE__ . '\\WPCOM_REST_API_V2_Endpoint_VideoPress_Edits' );
}
