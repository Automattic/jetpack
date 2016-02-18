<?php

class WP_Test_Jetpack_Photon_Functions extends WP_UnitTestCase {

	/**
	 * @author kraftbj
	 * @covers jetpack_photon_url
	 * @since 3.9.2
	 */
	public function test_photonizing_https_image_adds_ssl_query_arg() {
		$url = jetpack_photon_url( 'https://example.com/images/photon.jpg' );
		parse_str( parse_url( $url, PHP_URL_QUERY ), $args );
		$this->assertEquals( '1', $args['ssl'], 'HTTPS image sources should have a ?ssl=1 query string.' );
	}

	/**
	 * @author kraftbj
	 * @covers jetpack_photon_url
	 * @since  3.9.2
	 */
	public function test_photonizing_http_image_no_ssl_query_arg() {
		$url = jetpack_photon_url( 'http://example.com/images/photon.jpg' );
		parse_str( parse_url( $url, PHP_URL_QUERY ), $args );
		$this->assertArrayNotHasKey( 'ssl', $args, 'HTTP image source should not have an ssl query string.' );
	}
}
