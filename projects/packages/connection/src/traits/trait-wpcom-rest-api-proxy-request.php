<?php
/**
 * Trait WPCOM_REST_API_Proxy_Request
 *
 * Used to proxy requests to wpcom servers.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection\Traits;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Status\Visitor;
use WP_Error;
use WP_REST_Request;

trait WPCOM_REST_API_Proxy_Request {

	/**
	 * Base path for the API.
	 *
	 * @var string
	 */
	protected $base_api_path;

	/**
	 * Version of the API.
	 *
	 * @var string
	 */
	protected $version;

	/**
	 * The base of the controller's route.
	 *
	 * @var string
	 */
	protected $rest_base;

	/**
	 * Proxy request to wpcom servers on behalf of a user or using the Site-level Connection (blog token).
	 *
	 * @param WP_REST_Request $request Request to proxy.
	 * @param string          $path Path to append to the rest base.
	 * @param string          $context Whether the request should be proxied on behalf of the current user or using the Site-level Connection, aka 'blog' token. Can be Either 'user' or 'blog'. Defaults to 'user'.
	 * @param bool            $allow_fallback_to_blog If the $context is 'user', whether we should fallback to using the Site-level Connection in case the current user is not connected.
	 * @param array           $request_options Request options to pass to wp_remote_request.
	 *
	 * @return mixed|WP_Error           Response from wpcom servers or an error.
	 */
	public function proxy_request_to_wpcom( $request, $path = '', $context = 'user', $allow_fallback_to_blog = false, $request_options = array() ) {
		$blog_id      = \Jetpack_Options::get_option( 'id' );
		$path         = '/sites/' . rawurldecode( $blog_id ) . '/' . rawurldecode( ltrim( $this->rest_base, '/' ) ) . ( $path ? '/' . rawurldecode( ltrim( $path, '/' ) ) : '' );
		$query_params = $request->get_query_params();
		$manager      = new Manager();

		/*
		 * A rest_route parameter can be added when using plain permalinks.
		 * It is not necessary to pass them to WordPress.com,
		 * and may even cause issues with some endpoints.
		 * Let's remove it.
		 */
		if ( isset( $query_params['rest_route'] ) ) {
			unset( $query_params['rest_route'] );
		}
		$api_url = add_query_arg( $query_params, $path );

		// Check if this is a file upload request
		$files = $request->get_file_params();

		if ( ! empty( $files ) ) {
			$request_options = $this->get_request_options_for_file_upload( $request, $files, $request_options );
			$body            = $request_options['body'];
		} else {
			$request_options = $this->build_request_header( $request_options, 'application/json', $request->get_method() );

			// If no body is present, passing it as $request->get_body() will cause an error.
			$body = $request->get_body() ? $request->get_body() : null;
		}

		$response = new WP_Error(
			'rest_unauthorized',
			__( 'Please connect your user account to WordPress.com', 'jetpack-connection' ),
			array( 'status' => rest_authorization_required_code() )
		);

		if ( 'user' === $context ) {
			if ( ! $manager->is_user_connected() ) {
				if ( false === $allow_fallback_to_blog ) {
					return $response;
				}

				$context = 'blog';
			} else {
				$response = Client::wpcom_json_api_request_as_user( $api_url, $this->version, $request_options, $body, $this->base_api_path );
			}
		}

		if ( 'blog' === $context ) {
			if ( ! $manager->is_connected() ) {
				return $response;
			}

			$response = Client::wpcom_json_api_request_as_blog( $api_url, $this->version, $request_options, $body, $this->base_api_path );
		}

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_status = wp_remote_retrieve_response_code( $response );
		$response_body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $response_status >= 400 ) {
			$code    = $response_body['code'] ?? 'unknown_error';
			$message = $response_body['message'] ?? __( 'An unknown error occurred.', 'jetpack-connection' );

			return new WP_Error( $code, $message, array( 'status' => $response_status ) );
		}

		return $response_body;
	}

	/**
	 * Get request options for file upload.
	 *
	 * @param WP_REST_Request $request Request to proxy.
	 * @param array           $files Files to upload.
	 * @param array           $request_options Existing request options.
	 *
	 * @return array Request options for file upload.
	 */
	private function get_request_options_for_file_upload( $request, $files, $request_options = array() ) {
		$boundary = wp_generate_password( 24, false );

		$request_options = $this->build_request_header( $request_options, 'multipart/form-data; boundary=' . $boundary, $request->get_method() );

		$request_options['body'] = $this->build_multipart_body( $request, $files, $boundary );

		return $request_options;
	}

	/**
	 * Build the request headers for the file upload request.
	 *
	 * @param array  $request_options Existing request options.
	 * @param string $content_type    Content type for the request.
	 * @param string $request_method  HTTP method for the request.
	 *
	 * @return array Merged request options with the new headers.
	 */
	private function build_request_header( $request_options, $content_type, $request_method ) {
		return array_replace_recursive(
			array(
				'headers' => array(
					'Content-Type'    => $content_type,
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
				'method'  => $request_method,
			),
			$request_options
		);
	}

	/**
	 * Build the multipart body for the file upload request.
	 *
	 * @param WP_REST_Request $request Request to proxy.
	 * @param array           $files Files to upload.
	 * @param string          $boundary Boundary string for multipart.
	 *
	 * @return string Multipart body.
	 */
	private function build_multipart_body( $request, $files, $boundary ) {
		$body = '';

		$body .= $this->add_files_to_body( $files, $boundary );
		$body .= $this->add_params_to_body( $request->get_body_params(), $boundary );

		$body .= "--{$boundary}--\r\n\r\n";

		return $body;
	}

	/**
	 * Add files to the multipart body.
	 *
	 * @param array  $files Files to upload.
	 * @param string $boundary Boundary string for multipart.
	 *
	 * @return string Multipart body with files.
	 */
	private function add_files_to_body( $files, $boundary ) {
		$body = '';

		foreach ( $files as $name => $file ) {
			$file_path = $file['tmp_name'];

			if ( ! empty( $file_path ) && file_exists( $file_path ) ) {
				$body .= "--{$boundary}\r\n";
				$body .= 'Content-Disposition: form-data; name="' . $name . '"; filename="' . basename( $file['name'] ) . '"' . "\r\n";
				$body .= 'Content-Type: ' . $file['type'] . "\r\n\r\n";
				$body .= file_get_contents( $file_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
				$body .= "\r\n";
			}
		}

		return $body;
	}

	/**
	 * Add parameters to the multipart body.
	 *
	 * @param array  $params Parameters to add.
	 * @param string $boundary Boundary string for multipart.
	 *
	 * @return string Multipart body with parameters.
	 */
	private function add_params_to_body( $params, $boundary ) {
		$body = '';

		if ( ! empty( $params ) ) {
			foreach ( $params as $name => $value ) {
				$body .= "--{$boundary}\r\n";
				$body .= 'Content-Disposition: form-data; name="' . $name . '"' . "\r\n\r\n";
				$body .= $value . "\r\n";
			}
		}

		return $body;
	}

	/**
	 * Proxy request to wpcom servers on behalf of a user.
	 *
	 * @param WP_REST_Request $request Request to proxy.
	 * @param string          $path Path to append to the rest base.
	 * @param array           $request_options Request options to pass to wp_remote_request.
	 *
	 * @return mixed|WP_Error           Response from wpcom servers or an error.
	 */
	public function proxy_request_to_wpcom_as_user( $request, $path = '', $request_options = array() ) {
		return $this->proxy_request_to_wpcom( $request, $path, 'user', false, $request_options );
	}

	/**
	 * Proxy request to wpcom servers using the Site-level Connection (blog token).
	 *
	 * @param WP_REST_Request $request Request to proxy.
	 * @param string          $path Path to append to the rest base.
	 * @param array           $request_options Request options to pass to wp_remote_request.
	 *
	 * @return mixed|WP_Error           Response from wpcom servers or an error.
	 */
	public function proxy_request_to_wpcom_as_blog( $request, $path = '', $request_options = array() ) {
		return $this->proxy_request_to_wpcom( $request, $path, 'blog', false, $request_options );
	}
}
