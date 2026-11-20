<?php
/**
 * Tests for VideoPress stats requests.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WorDBless\BaseTestCase;
use WP_Error;

/**
 * Tests for VideoPress stats requests.
 */
class Stats_Test extends BaseTestCase {

	/**
	 * Preserve API parameters when PHP uses HTML query separators.
	 */
	public function test_featured_stats_with_html_query_separator() {
		$original_separator = ini_get( 'arg_separator.output' );
		$query              = array();
		$capture_url        = static function ( $url ) use ( &$query ) {
			parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $query );
			return $url;
		};
		$prevent_http       = static function () {
			return new WP_Error( 'test_request_blocked' );
		};

		add_filter( 'jetpack_remote_request_url', $capture_url );
		add_filter( 'pre_http_request', $prevent_http );
		ini_set( 'arg_separator.output', '&amp;' );

		try {
			Stats::get_featured_stats( 60, 'day' );
		} finally {
			ini_set( 'arg_separator.output', $original_separator );
			remove_filter( 'jetpack_remote_request_url', $capture_url );
			remove_filter( 'pre_http_request', $prevent_http );
		}

		$this->assertSame(
			array(
				'check_stats_module' => 'false',
				'period'             => 'day',
				'num'                => '60',
				'complete_stats'     => '1',
			),
			$query
		);
	}
}
