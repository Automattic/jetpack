<?php

require_once dirname( __FILE__ ) . '/../class.json-api.php';

class WPCOM_JSON_API_Links {
	private $api;
	private static $instance;

	public static function getInstance() {
		if (null === static::$instance) {
			static::$instance = new static();
		}
		
		return static::$instance;
	}

	// protect these methods for singleton
	protected function __construct() { 
		$this->api = WPCOM_JSON_API::init();
	}
	private function __clone() { }
	private function __wakeup() { }

	/**
	 * Generate a URL to an endpoint
	 *
	 * Used to construct meta links in API responses
	 *
	 * @param mixed $args Optional arguments to be appended to URL
	 * @return string Endpoint URL
	 **/
	function get_link() {
		$args   = func_get_args();
		$format = array_shift( $args );
		$base = WPCOM_JSON_API__BASE;

		$path = array_pop( $args );

		if ( $path ) {
			$path = '/' . ltrim( $path, '/' );
		}

		$args[] = $path;

		// Escape any % in args before using sprintf
		$escaped_args = array();
		foreach ( $args as $arg_key => $arg_value ) {
			$escaped_args[ $arg_key ] = str_replace( '%', '%%', $arg_value );
		}

		$relative_path = vsprintf( "$format%s", $escaped_args );

		if ( ! wp_startswith( $relative_path, '.' ) ) {
			// Generic version. Match the requested version as best we can
			$api_version = $this->get_closest_version_of_endpoint( $format, $relative_path );
			$base        = substr( $base, 0, - 1 ) . $api_version;
		}

		// escape any % in the relative path before running it through sprintf again
		$relative_path = str_replace( '%', '%%', $relative_path );
		// http, WPCOM_JSON_API__BASE, ...    , path
		// %s  , %s                  , $format, %s
		return esc_url_raw( sprintf( "https://%s$relative_path", $base ) );
	}

	function get_me_link( $path = '' ) {
		return $this->get_link( '/me', $path );
	}

	function get_taxonomy_link( $blog_id, $taxonomy_id, $taxonomy_type, $path = '' ) {
		switch ( $taxonomy_type ) {
			case 'category':
				return $this->get_link( '/sites/%d/categories/slug:%s', $blog_id, $taxonomy_id, $path );

			case 'post_tag':
				return $this->get_link( '/sites/%d/tags/slug:%s', $blog_id, $taxonomy_id, $path );

			default:
				return $this->get_link( '/sites/%d/taxonomies/%s/terms/slug:%s', $blog_id, $taxonomy_type, $taxonomy_id, $path );
		}
	}

	function get_media_link( $blog_id, $media_id, $path = '' ) {
		return $this->get_link( '/sites/%d/media/%d', $blog_id, $media_id, $path );
	}

	function get_site_link( $blog_id, $path = '' ) {
		return $this->get_link( '/sites/%d', $blog_id, $path );
	}

	function get_post_link( $blog_id, $post_id, $path = '' ) {
		return $this->get_link( '/sites/%d/posts/%d', $blog_id, $post_id, $path );
	}

	function get_comment_link( $blog_id, $comment_id, $path = '' ) {
		return $this->get_link( '/sites/%d/comments/%d', $blog_id, $comment_id, $path );
	}

	function get_publicize_connection_link( $blog_id, $publicize_connection_id, $path = '' ) {
		return $this->get_link( '.1/sites/%d/publicize-connections/%d', $blog_id, $publicize_connection_id, $path );
	}

	function get_publicize_connections_link( $keyring_token_id, $path = '' ) {
		return $this->get_link( '.1/me/publicize-connections/?keyring_connection_ID=%d', $keyring_token_id, $path );
	}

	function get_keyring_connection_link( $keyring_token_id, $path = '' ) {
		return $this->get_link( '.1/me/keyring-connections/%d', $keyring_token_id, $path );
	}

	function get_external_service_link( $external_service, $path = '' ) {
		return $this->get_link( '.1/meta/external-services/%s', $external_service, $path );
	}

	/**
	 * Try to find the closest supported version of an endpoint to the current endpoint
	 *
	 * For example, if we were looking at the path /animals/panda:
	 * - if the current endpoint is v1.3 and there is a v1.3 of /animals/%s available, we return 1.3
	 * - if the current endpoint is v1.3 and there is no v1.3 of /animals/%s known, we fall back to the
	 *   maximum available version of /animals/%s, e.g. 1.1
	 *
	 * This method is used in get_link() to construct meta links for API responses.
	 * 
	 * @param $template_path The generic endpoint path, e.g. /sites/%s
	 * @param $path string The current endpoint path, relative to the version, e.g. /sites/12345
	 * @param $method string Request method used to access the endpoint path
	 * @return string The current version, or otherwise the maximum version available
	 */
	function get_closest_version_of_endpoint( $template_path, $path, $request_method = 'GET' ) {
		static $closest_endpoint_cache;

		if ( ! $closest_endpoint_cache ) {
			$closest_endpoint_cache = array();
		}

		if ( ! isset( $closest_endpoint_cache[ $template_path ] ) ) {
			$closest_endpoint_cache[ $template_path ] = array();
		} elseif ( isset( $closest_endpoint_cache[ $template_path ][ $request_method ] ) ) {
			return $closest_endpoint_cache[ $template_path ][ $request_method ];	
		}

		$path = untrailingslashit( $path );

		// /help is a special case - always use the current request version
		if ( wp_endswith( $path, '/help' ) ) {
			return $closest_endpoint_cache[ $template_path ][ $request_method ] = $this->api->version;
		}

		static $matches;
		if ( empty( $matches ) ) {
			$matches = array();
		} else {
			// try to match out of saved matches
			foreach( $matches as $match ) {
				$regex = $match->regex;
				if ( preg_match( "#^$regex\$#", $path ) ) {
					return $closest_endpoint_cache[ $template_path ][ $request_method ] = $match->version;
				}
			}
		}

		$endpoint_path_versions = $this->get_endpoint_path_versions();
		$last_path_segment = $this->get_last_segment_of_relative_path( $path );
		$max_version_found = null;

		foreach ( $endpoint_path_versions as $endpoint_last_path_segment => $endpoints ) {

			// Does the last part of the path match the path key? (e.g. 'posts')
			// If the last part contains a placeholder (e.g. %s), we want to carry on
			if ( $last_path_segment != $endpoint_last_path_segment && ! strstr( $endpoint_last_path_segment, '%' ) ) {
				continue;
			}

			foreach ( $endpoints as $endpoint ) {
				// Does the request method match?
				if ( ! in_array( $request_method, $endpoint['request_methods'] ) ) {
					continue;
				}

				$endpoint_path = untrailingslashit( $endpoint['path'] );
				$endpoint_path_regex = str_replace( array( '%s', '%d' ), array( '([^/?&]+)', '(\d+)' ), $endpoint_path );

				if ( ! preg_match( "#^$endpoint_path_regex\$#", $path ) ) {
					continue;
				}

				// Make sure the endpoint exists at the same version
				if ( version_compare( $this->api->version, $endpoint['min_version'], '>=') &&
					 version_compare( $this->api->version, $endpoint['max_version'], '<=') ) {
					array_push( $matches, (object) array( 'version' => $this->api->version, 'regex' => $endpoint_path_regex ) );
					return $closest_endpoint_cache[ $template_path ][ $request_method ] = $this->api->version;
				}

				// If the endpoint doesn't exist at the same version, record the max version we found
				if ( empty( $max_version_found ) || version_compare( $max_version_found['version'], $endpoint['max_version'], '<' ) ) {
					$max_version_found = array( 'version' => $endpoint['max_version'], 'regex' => $endpoint_path_regex );
				}
			}
		}

		// If the endpoint version is less than the requested endpoint version, return the max version found
		if ( ! empty( $max_version_found ) ) {
			array_push( $matches, (object) $max_version_found );
			return $max_version_found['version'];
		}

		// Otherwise, use the API version of the current request
		return $this->api->version;
	}

	/**
	 * Get an array of endpoint paths with their associated versions
	 *
	 * The result is cached for 30 minutes.
	 *
	 * @return array Array of endpoint paths, min_versions and max_versions, keyed by last segment of path
	 **/
	protected function get_endpoint_path_versions() {

		static $cache_result;

		if ( ! empty ( $cache_result ) ) {
			return $cache_result;
		}

		/*
		 * Create a map of endpoints and their min/max versions keyed by the last segment of the path (e.g. 'posts')
		 * This reduces the search space when finding endpoint matches in get_closest_version_of_endpoint()
		 */
		$endpoint_path_versions = array();

		foreach ( $this->api->endpoints as $key => $endpoint_objects ) {

			// The key contains a serialized path, min_version and max_version
			list( $path, $min_version, $max_version ) = unserialize( $key );

			// Grab the last component of the relative path to use as the top-level key
			$last_path_segment = $this->get_last_segment_of_relative_path( $path );

			$endpoint_path_versions[ $last_path_segment ][] = array(
				'path' => $path,
				'min_version' => $min_version,
				'max_version' => $max_version,
				'request_methods' => array_keys( $endpoint_objects )
			);
		}

		$cache_result = $endpoint_path_versions;

		return $endpoint_path_versions;
	}

	/**
	 * Grab the last segment of a relative path
	 *
	 * @param string $path Path
	 * @return string Last path segment
	 */
	protected function get_last_segment_of_relative_path( $path) {
		$path_parts = array_filter( explode( '/', $path ) );

		if ( empty( $path_parts ) ) {
			return null;
		}

		return end( $path_parts );
	}
}
