<?php
/**
 * Contact Form File Endpoint class.
 *
 * @package automattic/jetpack-forms
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use WP_Error;
use WP_REST_Controller;
use WP_REST_Server;

// Require the file handler class
require_once __DIR__ . '/class-contact-form-file-handler.php';

/**
 * Class Contact_Form_File_Endpoint
 * Handles the REST API endpoints for Jetpack Forms file retrievals.
 */
class Contact_Form_File_Endpoint extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'jetpack-forms/v1';
		$this->rest_base = 'files';
	}

	/**
	 * Registers the REST routes.
	 */
	public function register_rest_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'                 => WP_REST_Server::READABLE,
				'callback'                => array( $this, 'get_file' ),
				'permission_callback'     => array( $this, 'get_file_permissions_check' ),
				'args'                    => array(
					'file_id' => array(
						'required'          => true,
						'validate_callback' => function ( $param ) {
							return ! empty( $param );
						},
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'requires_authentication' => true,
			)
		);
	}

	/**
	 * Checks if the current user has permission to view files.
	 *
	 * @param \WP_REST_Request $request The current request object.
	 * @return true|\WP_Error True if the user has permission, WP_Error otherwise.
	 */
	public function get_file_permissions_check( $request ) {
		// Verify the user is logged in with appropriate capabilities
		if ( ! current_user_can( 'edit_pages' ) ) {
			return new WP_Error(
				'rest_forbidden',
				esc_html__( 'You must be logged in with appropriate permissions to view this file.', 'jetpack-forms' ),
				array( 'status' => 403 )
			);
		}

		// Get the file ID from the request and its hash
		$file_id      = $request->get_param( 'file_id' );
		$file_id_hash = $request->get_param( 'file_id_hash' );

		// If no hash was provided, generate it from the file_id
		if ( empty( $file_id_hash ) ) {
			$file_id_hash = md5( $file_id );
		}

		// Verify the file-specific nonce using the hash
		$file_nonce = $request->get_param( 'file_nonce' );
		if ( ! $file_nonce || ! wp_verify_nonce( $file_nonce, 'jetpack_forms_view_file_' . $file_id_hash ) ) {
			return new WP_Error(
				'rest_forbidden',
				esc_html__( 'Invalid or missing file access token.', 'jetpack-forms' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Retrieves a file using the file_id and serves it to the client.
	 *
	 * @param \WP_REST_Request $request The current request object.
	 * @return \WP_REST_Response|\WP_Error Response object or error.
	 */
	public function get_file( $request ) {
		$file_id = $request->get_param( 'file_id' );

		// Initialize the file handler
		$file_handler = new Contact_Form_File_Handler();

		// Get the full file path
		$file_path = $file_handler->get_file_path( $file_id );

		if ( empty( $file_path ) || ! file_exists( $file_path ) ) {
			// Log the failure for debugging using WordPress logging
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				// Use apply_filters instead of direct error_log for debugging
				do_action( 'jetpack_forms_debug_message', sprintf( 'Jetpack Forms: File not found. ID: %s, Path: %s', $file_id, $file_path ) );
			}

			return new WP_Error(
				'file_not_found',
				esc_html__( 'The requested file does not exist.', 'jetpack-forms' ),
				array( 'status' => 404 )
			);
		}

		// Get the file mime type
		$mime_type = $this->get_file_mime_type( $file_path );

		// Use WP_Filesystem to read and output the file instead of readfile()
		require_once ABSPATH . 'wp-admin/includes/file.php';
		WP_Filesystem();
		global $wp_filesystem;

		nocache_headers();
		header( 'X-Robots-Tag: noindex', true );
		header( 'Content-Type: ' . $mime_type );
		header( 'Content-Description: File Transfer' );
		header( 'Content-Disposition: inline; filename="' . wp_basename( $file_path ) . '"' );
		header( 'Content-Transfer-Encoding: binary' );
		header( 'Content-Length: ' . $wp_filesystem->size( $file_path ) );
		header( 'Cache-Control: must-revalidate, post-check=0, pre-check=0' );

		// Clear any previous output buffers
		while ( ob_get_level() ) {
			ob_end_clean();
		}

		if ( $wp_filesystem->exists( $file_path ) ) {
			echo $wp_filesystem->get_contents( $file_path ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- File contents should not be escaped
		}
		exit;
	}

	/**
	 * Get the mime type of a file.
	 *
	 * @param string $file_path Path to the file.
	 * @return string The mime type.
	 */
	protected function get_file_mime_type( $file_path ) {
		$mime_type = mime_content_type( $file_path );
		if ( false === $mime_type ) {
			// Fallback to a generic mime type
			$mime_type = 'application/octet-stream';
		}
		return $mime_type;
	}
}
