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
	 * CSS minification/concatenation
	 */

	/**
	 * Test if CSS URLs are rendered correctly
	 *
	 * @since 5.6.0
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

	public function test_doesnt_concat_conditional_css() {
		wp_enqueue_style( 'my-style', plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ), false, '1.0', 'all' );
		wp_enqueue_style( 'conditional-style', plugins_url( 'css/other-style.css', JETPACK__PLUGIN_FILE ), false, '2.0', 'print' );
		wp_style_add_data( 'conditional-style', 'conditional', 'IE' );

		$cdn_urls = $this->get_cdn_css_urls( $this->get_head_content() );

		$this->assertEquals( 1, count( $cdn_urls ) );
		$this->assertEquals( array(
			$this->strip_host( plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ) )
		), $cdn_urls[0]->query['f'] );
	}

	// TODO: minifies CSS rendered in the footer
	// TODO: skipping conditional
	// TODO: critical CSS

	/**
	 * JS minification/concatenation
	 */

	public function test_concatenates_js() {
		wp_enqueue_script( 'my-script', plugins_url( 'js/my-script.js', JETPACK__PLUGIN_FILE ), false, '1.0' );
		wp_enqueue_script( 'other-script', plugins_url( 'js/other-script.js', JETPACK__PLUGIN_FILE ), false, '2.0' );
		wp_enqueue_script( 'footer-script', plugins_url( 'js/footer-script.js', JETPACK__PLUGIN_FILE ), false, '3.0', true );

		$header_cdn_js_urls = $this->get_cdn_js_urls( $this->get_head_content() );

		$this->assertEquals( 1, count( $header_cdn_js_urls ) );

		$query = $header_cdn_js_urls[0]->query;

		$this->assertTrue( isset( $query['b'] ) ); // base URL
		$this->assertTrue( isset( $query['f'] ) ); // files
		$this->assertTrue( isset( $query['v'] ) ); // versions

		// includes base hostname
		$this->assertEquals( 'http://example.org', $query['b'] );

		// should include URLs without hostname
		$this->assertEquals( array(
			$this->strip_host( plugins_url( 'js/my-script.js', JETPACK__PLUGIN_FILE ) ),
			$this->strip_host( plugins_url( 'js/other-script.js', JETPACK__PLUGIN_FILE ) )
		), $query['f'] );

		// includes versions
		$this->assertEquals( array(
			'1.0', '2.0'
		), $query['v'] );

		// now get the footer URLs
		$footer_cdn_js_urls = $this->get_cdn_js_urls( $this->get_footer_content() );

		$this->assertEquals( 1, count( $footer_cdn_js_urls ) );

		$query = $footer_cdn_js_urls[0]->query;

		// includes base hostname
		$this->assertEquals( 'http://example.org', $query['b'] );

		// should include URLs without hostname
		$this->assertEquals( array(
			$this->strip_host( plugins_url( 'js/footer-script.js', JETPACK__PLUGIN_FILE ) )
		), $query['f'] );

		// includes versions
		$this->assertEquals( array(
			'3.0'
		), $query['v'] );
	}

	public function test_breaks_js_on_intervening_non_CDN_script() {
		wp_enqueue_script( 'my-script', plugins_url( 'js/my-script.js', JETPACK__PLUGIN_FILE ), false, '1.0' );
		wp_enqueue_script( 'non-cdn-script', plugins_url( 'js/non-cdn-script.js', JETPACK__PLUGIN_FILE ), false, '2.0' );
		wp_enqueue_script( 'next-cdn-script', plugins_url( 'js/next-cdn-script.js', JETPACK__PLUGIN_FILE ), false, '3.0' );
		wp_enqueue_script( 'another-cdn-script', plugins_url( 'js/another-cdn-script.js', JETPACK__PLUGIN_FILE ), false, '4.0' );

		add_filter( 'jetpack_perf_concat_script', array( $this, 'dont_concat_non_cdn_script' ), 10, 3 );

		$header_cdn_js_urls = $this->get_cdn_js_urls( $this->get_head_content() );

		$this->assertEquals( 2, count( $header_cdn_js_urls ) );

		// first URL should contain one script
		$first_cdn_url = $header_cdn_js_urls[0];
		$this->assertEquals( array(
			$this->strip_host( plugins_url( 'js/my-script.js', JETPACK__PLUGIN_FILE ) )
		), $first_cdn_url->query['f'] );

		$this->assertEquals( array(
			'1.0'
		), $first_cdn_url->query['v'] );

		// second URL should contain remaining scripts
		$second_cdn_url = $header_cdn_js_urls[1];
		$this->assertEquals( array(
			$this->strip_host( plugins_url( 'js/next-cdn-script.js', JETPACK__PLUGIN_FILE ) ),
			$this->strip_host( plugins_url( 'js/another-cdn-script.js', JETPACK__PLUGIN_FILE ) )
		), $second_cdn_url->query['f'] );

		$this->assertEquals( array(
			'3.0', '4.0'
		), $second_cdn_url->query['v'] );
	}

	public function dont_concat_non_cdn_script( $should_concat, $handle, $src ) {
		if ( 'non-cdn-script' === $handle ) {
			return false;
		}
		return $should_concat;
	}

	// TODO: localization
	// TODO: skipping conditional


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

	private function get_footer_content() {
		ob_start();
		do_action( 'wp_footer' );
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

	private function get_cdn_js_urls( $content ) {
		// get the concatenated CSS link
		preg_match_all( '|<script type="text/javascript" src="(http://mycdn.com/js.*?)".*?></script>|', $content, $matches );

		$urls = array();

		for( $i = 0; $i < count( $matches[1] ); $i++ ) {
			$url    = html_entity_decode( $matches[1][$i] );
			parse_str( parse_url( $url, PHP_URL_QUERY ), $query );
			$urls[] = (object) array( 'url' => $url, 'query' => $query );
		}

		return $urls;
	}
}