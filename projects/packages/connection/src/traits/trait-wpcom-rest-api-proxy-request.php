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
		error_log( 'DEBUG Jetpack Forms Upload - File params: ' . print_r( $files, true ) );

		error_log( 'THE BODY: ' . $request->get_body() );

		if ( ! empty( $files ) ) {
			// Generate a boundary for multipart/form-data
			$boundary = wp_generate_password( 24, false );

			$request_options = array_replace_recursive(
				array(
					'headers'      => array(
						'Content-Type'    => 'multipart/form-data; boundary=' . $boundary,
						'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
					),
					'method'       => $request->get_method(),
					'timeout'      => 60,
					'httpversion'  => '1.1',
					'sslverify'    => false,
					'curl_options' => array(
						CURLOPT_BUFFERSIZE     => 128000,
						CURLOPT_FRESH_CONNECT  => true,
						CURLOPT_FORBID_REUSE   => true,
						CURLOPT_CONNECTTIMEOUT => 30,
						CURLOPT_SSL_VERIFYPEER => false,
						CURLOPT_SSL_VERIFYHOST => 0,
					),
				),
				$request_options
			);

			// Build multipart body
			$body = '';

			// Add files to the body
			foreach ( $files as $name => $file ) {
				error_log( 'DEBUG Jetpack Forms Upload - Processing file: ' . $name . ' - ' . print_r( $file, true ) );
				$file_path = $file['tmp_name'];

				if ( ! empty( $file_path ) && file_exists( $file_path ) ) {
					$body .= "--{$boundary}\r\n";
					$body .= 'Content-Disposition: form-data; name="' . $name . '"; filename="' . basename( $file['name'] ) . '"' . "\r\n";
					$body .= 'Content-Type: ' . $file['type'] . "\r\n\r\n";

					// $handle     = fopen( $file_path, 'rb' );
					// $file_size  = filesize( $file_path );
					// $chunk_size = 8192; // 8KB chunks

					// $total_bytes_read = 0;
					// while ( ! feof( $handle ) ) {
					// $chunk = fread( $handle, $chunk_size );
					// if ( $chunk === false ) {
					// error_log( 'DEBUG Jetpack Forms Upload - Error reading chunk at position: ' . $total_bytes_read );
					// break;
					// }
					// $body             .= $chunk;
					// $total_bytes_read += strlen( $chunk );
					// }
					// fclose( $handle );
					$body .= "\r\n";

					error_log( 'DEBUG Jetpack Forms Upload - Added file to body: ' . $name . ' with size: ' . $total_bytes_read . ' of ' . $file_size . ' bytes' );
				} else {
					error_log( 'DEBUG Jetpack Forms Upload - File not found or empty: ' . $name . ' - path: ' . $file_path );
				}
			}

			// Add other POST parameters
			$params = $request->get_body_params();
			if ( ! empty( $params ) ) {
				foreach ( $params as $name => $value ) {
					$body .= "--{$boundary}\r\n";
					$body .= 'Content-Disposition: form-data; name="' . $name . '"' . "\r\n\r\n";
					$body .= $value . "\r\n";
				}
			}

			// Close the multipart form data with two hyphens at the end of the boundary
			$body .= "--{$boundary}--\r\n\r\n";

			// Log information about the body without trying to print the binary data
			error_log( 'DEBUG Jetpack Forms Upload - Body structure:' );
			error_log( 'DEBUG Jetpack Forms Upload - Total body length: ' . strlen( $body ) . ' bytes' );
			error_log( 'DEBUG Jetpack Forms Upload - Boundary: ' . $boundary );
			error_log( 'DEBUG Jetpack Forms Upload - Content-Type: ' . $request_options['headers']['Content-Type'] );

			// Add the body to the request options
			$request_options['body'] = $body;

			error_log(
				'DEBUG Jetpack Forms Upload - Final request options (without body content): ' . print_r(
					array_merge(
						$request_options,
						array( 'body' => '[' . strlen( $request_options['body'] ) . ' bytes of data]' )
					),
					true
				)
			);
		} else {
			$request_options = array_replace_recursive(
				array(
					'headers' => array(
						'Content-Type'    => 'application/json',
						'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
					),
					'method'  => $request->get_method(),
				),
				$request_options
			);

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
