<?php
require dirname( __FILE__ ) . '/../../../../modules/asset-cdn/asset-cdn.php';

class WP_Test_Asset_CDN extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();
		switch_theme('twentyseventeen');

		// clean slate
		global $wp_scripts, $wp_styles;
		$wp_scripts = new WP_Scripts();
		$wp_styles = new WP_Styles();

		add_filter( 'jetpack_asset_cdn_url', array( $this, 'cdn_url' ) );
		Asset_CDN::reset();
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
		// $this->markTestIncomplete();
		wp_enqueue_style( 'my-style', plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ), false, '1.0' );
		wp_enqueue_style( 'other-style', plugins_url( 'css/other-style.css', JETPACK__PLUGIN_FILE ), false, '2.0' );

		$content = $this->get_head_content();

		$cdn_css_urls = $this->get_cdn_css_urls( $content );

		$this->assertEquals( 1, count( $cdn_css_urls ) );

		$query = $cdn_css_urls[0]->query;

		$this->assertTrue( isset( $query['b'] ) ); // base URL
		$this->assertTrue( isset( $query['f'] ) ); // files
		$this->assertTrue( isset( $query['v'] ) ); // versions

		// includes base hostname
		$this->assertEquals( 'http://example.org', $query['b'] );

		// should include URLs without hostname
		$this->assertEquals( array(
			$this->strip_host( plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ) ),
			$this->strip_host( plugins_url( 'css/other-style.css', JETPACK__PLUGIN_FILE ) )
		), $query['f'] );

		// includes versions
		$this->assertEquals( array(
			'1.0', '2.0'
		), $query['v'] );
	}

	// splits CSS on media

	public function test_separates_css_by_media() {
		wp_enqueue_style( 'my-style', plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ), false, '1.0', 'all' );
		wp_enqueue_style( 'other-style', plugins_url( 'css/other-style.css', JETPACK__PLUGIN_FILE ), false, '2.0', 'print' );
		wp_enqueue_style( 'yet-other-style', plugins_url( 'css/yet-other-style.css', JETPACK__PLUGIN_FILE ), false, '3.0', 'all' );

		$cdn_urls = $this->get_cdn_css_urls( $this->get_head_content() );

		$this->assertEquals( 2, count( $cdn_urls ) );

		$all_media_url = $cdn_urls[0];
		$this->assertEquals( 'all', $all_media_url->media );
		$this->assertEquals( array(
			$this->strip_host( plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ) ),
			$this->strip_host( plugins_url( 'css/yet-other-style.css', JETPACK__PLUGIN_FILE ) )
		), $all_media_url->query['f'] );

		$print_media_url = $cdn_urls[1];
		$this->assertEquals( 'print', $print_media_url->media );
		$this->assertEquals( array(
			$this->strip_host( plugins_url( 'css/other-style.css', JETPACK__PLUGIN_FILE ) )
		), $print_media_url->query['f'] );
	}

	// breaks on non-concatenated assets (only for scripts, not for CSS)


	/**
	 * Utility functions
	 */

	private function get_head_content() {
		ob_start();
		do_action( 'wp_head' );
		$content = ob_get_contents();
		ob_end_clean();

		return $content;
	}

	private function strip_host( $url ) {
		return str_replace( 'http://example.org', '', $url );
	}

	// conveniently turn CDN links into objects we can query
	private function get_cdn_css_urls( $content ) {
		// get the concatenated CSS link
		preg_match_all( '|<link rel="stylesheet" type="text/css" media="(.*?)" href="(http://mycdn.com/css.*?)".*?/>|', $content, $matches );

		$urls = array();

		for( $i = 0; $i < count( $matches[1] ); $i++ ) {
			$media  = $matches[1][$i];
			$url    = html_entity_decode( $matches[2][$i] );
			parse_str( parse_url( $url, PHP_URL_QUERY ), $query );
			$urls[] = (object) array( 'media' => $media, 'url' => $url, 'query' => $query );
		}

		return $urls;
	}
}