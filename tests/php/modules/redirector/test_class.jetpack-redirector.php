<?php

require dirname( __FILE__ ) . '/../../../../modules/custom-post-types/redirector.php';

class WP_Test_Jetpack_Redirector extends WP_UnitTestCase {
	function test_redirector_class_exists() {
		$this->assertTrue( class_exists( 'Jetpack_Redirector' ) );
	}

	function test_redirector_normalize_url_invalid_proto_returns_an_error() {
		$url = Jetpack_Redirector::normalize_url( 'file://something/not/a/url.txt' );
		$this->assertTrue( $url instanceof WP_Error );
		$this->assertSame(
			'invalid-redirect-url',
			$url->get_error_code(),
			'Error code should be `invalid-redirect-url`'
		);
	}

	function test_redirector_normalize_url_empty_input_returns_an_error() {
		$url = Jetpack_Redirector::normalize_url( '' );
		$this->assertTrue( $url instanceof WP_Error );
		$this->assertSame(
			'invalid-redirect-url',
			$url->get_error_code(),
			'Error code should be `invalid-redirect-url`'
		);
	}

	function test_redirector_normalize_url_nonstring_returns_an_error() {
		$url = Jetpack_Redirector::normalize_url( new stdClass );
		$this->assertTrue( $url instanceof WP_Error );
		$this->assertSame(
			'nonstring-redirect-url',
			$url->get_error_code(),
			'Error code should be `nonstring-redirect-url`'
		);
	}

	function test_redirector_normalize_url_only_proto_returns_an_error() {
		$url = Jetpack_Redirector::normalize_url( 'http://' );
		$this->assertTrue( $url instanceof WP_Error );
		$this->assertSame(
			'url-parse-failed',
			$url->get_error_code(),
			'Error code should be `url-parse-failed`'
		);
	}

	function test_redirector_normalize_url_only_proto_and_host_returns_an_error() {
		$url = Jetpack_Redirector::normalize_url( 'http://example.com' );
		$this->assertTrue( $url instanceof WP_Error );
		$this->assertSame(
			'url-no-path-or-query',
			$url->get_error_code(),
			'Error code should be `url-no-path-or-query`'
		);
	}

	function test_redirector_normalize_url_http_host_path_should_return_path() {
		$this->assertSame(
			'/path',
			Jetpack_Redirector::normalize_url( 'http://example.com/path' )
		);
	}

	function test_redirector_normalize_url_http_host_query_should_return_slash_query() {
		$this->assertSame(
			'/?k=v&k2=v2&k3',
			Jetpack_Redirector::normalize_url( 'http://example.com?k=v&k2=v2&k3' )
		);
	}

	function test_redirector_normalize_url_http_host_slash_query_should_return_slash_query() {
		$this->assertSame(
			'/?k=v&k2=v2&k3',
			Jetpack_Redirector::normalize_url( 'http://example.com/?k=v&k2=v2&k3' )
		);
	}

	function test_redirector_normalize_url_http_host_slash_should_return_slash() {
		$this->assertSame(
			'/',
			Jetpack_Redirector::normalize_url( 'http://example.com/' )
		);
	}

	function test_redirector_normalize_url_http_host_path_query_should_return_path_query() {
		$this->assertSame(
			'/path?k=v&k2=v2&k3',
			Jetpack_Redirector::normalize_url( 'http://example.com/path?k=v&k2=v2&k3' )
		);
	}

	function test_redirector_get_url_hash_returns_correct_value() {
		$this->assertSame(
			'3661d93970f3242ab8a6623eedc99e4a',
			Jetpack_Redirector::get_url_hash( '/path?k=v&k2=v2&k3' ),
			'hash did not match expected value -- did the algorithm change?'
		);
	}
}
