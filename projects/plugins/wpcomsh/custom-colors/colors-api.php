<?php

class Colors_API {
	static $valid_routes = array( 'palettes', 'patterns' );
	static $valid_args   = array( 'colors', 'color', 'limit', 'offset' );
	static $base         = 'colors/';

	static function call( $route = false, $args = array(), $id = false ) {
		if ( ! self::is_valid_route( $route ) ) {
			return new WP_Error( 'Invalid route.' );
		}
		$args = self::validate_args( $args );
		if ( false === $args ) {
			return new WP_Error( 'Arguments should be an array.' );
		}
		if ( empty( $args ) ) {
			$args = null;
		}
		$url = self::$base . $route;
		if ( $id ) {
			$url = $url . '/' . absint( $id );
		}
		$response = self::wpcom_json_api_request_as_blog( $url, 2, array( 'method' => 'GET' ), $args, 'wpcom' );
		if ( is_wp_error( $response ) || 200 !== $response['response']['code'] || ! isset( $response['body'] ) ) {
			return array();
		}
		return json_decode( $response['body'], true );
	}

	static function is_valid_route( $route ) {
		return in_array( $route, self::$valid_routes );
	}

	static function validate_args( $args ) {
		if ( ! is_array( $args ) ) {
			return false;
		}
		$valid_args = array();
		foreach ( $args as $arg => $value ) {
			if ( in_array( $arg, self::$valid_args ) ) {
				$valid_args[ $arg ] = $value;
			}
		}
		return $valid_args;
	}

	/**
	 * Query the WordPress.com REST API using the blog token
	 *
	 * Based on `wpcom_json_api_request_as_blog` in fbhepr%2Skers%2Swrgcnpx%2Spynff.wrgcnpx%2Qpyvrag.cuc-og
	 * Modified to work with v2 wpcom endpoints
	 *
	 * @param string $path
	 * @param string $version
	 * @param array  $args
	 * @param string $body
	 * @param string $base_api_path Determines the base API path for jetpack requests; defaults to 'rest'
	 * @return array|WP_Error $response Data.
	 */
	static function wpcom_json_api_request_as_blog( $path, $version = 1, $args = array(), $body = null, $base_api_path = 'rest' ) {
		$filtered_args = array_intersect_key(
			$args,
			array(
				'method'      => 'string',
				'timeout'     => 'int',
				'redirection' => 'int',
				'stream'      => 'boolean',
				'filename'    => 'string',
				'sslverify'   => 'boolean',
			)
		);

		/**
		 * Determines whether Jetpack can send outbound https requests to the WPCOM api.
		 *
		 * @since 3.6.0
		 *
		 * @param bool $proto Defaults to true.
		 */
		$proto = apply_filters( 'jetpack_can_make_outbound_https', true ) ? 'https' : 'http';

		// unprecedingslashit
		$_path = preg_replace( '/^\//', '', $path );

		// Use GET by default whereas `remote_request` uses POST
		if ( isset( $filtered_args['method'] ) && strtoupper( $filtered_args['method'] === 'POST' ) ) {
			$request_method = 'POST';
		} else {
			$request_method = 'GET';
		}

		$validated_args = array_merge(
			$filtered_args,
			array(
				'url'     => sprintf( '%s://%s/%s/v%s/%s', $proto, JETPACK__WPCOM_JSON_API_HOST, $base_api_path, $version, $_path ),
				'blog_id' => (int) Jetpack_Options::get_option( 'id' ),
				'method'  => $request_method,
			)
		);

		return Automattic\Jetpack\Connection\Client::remote_request( $validated_args, $body );
	}
}

new Colors_API();

