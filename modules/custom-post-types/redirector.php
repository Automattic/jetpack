<?php

/**
 * Jetpack Redirector
 * Simple method to handle redirects in a scalable manner.
 * Forked from https://vip.wordpress.com/plugins/wpcom-legacy-redirector/
 *
 *  Maintain support for preexisting permalinks after importing or otherwise changing permalink structure.
 *
 * Some things were removed from the VIP plugin for simplicity:
 *   * CLI tooling
 *   * Functionality for adding redirects in wp-admin
 *
 * For now, this has no UI. Data entry is bulk-loaded via WXR / import or custom scripts.
 *
 * Redirects are stored as a custom post type (`jetpack-redirect`) and use the following fields:
 *
 * - post_name for the sha224 hash of the "from" path or URL.
 *  - we use this column, since it's indexed and queries are super fast.
 *  - we also use an sha224 just to simplify the storage.
 * - post_title to store the non-sha224 version of the "from" path.
 * - one of either:
 *  - post_parent if we're redirect to a post; or
 *  - post_excerpt if we're redirecting to an alternate URL.
 */

class Jetpack_Redirector {
	const POST_TYPE = 'jetpack-redirect';
	const CACHE_GROUP = 'jetpack-redirect';

	static function init() {
		register_post_type( self::POST_TYPE, array( 'public' => false ) );

		// hook in early, before the canonical redirect
		add_filter( 'template_redirect', array( 'Jetpack_Redirector', 'maybe_do_redirect' ), 0 );
	}

	static function maybe_do_redirect() {
		// Avoid the overhead of running this on every single pageload.
		// We move the overhead to the 404 page but the trade-off for site performance is worth it.
		if ( ! is_404() ) {
			return;
		}

		$url = parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH );

		if ( ! empty( $_SERVER['QUERY_STRING'] ) ) {
			$url .= '?' . $_SERVER['QUERY_STRING'];
		}

		$request_path = apply_filters( 'jetpack_redirector_request_path', $url );

		if ( empty( $request_path ) ) {
			return;
		}

		$redirect_uri = self::get_redirect_uri( $request_path );

		if ( empty( $redirect_uri ) ) {
			return;
		}

		header( 'X-jetpack-redirector: HIT' );
		$redirect_status = apply_filters( 'jetpack_redirector_redirect_status', 301, $url );
		wp_safe_redirect( $redirect_uri, $redirect_status );
		exit;
	}

	static function get_redirect_uri( $passed_url ) {
		$url = self::normalize_url( $passed_url );

		if ( is_wp_error( $url ) ) {
			return false;
		}

		// Allowed list of Params that should be pass through as is.
		$protected_params = apply_filters( 'jetpack_redirector_preserve_query_params', array(), $url );
		$protected_param_values = array();
		$param_values = array();

		// Parse URL to get Query Params.
		$query_params = wp_parse_url( $url, PHP_URL_QUERY );

		if ( ! empty( $query_params ) ) {
			// Parse Query String to Associated Array.
			parse_str( $query_params, $param_values );

			// For every allowed param save value and strip from url
			foreach ( $protected_params as $protected_param ) {
				if ( ! empty( $param_values[ $protected_param ] ) ) {
					$protected_param_values[ $protected_param ] = $param_values[ $protected_param ];
					$url = remove_query_arg( $protected_param, $url );
				}
			}
		}

		$url_hash = self::get_url_hash( $url );

		$redirect_post_id = wp_cache_get( $url_hash, self::CACHE_GROUP );

		if ( false === $redirect_post_id ) {
			$redirect_post_id = self::get_redirect_post_id( $url );
			wp_cache_add( $url_hash, $redirect_post_id, self::CACHE_GROUP );
		}

		if ( $redirect_post_id ) {
			$redirect_post = get_post( $redirect_post_id );

			if ( ! $redirect_post instanceof WP_Post ) {
				// If redirect post object doesn't exist, update the cache
				wp_cache_set( $url_hash, 0, self::CACHE_GROUP );
				return false;
			} elseif ( 0 !== $redirect_post->post_parent ) {
				// Add allowed params to the redirect URL.
				return add_query_arg( $protected_param_values, get_permalink( $redirect_post->post_parent ) );
			} elseif ( ! empty( $redirect_post->post_excerpt ) ) {
				// Add allowed params to the redirect URL.
				return add_query_arg( $protected_param_values, esc_url_raw( $redirect_post->post_excerpt ) );
			}
		}

		return false;
	}

	static function get_redirect_post_id( $url ) {
		global $wpdb;

		$redirect_post_id = $wpdb->get_var( $wpdb->prepare(
			"SELECT
				ID
				FROM $wpdb->posts
				WHERE post_type = %s
				AND post_name = %s
				LIMIT 1",
			self::POST_TYPE,
			self::get_url_hash( $url )
		) );

		if ( ! $redirect_post_id ) {
			$redirect_post_id = 0;
		}

		return $redirect_post_id;
	}

	private static function get_url_hash( $url ) {
		return hash( 'sha224', $url );
	}

	/**
	 * Takes a request URL and "normalizes" it, stripping common elements
	 *
	 * Removes scheme and host from the URL, as redirects should be independent of these.
	 *
	 * @param string $url URL to transform
	 *
	 * @return string $url Transformed URL
	 */
	private static function normalize_url( $url ) {
		// Sanitise the URL first rather than trying to normalize a non-URL
		$url = esc_url_raw( $url );
		if ( empty( $url ) ) {
			return new WP_Error( 'invalid-redirect-url', 'The URL does not validate' );
		}

		// Break up the URL into it's constituent parts
		$components = wp_parse_url( $url );

		// Avoid playing with unexpected data
		if ( ! is_array( $components ) ) {
			return new WP_Error( 'url-parse-failed', 'The URL could not be parsed' );
		}

		$query = empty( $components['query'] ) ? '' : $components['query'];
		$path = empty( $components['path'] ) ? '' : $components['path'];

		// We should have at least a path or query
		if ( empty( $path ) && empty( $query ) ) {
			return new WP_Error( 'url-parse-failed', 'The URL contains neither a path nor query string' );
		}

		// All we want is path and query strings
		// Note this strips hash fragments (`#` & everything after)
		if ( empty( $query ) ) {
			return $path;
		}

		// Include `?` and the query if there is one
		return $path . '?' . $components['query'];
	}
}

add_action( 'init', array( 'Jetpack_Redirector', 'init' ) );
