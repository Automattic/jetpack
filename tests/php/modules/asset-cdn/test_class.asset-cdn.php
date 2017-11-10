<?php
require dirname( __FILE__ ) . '/../../../../modules/asset-cdn/asset-cdn.php';

class WP_Test_Asset_CDN extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();
		switch_theme('twentyseventeen');
		add_filter( 'jetpack_asset_cdn_url', array( $this, 'cdn_url' ) );
		Asset_CDN::instance();
	}

	public function cdn_url( $url ) {
		return 'http://mycdn.com';
	}

	/**
	 * Test if likes are rendered correctly.
	 *
	 * @since 4.6.0
	 */
	public function test_concatenates_css() {
		wp_enqueue_style( 'my-style', plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ), false, JETPACK__VERSION );
		wp_enqueue_style( 'other-style', plugins_url( 'css/other-style.css', JETPACK__PLUGIN_FILE ), false, JETPACK__VERSION );

		ob_start();
		do_action( 'wp_head' );
		$content = ob_get_contents();
		ob_end_clean();

		// get the concatenated CSS link
		preg_match_all( '|<link rel="stylesheet" type="text/css" media="all" href="(http://mycdn.com/css.*)".*?/>|', $content, $matches );

		$this->assertEquals( 2, count( $matches ) );

		$url = html_entity_decode( $matches[1][0] );

		parse_str( parse_url( $url, PHP_URL_QUERY ), $query );
		$this->assertTrue( isset( $query['b'] ) ); // base URL
		$this->assertTrue( isset( $query['f'] ) ); // files
		$this->assertTrue( isset( $query['v'] ) ); // versions

		// includes base hostname
		$this->assertEquals( 'http://example.org', $query['b'] );

		// should include URLs without hostname
		$this->assertEquals( array(
			str_replace( 'http://example.org', '', plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ) ),
			str_replace( 'http://example.org', '', plugins_url( 'css/other-style.css', JETPACK__PLUGIN_FILE ) )
		), $query['f'] );

		// includes versions
		$this->assertEquals( array(
			JETPACK__VERSION, JETPACK__VERSION
		), $query['v'] );
	}

	// splits CSS on media
	// breaks on non-concatenated assets (only for scripts, not for CSS)

}