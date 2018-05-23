<?php

require dirname( __FILE__ ) . '/../../../../modules/custom-post-types/redirector.php';

class WP_Test_Jetpack_Redirector extends WP_UnitTestCase {
	function test_redirector_class_exists() {
		$this->assertTrue( class_exists( 'Jetpack_Redirector' ) );
	}

	/**
	 * @runInSeparateProcess
	 */
	function test_redirector_properly_initializes() {
		$this->assertFalse(
			post_type_exists( 'jetpack-redirect' ),
			'CPT should not be registered before init'
		);

		$this->assertFalse(
			has_filter( 'template_redirect', array( 'Jetpack_Redirector', 'maybe_do_redirect' ) ),
			'template_redirect filter should not be hooked before init'
		);

		do_action( 'init' );

		$this->assertTrue(
			post_type_exists( 'jetpack-redirect' ),
			'CPT should be registered after init'
		);

		$this->assertSame(
			0,
			has_filter( 'template_redirect', array( 'Jetpack_Redirector', 'maybe_do_redirect' ) ),
			'template_redirect filter should be hooked at priority 0 after init'
		);
	}

	/**
	 * @depends test_redirector_properly_initializes
	 */
	function test_redirector_properly_initializes_is_isolated() {
		$this->assertFalse(
			post_type_exists( 'jetpack-redirect' ),
			'CPT should not be registered'
		);

		$this->assertFalse(
			has_filter( 'template_redirect', array( 'Jetpack_Redirector', 'maybe_do_redirect' ) ),
			'template_redirect filter should not be hooked'
		);
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
}
