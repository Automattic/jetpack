<?php
/**
 * Stats WPCOM_Stats
 *
 * @package automattic/jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;

/**
 * Stats WPCOM_Stats class.
 *
 * Responsible for fetching Stats related data from WPCOM.
 *
 * @since $$next-version$$
 */
class WPCOM_Stats {
	/**
	 * WPCOM Stats CSV Url.
	 */
	const STATS_CSV_URL = 'https://stats.wordpress.com/csv.php';

	/**
	 * Get stats from WordPress.com
	 *
	 * @param string $table The stats which you want to retrieve: postviews, or searchterms.
	 * @param array  $args {
	 *      An associative array of arguments.
	 *
	 *      @type bool    $end        The last day of the desired time frame. Format is 'Y-m-d' (e.g. 2007-05-01)
	 *                                and default timezone is UTC date. Default value is Now.
	 *      @type string  $days       The length of the desired time frame. Default is 30. Maximum 90 days.
	 *      @type int     $limit      The maximum number of records to return. Default is 10. Maximum 100.
	 *      @type int     $post_id    The ID of the post to retrieve stats data for
	 *      @type string  $summarize  If present, summarizes all matching records. Default Null.
	 *
	 * }
	 *
	 * @return array {
	 *      An array of post view data, each post as an array
	 *
	 *      array {
	 *          The post view data for a single post
	 *
	 *          @type string  $post_id         The ID of the post
	 *          @type string  $post_title      The title of the post
	 *          @type string  $post_permalink  The permalink for the post
	 *          @type string  $views           The number of views for the post within the $num_days specified
	 *      }
	 * }
	 */
	public static function get_csv( $table, $args = null ) {
		$defaults = array(
			'end'       => false,
			'days'      => false,
			'limit'     => 3,
			'post_id'   => false,
			'summarize' => '',
		);

		$args            = wp_parse_args( $args, $defaults );
		$args['table']   = $table;
		$args['blog_id'] = Jetpack_Options::get_option( 'id' );

		$stats_csv_url = add_query_arg( $args, self::STATS_CSV_URL );

		$key = md5( $stats_csv_url );

		// Get cache.
		$stats_cache = get_option( 'stats_cache' );
		if ( ! $stats_cache || ! is_array( $stats_cache ) ) {
			$stats_cache = array();
		}

		// Return or expire this key.
		if ( isset( $stats_cache[ $key ] ) ) {
			$time = key( $stats_cache[ $key ] );
			if ( time() - $time < 300 ) {
				return $stats_cache[ $key ][ $time ];
			}
			unset( $stats_cache[ $key ] );
		}

		$stats_rows = array();
		do {
			$stats = self::get_remote_csv( $stats_csv_url );
			if ( ! $stats ) {
				break;
			}

			$labels = array_shift( $stats );

			if ( 0 === stripos( $labels[0], 'error' ) ) {
				break;
			}

			$stats_rows = array();
			for ( $s = 0; isset( $stats[ $s ] ); $s++ ) {
				$row = array();
				foreach ( $labels as $col => $label ) {
					$row[ $label ] = $stats[ $s ][ $col ];
				}
				$stats_rows[] = $row;
			}
		} while ( 0 );

		// Expire old keys.
		foreach ( $stats_cache as $k => $cache ) {
			if ( ! is_array( $cache ) || 300 < time() - key( $cache ) ) {
				unset( $stats_cache[ $k ] );
			}
		}

			// Set cache.
			$stats_cache[ $key ] = array( time() => $stats_rows );
		update_option( 'stats_cache', $stats_cache );

		return $stats_rows;
	}

	/**
	 * Stats get remote CSV.
	 *
	 * @param mixed $url URL.
	 * @return array
	 */
	public static function get_remote_csv( $url ) {
		$method  = 'GET';
		$timeout = 90;
		$user_id = 0; // Blog token.

		$get      = Client::remote_request( compact( 'url', 'method', 'timeout', 'user_id' ) );
		$get_code = wp_remote_retrieve_response_code( $get );
		// @todo Make readable.
		if ( is_wp_error( $get ) || ( 2 !== (int) ( $get_code / 100 ) && 304 !== $get_code ) || empty( $get['body'] ) ) {
			return array(); // @todo: return an error?
		} else {
			return self::stats_str_getcsv( $get['body'] );
		}
	}

	/**
	 * Recursively run str_getcsv on the stats csv.
	 *
	 * @since-jetpack 9.7.0 Remove custom handling since str_getcsv is available on all servers running this now.
	 *
	 * @param mixed $csv CSV.
	 * @return array.
	 */
	public static function stats_str_getcsv( $csv ) {
		$lines = str_getcsv( $csv, "\n" );
		return array_map( 'str_getcsv', $lines );
	}

	/**
	 * Abstract out building the rest api stats path.
	 *
	 * @param  string $resource Resource.
	 * @return string
	 */
	public static function jetpack_stats_api_path( $resource = '' ) {
		$resource = ltrim( $resource, '/' );
		return sprintf( '/sites/%d/stats/%s', Jetpack_Options::get_option( 'id' ), $resource );
	}

	/**
	 * Fetches stats data from the REST API.  Caches locally for 5 minutes.
	 *
	 * @link: https://developer.wordpress.com/docs/api/1.1/get/sites/%24site/stats/
	 *
	 * @param array  $args (default: array())  The args that are passed to the endpoint.
	 * @param string $resource (default: '') Optional sub-endpoint following /stats/.
	 * @return array|WP_Error.
	 */
	public static function get_from_restapi( $args = array(), $resource = '' ) {
		$endpoint    = self::jetpack_stats_api_path( $resource );
		$api_version = '1.1';
		$args        = wp_parse_args( $args, array() );
		$cache_key   = md5( implode( '|', array( $endpoint, $api_version, wp_json_encode( $args ) ) ) );

		$transient_name = "jetpack_restapi_stats_cache_{$cache_key}";

		$stats_cache = get_transient( $transient_name );

		// Return or expire this key.
		if ( $stats_cache ) {
			$time = key( $stats_cache );
			$data = $stats_cache[ $time ]; // WP_Error or string (JSON encoded object).

			if ( is_wp_error( $data ) ) {
				return $data;
			}

			return (object) array_merge( array( 'cached_at' => $time ), (array) json_decode( $data ) );
		}

		// Do the dirty work.
		$response = Client::wpcom_json_api_request_as_blog( $endpoint, $api_version, $args );
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			// WP_Error.
			$data = is_wp_error( $response ) ? $response : new WP_Error( 'stats_error' );
			// WP_Error.
			$return = $data;
		} else {
			// string (JSON encoded object).
			$data = wp_remote_retrieve_body( $response );
			// object (rare: null on JSON failure).
			$return = json_decode( $data );
		}

		// To reduce size in storage: store with time as key, store JSON encoded data (unless error).
		set_transient( $transient_name, array( time() => $data ), 5 * MINUTE_IN_SECONDS );

		return $return;
	}
}
