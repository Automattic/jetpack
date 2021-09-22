<?php

class WP_Test_Jetpack_Photon_Functions extends WP_UnitTestCase {

	/**
	 * Tear down.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_photon_domain', array( $this, 'apply_custom_domain' ) );
		unset( $this->custom_photon_domain );
	}

	public function apply_custom_domain( $domain ) {
		if ( 'jetpack_photon_domain' === current_filter() ) {
			return $this->custom_photon_domain;
		}

		$this->custom_photon_domain = $domain;
		add_filter( 'jetpack_photon_domain', array( $this, 'apply_custom_domain' ) );
	}

	protected function assertMatchesPhotonHost( $host ) {
		$this->assertRegExp( '/^i[0-2]\.wp\.com$/', $host );
	}

	/**
	 * @author kraftbj
	 * @covers ::jetpack_photon_url
	 * @since 3.9.2
	 */
	public function test_photonizing_https_image_adds_ssl_query_arg() {
		$url = jetpack_photon_url( 'https://example.com/images/photon.jpg' );
		parse_str( wp_parse_url( $url, PHP_URL_QUERY ), $args );
		$this->assertEquals( '1', $args['ssl'], 'HTTPS image sources should have a ?ssl=1 query string.' );
	}

	/**
	 * @author kraftbj
	 * @covers ::jetpack_photon_url
	 * @since  3.9.2
	 */
	public function test_photonizing_http_image_no_ssl_query_arg() {
		$url = jetpack_photon_url( 'http://example.com/images/photon.jpg' );
		parse_str( wp_parse_url( $url, PHP_URL_QUERY ), $args );
		$this->assertArrayNotHasKey( 'ssl', $args, 'HTTP image source should not have an ssl query string.' );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_no_filter
	 */
	public function test_photon_url_no_filter_http() {
		$url = jetpack_photon_url( 'http://example.com/img.jpg' );
		$parsed_url = wp_parse_url( $url );

		$this->assertEquals( 'https', $parsed_url['scheme'] );
		$this->assertMatchesPhotonHost( $parsed_url['host'] );
		$this->assertEquals( '/example.com/img.jpg', $parsed_url['path'] );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_no_filter
	 */
	public function test_photon_url_no_filter_http_to_http() {
		$url = jetpack_photon_url( 'http://example.com/img.jpg', array(), 'http' );
		$parsed_url = wp_parse_url( $url );

		$this->assertEquals( 'http', $parsed_url['scheme'] );
		$this->assertMatchesPhotonHost( $parsed_url['host'] );
		$this->assertEquals( '/example.com/img.jpg', $parsed_url['path'] );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_no_filter
	 */
	public function test_photon_url_no_filter_photonized_https() {
		$url = jetpack_photon_url( 'https://i0.wp.com/example.com/img.jpg' );

		$this->assertEquals( 'https://i0.wp.com/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_no_filter
	 */
	public function test_photon_url_no_filter_photonized_http() {
		$url = jetpack_photon_url( 'http://i0.wp.com/example.com/img.jpg' );

		$this->assertEquals( 'http://i0.wp.com/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_no_filter
	 */
	public function test_photon_url_no_filter_photonized_https_to_http() {
		$url = jetpack_photon_url( 'https://i0.wp.com/example.com/img.jpg', array(), 'http' );

		$this->assertEquals( 'http://i0.wp.com/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_filter_http
	 */
	public function test_photon_url_filter_http_http() {
		$this->apply_custom_domain( 'http://photon.test' );
		$url = jetpack_photon_url( 'http://example.com/img.jpg' );

		$this->assertEquals( 'http://photon.test/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_filter_http
	 */
	public function test_photon_url_filter_http_http_to_http() {
		$this->apply_custom_domain( 'http://photon.test' );
		$url = jetpack_photon_url( 'http://example.com/img.jpg', array(), 'http' );

		$this->assertEquals( 'http://photon.test/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_filter_http
	 */
	public function test_photon_url_filter_http_photonized_http() {
		$this->apply_custom_domain( 'http://photon.test' );
		$url = jetpack_photon_url( 'http://photon.test/example.com/img.jpg' );

		$this->assertEquals( 'http://photon.test/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_filter_http
	 */
	public function test_photon_url_filter_http_photonized_https() {
		$this->apply_custom_domain( 'http://photon.test' );
		$url = jetpack_photon_url( 'https://photon.test/example.com/img.jpg' );

		$this->assertEquals( 'https://photon.test/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_filter_http
	 */
	public function test_photon_url_filter_http_photonized_http_to_https() {
		$this->apply_custom_domain( 'http://photon.test' );
		$url = jetpack_photon_url( 'http://photon.test/example.com/img.jpg', array(), 'https' );

		$this->assertEquals( 'https://photon.test/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_filter_network_path
	 */
	public function test_photon_url_filter_network_path_http() {
		$this->apply_custom_domain( '//photon.test' );
		$url = jetpack_photon_url( 'http://example.com/img.jpg' );

		$this->assertEquals( '//photon.test/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_filter_network_path
	 */
	public function test_photon_url_filter_network_path_http_to_http() {
		$this->apply_custom_domain( '//photon.test' );
		$url = jetpack_photon_url( 'http://example.com/img.jpg', array(), 'http' );

		$this->assertEquals( 'http://photon.test/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_filter_network_path
	 */
	public function test_photon_url_filter_network_path_photonized_http() {
		$this->apply_custom_domain( '//photon.test' );
		$url = jetpack_photon_url( 'http://photon.test/example.com/img.jpg' );

		$this->assertEquals( 'http://photon.test/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_filter_network_path
	 */
	public function test_photon_url_filter_network_path_photonized_https() {
		$this->apply_custom_domain( '//photon.test' );
		$url = jetpack_photon_url( 'https://photon.test/example.com/img.jpg' );

		$this->assertEquals( 'https://photon.test/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url
	 * @since  4.5.0
	 * @group  jetpack_photon_filter_network_path
	 */
	public function test_photon_url_filter_network_path_photonized_to_https() {
		$this->apply_custom_domain( '//photon.test' );
		$url = jetpack_photon_url( '//photon.test/example.com/img.jpg', array(), 'https' );

		$this->assertEquals( 'https://photon.test/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url_scheme
	 * @since  4.5.0
	 * @group  jetpack_photon_url_scheme
	 */
	public function test_photon_url_scheme_valid_url_null_scheme() {
		$url = jetpack_photon_url_scheme( 'https://i0.wp.com/example.com/img.jpg', null );

		$this->assertEquals( 'https://i0.wp.com/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url_scheme
	 * @since  4.5.0
	 * @group  jetpack_photon_url_scheme
	 */
	public function test_photon_url_scheme_valid_url_invalid_scheme() {
		$url = jetpack_photon_url_scheme( 'https://i0.wp.com/example.com/img.jpg', 'ftp' );

		$this->assertEquals( 'https://i0.wp.com/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url_scheme
	 * @since  4.5.0
	 * @group  jetpack_photon_url_scheme
	 */
	public function test_photon_url_scheme_valid_url_valid_scheme() {
		$url = jetpack_photon_url_scheme( 'https://i0.wp.com/example.com/img.jpg', 'http' );

		$this->assertEquals( 'http://i0.wp.com/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url_scheme
	 * @since  4.5.0
	 * @group  jetpack_photon_url_scheme
	 */
	public function test_photon_url_scheme_valid_url_network_path_scheme() {
		$url = jetpack_photon_url_scheme( 'https://i0.wp.com/example.com/img.jpg', 'network_path' );

		$this->assertEquals( '//i0.wp.com/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url_scheme
	 * @since  4.5.0
	 * @group  jetpack_photon_url_scheme
	 */
	public function test_photon_url_scheme_invalid_url_null_scheme() {
		$url = jetpack_photon_url_scheme( 'ftp://i0.wp.com/example.com/img.jpg', null );

		$this->assertEquals( 'http://i0.wp.com/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url_scheme
	 * @since  4.5.0
	 * @group  jetpack_photon_url_scheme
	 */
	public function test_photon_url_scheme_invalid_url_invalid_scheme() {
		$url = jetpack_photon_url_scheme( 'ftp://i0.wp.com/example.com/img.jpg', 'ftp' );

		$this->assertEquals( 'http://i0.wp.com/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_url_scheme
	 * @since  4.5.0
	 * @group  jetpack_photon_url_scheme
	 */
	public function test_photon_url_scheme_invalid_url_valid_scheme() {
		$url = jetpack_photon_url_scheme( 'ftp://i0.wp.com/example.com/img.jpg', 'https' );

		$this->assertEquals( 'https://i0.wp.com/example.com/img.jpg', $url );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_banned_domains
	 * @since  5.0.0
	 * @group  jetpack_photon_banned_domains
	 */
	public function test_photon_banned_domains_banned() {
		$this->assertTrue( jetpack_photon_banned_domains( false, 'http://graph.facebook.com/37512822/picture' ) );
		$this->assertTrue( jetpack_photon_banned_domains( false, 'https://scontent-mrs1-1.xx.fbcdn.net/v/t31.0-8/00000000_000000000000000_0000000000000000000_o.jpg' ) );
	}

	/**
	 * @author aduth
	 * @covers ::jetpack_photon_banned_domains
	 * @since  5.0.0
	 * @group  jetpack_photon_banned_domains
	 */
	public function test_photon_banned_domains_not_banned() {
		$this->assertFalse( jetpack_photon_banned_domains( false, 'https://s.w.org/style/images/wp-header-logo-2x.png' ) );
	}

	/**
	 * Tests that Photon will rely on native resizing for WordPress.com images.
	 *
	 * @author aforcier
	 * @covers ::jetpack_photon_url
	 * @since  9.5.0
	 */
	public function test_photonizing_wordpress_url() {
		$url = jetpack_photon_url( 'https://jetpack.files.wordpress.com/abcd1234/poster_image.jpg', array( 'w' => 500 ) );
		parse_str( wp_parse_url( $url, PHP_URL_QUERY ), $args );
		$this->assertSame( '500', $args['w'], 'WordPress.com image source should have given params applied.' );
		$this->assertArrayNotHasKey( 'ssl', $args, 'WordPress.com image source should not have an ssl query string.' );
		$this->assertSame( 'jetpack.files.wordpress.com', wp_parse_url( $url )['host'], 'WordPress.com image source should not be wrapped in Photon URL.' );
	}

	/**
	 * Tests that Photon will rely on native resizing for VideoPress poster images.
	 *
	 * @author aforcier
	 * @covers ::jetpack_photon_url
	 * @since  9.5.0
	 */
	public function test_photonizing_videopress_url() {
		$url = jetpack_photon_url( 'https://videos.files.wordpress.com/abcd1234/poster_image.jpg', array( 'w' => 500 ) );
		parse_str( wp_parse_url( $url, PHP_URL_QUERY ), $args );
		$this->assertSame( '500', $args['w'], 'VideoPress poster image source should have given params applied.' );
		$this->assertArrayNotHasKey( 'ssl', $args, 'VideoPress poster image source should not have an ssl query string.' );
		$this->assertSame( 'videos.files.wordpress.com', wp_parse_url( $url )['host'], 'VideoPress poster image source should not be wrapped in Photon URL.' );
	}

}
