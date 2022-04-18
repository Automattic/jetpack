<?php
/**
 * Implement the URL normalizer.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Url
 */
class Url {

	const PARAMS_TO_EXCLUDE   = array( 'utm_campaign', 'utm_medium', 'utm_source', 'utm_content', 'fbclid', '_ga', 'jb-disable-modules' );
	const PARAMS_TO_NORMALIZE = array( 's' => '' );

	/**
	 * Normalize a URL - right now, just make sure it's absolute.
	 *
	 * @param string $url The URL.
	 *
	 * @return string
	 */
	public static function normalize( $url ) {
		$url = self::normalize_query_args( $url );
		if ( '/' === $url[0] ) {
			$url = site_url( $url );
		}

		return rtrim( $url, '/' );
	}

	/**
	 * Returns the current URL.
	 *
	 * @return string
	 */
	public static function get_current_url() {
		// Fallback to the site URL if we're unable to determine the URL from $_SERVER global.
		$current_url = site_url();

		if ( isset( $_SERVER ) && is_array( $_SERVER ) ) {
			// phpcs:disable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Sanitization happens at the end
			$scheme = isset( $_SERVER['HTTPS'] ) && 'on' === $_SERVER['HTTPS'] ? 'https' : 'http';
			$host   = ! empty( $_SERVER['HTTP_HOST'] ) ? wp_unslash( $_SERVER['HTTP_HOST'] ) : null;
			$path   = ! empty( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '';

			// Support for local plugin development and testing using ngrok.
			if ( ! empty( $_SERVER['HTTP_X_ORIGINAL_HOST'] ) && false !== strpos( $_SERVER['HTTP_X_ORIGINAL_HOST'], 'ngrok.io' ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput -- This is validating.
				$host = wp_unslash( $_SERVER['HTTP_X_ORIGINAL_HOST'] );
			}
			// phpcs:enable WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

			if ( $host ) {
				$current_url = esc_url_raw( sprintf( '%s://%s%s', $scheme, $host, $path ) );
			}
		}

		return apply_filters( 'jetpack_boost_current_url', $current_url );
	}

	/**
	 * Remove and reorder query parameters.
	 *
	 * @param string $url URL.
	 *
	 * @return string
	 */
	protected static function normalize_query_args( $url ) {
		$exclude_parameters = apply_filters(
			'jetpack_boost_excluded_query_parameters',
			self::PARAMS_TO_EXCLUDE
		);

		// Filter out certain parameters that we know don't constitute a different page.
		$url = remove_query_arg( $exclude_parameters, $url );

		// Extract the query string, sort it and replace it in the current URL.
		$parsed_url = wp_parse_url( $url );

		if ( ! empty( $parsed_url['query'] ) ) {
			parse_str( $parsed_url['query'], $args );
			foreach ( self::PARAMS_TO_NORMALIZE as $key => $value ) {
				if ( isset( $args[ $key ] ) ) {
					$args[ $key ] = $value;
				}
			}
			ksort( $args );
			$sorted_query = http_build_query( $args );
			$url          = str_replace( '?' . $parsed_url['query'], '?' . $sorted_query, $url );
		}

		return $url;
	}
}
