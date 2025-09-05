<?php //phpcs:ignore
/**
 * MCP REST Transport for WordPress.com main site.
 * The REST transport requires the mcp-wordpress-remote proxy to be used with your MCP client.
 *
 * @package WpcomMcp
 */

declare( strict_types=1 );

namespace Automattic\WpcomMcp\Transport;

use Automattic\WpcomMcp\Infrastructure\McpRequestContext;
use Throwable;
use WP\MCP\Transport\Contracts\McpTransportInterface;
use WP\MCP\Transport\Infrastructure\McpTransportContext;
use WP\MCP\Transport\Infrastructure\McpTransportHelperTrait;
use WP_Error;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class WpcomRestTransport
 *
 * Registers REST API routes for the Model Context Protocol (MCP) REST transport.
 * Uses WordPress-style responses for REST transport via mcp-wordpress-remote.
 */
class WpcomRestTransport implements McpTransportInterface {
	use McpTransportHelperTrait;

	/**
	 * WPCOM-specific flag to mark the endpoint as being non-site specific.
	 * Prevents site-specific route prefix from being injected.
	 *
	 * @var bool
	 */
	public bool $wpcom_is_site_specific_endpoint = false;

	/**
	 * WPCOM-specific flag to mark the endpoint as being WP.com only.
	 *
	 * @var bool
	 */
	public bool $wpcom_is_wpcom_only_endpoint = true;

	/**
	 * The transport context.
	 *
	 * @var McpTransportContext
	 */
	private McpTransportContext $context;

	/**
	 * Initialize the class and register routes
	 *
	 * @param McpTransportContext $context The transport context.
	 */
	public function __construct( McpTransportContext $context ) {
		$this->context = $context;
		add_action( 'rest_api_init', array( $this, 'register_routes' ), 20001 );
	}

	/**
	 * Register all MCP proxy routes
	 */
	public function register_routes(): void {
		// Single endpoint for all MCP operations.
		register_rest_route(
			$this->context->mcp_server->get_server_route_namespace(),
			$this->context->mcp_server->get_server_route(),
			array(
				'methods'              => WP_REST_Server::CREATABLE,
				'callback'             => array( $this, 'handle_request' ),
				'permission_callback'  => array( $this, 'check_permission' ),
				'wpcom_required_scope' => 'auth',
			)
		);
	}

	/**
	 * Check if the user has permission to access the MCP API
	 *
	 * @return bool|WP_Error
	 */
	public function check_permission(): WP_Error|bool {
		// Use custom permission callback if provided
		if ( null !== $this->context->transport_permission_callback ) {
			try {
				return call_user_func( $this->context->transport_permission_callback );
			} catch ( Throwable $e ) {
				// Log error and fall back to default
				if ( $this->context->mcp_server->error_handler ) {
					$this->context->mcp_server->error_handler->log(
						'Transport permission callback failed',
						array(
							'transport' => static::class,
							'server_id' => $this->context->mcp_server->get_server_id(),
							'error'     => $e->getMessage(),
						)
					);
				}

				// Fall back to WPCOM-specific default
				return $this->wpcom_check_permission();
			}
		}

		// WPCOM-specific permission logic
		return $this->wpcom_check_permission();
	}

	/**
	 * WPCOM-specific permission check logic.
	 *
	 * @return bool
	 */
	private function wpcom_check_permission(): bool {
		$current_user_id = get_current_user_id();

		// Handle sandbox environment where get_current_user_id() might return 0.
		if ( 0 === $current_user_id && defined( 'WPCOM_SANDBOXED' ) && WPCOM_SANDBOXED ) {
			$user = get_user_by( 'login', strtok( php_uname( 'n' ), '.' ) );
			if ( $user ) {
				$current_user_id = $user->ID;
			}
		}

		// Only check if user is logged in.
		return $current_user_id > 0;
	}

	/**
	 * Handle all MCP requests
	 *
	 * @param mixed $request The request.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_request( mixed $request ): WP_Error|WP_REST_Response {
		$message = $request->get_json_params();

		if ( empty( $message ) || ! isset( $message['method'] ) ) {
			return new WP_Error(
				'invalid_request',
				'Invalid request: method parameter is required [DEBUG: message=' . wp_json_encode( $message ) . ']',
				array( 'status' => 400 )
			);
		}

		// Store the parsed request data in our context for observability
		McpRequestContext::get_instance()->set_request_data( $message, $request->get_method() );

		$method = $message['method'];
		$params = $message['params'] ?? $message; // backward compatibility with the old request format.

		// Route the request using the request router.
		$result = $this->context->request_router->route_request( $method, $params, 0, $this->get_transport_name() );

		try {
			// Check if the result contains an error
			if ( isset( $result['error'] ) ) {
				return $this->format_error_response( $result );
			}

			return $this->format_success_response( $result );
		} finally {
			// Clear the request context after processing
			McpRequestContext::get_instance()->clear();
		}
	}

	/**
	 * Format a successful response (WordPress format)
	 *
	 * @param array $result The result data.
	 * @param int   $request_id The request ID (unused in WordPress format).
	 *
	 * @return WP_REST_Response
	 */
	protected function format_success_response( array $result, int $request_id = 0 ): WP_REST_Response { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return rest_ensure_response( $result );
	}

	/**
	 * Format an error response (WordPress format)
	 *
	 * @param array $error The error data.
	 * @param int   $request_id The request ID (unused in WordPress format).
	 *
	 * @return WP_Error
	 */
	protected function format_error_response( array $error, int $request_id = 0 ): WP_Error { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$error_details = $error['error'] ?? $error;

		return new WP_Error(
			$error_details['code'] ?? 'handler_error',
			( $error_details['message'] ?? 'Handler error occurred' ) . ' [DEBUG: ' . wp_json_encode( $error_details ) . ']',
			array( 'status' => $error_details['data']['status'] ?? 500 )
		);
	}
}
