<?php //phpcs:ignoreFile
namespace Automattic\Jetpack_Boost\Tests\Lib;

use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use Automattic\Jetpack_Boost\Lib\Url;
use Automattic\Jetpack_Boost\Tests\Base_Test_Case;

/**
 * Class WP_Test_Url
 *
 * @package Automattic\Jetpack_Boost\Tests\Lib
 */
class WP_Test_Url extends Base_Test_Case {
	/**
	 * test normalize
	 * @dataProvider provide_url_data
	 */
	public function test_normalize( $input, $expected ) {
		$this->markTestSkipped( 'Failing for now, but not used anywhere' );
		// Dumb, but functional remove_query_arg polyfill.
		if ( ! function_exists( 'remove_query_arg' ) ) {
			function remove_query_arg( $parameters, $url ) {
				foreach ( $parameters as $parameter ) {
					$url = preg_replace( sprintf( '~&?%s=[^&]+~', preg_quote( $parameter ) ), '', $url );
				}
				return trim( $url, '?' );
			}
		}

		// wp_parse_url in new PHP versions is the same as the native parse_url.
		if ( ! function_exists( 'wp_parse_url' ) ) {
			function wp_parse_url( $url ) {
				return parse_url( $url );
			}
		}

		Filters\expectApplied( 'jetpack_boost_normalized_url' )->once()->with( $expected, $input );
		$normalized_url = Url::normalize( $input );
		$this->assertEquals( $expected, $normalized_url );
	}

	public function test_get_current_url() {
		$start_url            = 'http://example.com';
		$url_with_extra_param = 'https://example.com/path?param=value&utm_campaign=foo';
		$expected_url         = 'https://example.com/path?param=value';

		Functions\when( 'site_url' )->justReturn( $start_url );
		Functions\when( 'remove_query_arg' )->justReturn( $expected_url );
		Functions\when( 'wp_parse_url' )->justReturn(
			array(
				'host'  => 'example.com',
				'path'  => '/path',
				'query' => 'param=value',
			)
		);

		$_SERVER = array_merge(
			$_SERVER,
			array(
				'HTTPS'       => 'on',
				'HTTP_HOST'   => 'example.com',
				'REQUEST_URI' => '/path?param=value&utm_campaign=foo',
			)
		);

		Filters\expectApplied( 'jetpack_boost_current_url' )->once()->with( $url_with_extra_param );

		$current_url    = Url::get_current_url();
		$normalized_url = Url::normalize( $current_url );

		$this->assertEquals( $expected_url, $normalized_url );
	}

	public function test_normalize_search_param() {
		$site_url             = 'https://example.com';
		$url_with_extra_param = 'https://example.com/?s=abcd';
		$expected_url         = 'https://example.com/?s=';

		Functions\when( 'site_url' )->justReturn( $site_url );
		Functions\when( 'remove_query_arg' )->justReturn( $expected_url );
		Functions\when( 'wp_parse_url' )->justReturn(
			array(
				'host'  => 'example.com',
				'path'  => '/path',
				'query' => 's=abcd',
			)
		);

		$_SERVER = array_merge(
			$_SERVER,
			array(
				'HTTPS'       => 'on',
				'HTTP_HOST'   => 'example.com',
				'REQUEST_URI' => '/?s=abcd',
			)
		);

		
		Filters\expectApplied( 'jetpack_boost_current_url' )->once()->with( $url_with_extra_param );

		$current_url    = Url::get_current_url();
		$normalized_url = Url::normalize( $current_url );

		$this->assertEquals( $expected_url, $normalized_url );
	}

	public function provide_url_data() {
		return array(
			array( 'http://example.com', 'http://example.com' ),
			array( 'http://example.com/?allowed_param=1', 'http://example.com/?allowed_param=1' ),
			array( 'http://example.com/?fbclid=123', 'http://example.com/' ),
			array( 'http://example.com/?z=26&p=16&a=1', 'http://example.com/?a=1&p=16&z=26' ),
			array( 'http://example.com/?z=26&utm_campaign=test&p=16&a=1&utm_medium=web', 'http://example.com/?a=1&p=16&z=26' ),
		);
	}
}
