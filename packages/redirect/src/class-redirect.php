<?php
/**
 * Jetpack Redirect package.
 *
 * @package  automattic/jetpack-redirect
 */

namespace Automattic\Jetpack;

/**
 * Class Redirect
 */
class Redirect {
	/**
	 * Constructor.
	 *
	 * Static-only class, so nothing here.
	 */
	private function __construct() {}

	/**
	 * Builds and returns an URL using the jetpack.com/redirect/ service
	 *
	 * If $source is a simple slug, it will be sent using the source query parameter. e.g. jetpack.com/redirect/?source=slug
	 *
	 * If $source is a full URL, starting with https://, it will be sent using the url query parameter. e.g. jetpack.com/redirect/?url=https://wordpress.com
	 *
	 * Note: if using full URL, query parameters and anchor must be passed in $args. Any querystring of url fragment in the URL will be discarded.
	 *
	 * @param string       $source The URL handler registered in the server or the full destination URL (starting with https://).
	 * @param array|string $args {
	 *    Optional. Additional arguments to build the url.
	 *
	 *    @type string $site URL of the site; Default is current site.
	 *    @type string $path Additional path to be appended to the URL.
	 *    @type string $query Query parameters to be added to the URL.
	 *    @type string $anchor Anchor to be added to the URL.
	 * }
	 *
	 * @return string The built URL
	 */
	public static function get_url( $source, $args = array() ) {

		$url           = 'https://jetpack.com/redirect/';
		$site_suffix   = ( new Status() )->get_site_suffix();
		$args          = wp_parse_args( $args, array( 'site' => $site_suffix ) );
		$accepted_args = array( 'site', 'path', 'query', 'anchor' );

		$source_key = 'source';
		$is_url     = false;

		if ( 0 === strpos( $source, 'https://' ) ) {
			$source_key = 'url';
			$is_url     = true;
			$source_url = \wp_parse_url( $source );

			// discard any query and fragments.
			$source = 'https://' . $source_url['host'] . ( isset( $source_url['path'] ) ? $source_url['path'] : '' );
		}

		$to_be_added = array(
			$source_key => rawurlencode( $source ),
		);

		foreach ( $args as $arg_name => $arg_value ) {

			if ( ! in_array( $arg_name, $accepted_args, true ) || empty( $arg_value ) ) {
				continue;
			}

			$to_be_added[ $arg_name ] = rawurlencode( $arg_value );

		}

		if ( ! empty( $to_be_added ) ) {
			$url = add_query_arg( $to_be_added, $url );
		}

		/**
		 * Filters the return of the Redirect URL.
		 *
		 * @since 8.6.0
		 *
		 * @param string  $url    The redirect URL.
		 * @param string  $source The $source informed to Redirect::get_url.
		 * @param array   $args   The arguments informed to Redirect::get_url.
		 * @param boolean $is_url Whether $source is a URL or not.
		 */
		return \apply_filters( 'jetpack_redirects_get_url', $url, $source, $args, $is_url );
	}
}
