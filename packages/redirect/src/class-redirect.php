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
	 * Strip http:// or https:// from a url, replaces forward slash with ::,
	 * so we can bring them directly to their site in calypso.
	 *
	 * @param string $url the full URL.
	 * @return string $url without the guff
	 */
	private static function build_raw_urls( $url ) {
		$strip_http = '/.*?:\/\//i';
		$url        = preg_replace( $strip_http, '', $url );
		$url        = str_replace( '/', '::', $url );
		return $url;
	}

	/**
	 * Builds and returns an URL using the jetpack.com/redirect service
	 *
	 * Note to WP.com: Changes to this method must be synced to wpcom
	 *
	 * @param string       $source The URL handler registered in the server.
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

		$url           = 'https://jetpack.com/redirect';
		$args          = wp_parse_args( $args, array( 'site' => self::build_raw_urls( get_home_url() ) ) );
		$accepted_args = array( 'site', 'path', 'query', 'anchor' );

		$to_be_added = array(
			'source' => rawurlencode( $source ),
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

		return $url;
	}
}
