<?php
/**
 * REST API endpoint for Jetpack AI MCP settings.
 *
 * Proxies GET/POST requests to /rest/v1.1/me/settings for the mcp_abilities field.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_MCP_Settings
 */
class WPCOM_REST_API_V2_Endpoint_MCP_Settings extends WP_REST_Controller {
	/**
	 * Namespace prefix.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';

	/**
	 * Endpoint base route.
	 *
	 * @var string
	 */
	public $rest_base = 'jetpack-ai/mcp-settings';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_mcp_settings' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_mcp_settings' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => array(
						'mcp_abilities' => array(
							'type'     => 'object',
							'required' => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Check permissions.
	 *
	 * @return bool|WP_Error
	 */
	public function permissions_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to manage MCP settings.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Get MCP settings from WordPress.com.
	 *
	 * @return array|WP_Error
	 */
	public function get_mcp_settings() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// On WordPress.com, read directly from user meta.
			$user_settings = get_user_option( 'mcp_abilities', get_current_user_id() );
			return rest_ensure_response( array( 'mcp_abilities' => $user_settings ? $user_settings : new stdClass() ) );
		}

		$response = Client::wpcom_json_api_request_as_user(
			'/me/settings',
			'1.1',
			array(
				'method'  => 'GET',
				'headers' => array( 'Content-Type' => 'application/json' ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		return rest_ensure_response(
			array(
				'mcp_abilities' => $body['mcp_abilities'] ?? new stdClass(),
			)
		);
	}

	/**
	 * Update MCP settings on WordPress.com.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return array|WP_Error
	 */
	public function update_mcp_settings( $request ) {
		$mcp_abilities = $request->get_param( 'mcp_abilities' );

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// On WordPress.com, merge partial updates into the stored value.
			$existing_mcp_abilities = get_user_option( 'mcp_abilities', get_current_user_id() );

			if ( is_object( $existing_mcp_abilities ) ) {
				$existing_mcp_abilities = get_object_vars( $existing_mcp_abilities );
			} elseif ( ! is_array( $existing_mcp_abilities ) ) {
				$existing_mcp_abilities = array();
			}

			if ( is_object( $mcp_abilities ) ) {
				$mcp_abilities = get_object_vars( $mcp_abilities );
			} elseif ( ! is_array( $mcp_abilities ) ) {
				$mcp_abilities = array();
			}

			// Shallow-merge top-level keys first.
			$mcp_abilities = array_replace( $existing_mcp_abilities, $mcp_abilities );

			// Deep-merge `sites` entries by blog_id, and nested `abilities` by tool ID.
			if ( isset( $mcp_abilities['sites'] ) && is_array( $mcp_abilities['sites'] ) &&
				isset( $existing_mcp_abilities['sites'] ) && is_array( $existing_mcp_abilities['sites'] ) ) {
				$existing_sites = array();
				foreach ( $existing_mcp_abilities['sites'] as $entry ) {
					if ( isset( $entry['blog_id'] ) ) {
						$existing_sites[ $entry['blog_id'] ] = $entry;
					}
				}
				foreach ( $mcp_abilities['sites'] as $entry ) {
					if ( ! isset( $entry['blog_id'] ) ) {
						continue;
					}
					$blog_id = $entry['blog_id'];
					if ( isset( $existing_sites[ $blog_id ] ) ) {
						$existing_abilities         = isset( $existing_sites[ $blog_id ]['abilities'] ) && is_array( $existing_sites[ $blog_id ]['abilities'] ) ? $existing_sites[ $blog_id ]['abilities'] : array();
						$new_abilities              = isset( $entry['abilities'] ) && is_array( $entry['abilities'] ) ? $entry['abilities'] : array();
						$entry['abilities']         = array_replace( $existing_abilities, $new_abilities );
						$existing_sites[ $blog_id ] = array_replace( $existing_sites[ $blog_id ], $entry );
					} else {
						$existing_sites[ $blog_id ] = $entry;
					}
				}
				$mcp_abilities['sites'] = array_values( $existing_sites );
			}

			update_user_option( get_current_user_id(), 'mcp_abilities', $mcp_abilities );
			return rest_ensure_response( array( 'mcp_abilities' => $mcp_abilities ) );
		}

		$response = Client::wpcom_json_api_request_as_user(
			'/me/settings',
			'1.1',
			array(
				'method'  => 'POST',
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode( array( 'mcp_abilities' => $mcp_abilities ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		return rest_ensure_response(
			array(
				'mcp_abilities' => $body['mcp_abilities'] ?? $mcp_abilities,
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_MCP_Settings' );
