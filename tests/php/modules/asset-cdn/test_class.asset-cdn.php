<?php
require dirname( __FILE__ ) . '/../../../../modules/asset-cdn/asset-cdn.php';

class WP_Test_Jetpack_Asset_CDN extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();
		switch_theme('twentyseventeen');

		// clean slate
		global $wp_scripts, $wp_styles;
		$wp_scripts = new WP_Scripts();
		$wp_styles = new WP_Styles();

		add_filter( 'jetpack_asset_cdn_url', array( $this, 'cdn_url' ) );
		Jetpack_Asset_CDN::reset();
		Jetpack_Asset_CDN::instance();
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
		wp_enqueue_style( 'my-style', plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ), false, '1.0' );
		wp_enqueue_style( 'other-style', plugins_url( 'css/other-style.css', JETPACK__PLUGIN_FILE ), false, '2.0' );

		$cdn_css_urls = $this->get_cdn_css_urls( $this->get_head_content() );

		$query = $cdn_css_urls[0]->query;

		$this->assertTrue( isset( $query['b'] ) ); // base URL
		$this->assertTrue( isset( $query['f'] ) ); // files
		$this->assertTrue( isset( $query['v'] ) ); // versions

		// includes base hostname
		$this->assertEquals( 'http://example.org', $query['b'] );

		// should include URLs without hostname
		$this->assertArraySubset( array(
			$this->strip_host( plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ) ),
			$this->strip_host( plugins_url( 'css/other-style.css', JETPACK__PLUGIN_FILE ) )
		), $query['f'] );

		// includes versions
		$this->assertArraySubset( array(
			'1.0', '2.0'
		), $query['v'] );

		// enqueue more media, render in footer
		wp_enqueue_style( 'footer-style', plugins_url( 'css/footer-style.css', JETPACK__PLUGIN_FILE ), false, '3.0' );
		wp_enqueue_style( 'footer-style-too', plugins_url( 'css/footer-style-too.css', JETPACK__PLUGIN_FILE ), false, '4.0' );
		$cdn_css_urls = $this->get_cdn_css_urls( $this->get_footer_content() );
		$query = $cdn_css_urls[0]->query;

		$this->assertArraySubset( array(
			$this->strip_host( plugins_url( 'css/footer-style.css', JETPACK__PLUGIN_FILE ) ),
			$this->strip_host( plugins_url( 'css/footer-style-too.css', JETPACK__PLUGIN_FILE ) )
		), $query['f'] );

		// includes versions
		$this->assertArraySubset( array(
			'3.0', '4.0'
		), $query['v'] );
	}

	public function test_separates_css_by_media() {
		wp_enqueue_style( 'my-style', plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ), false, '1.0', 'all' );
		wp_enqueue_style( 'other-style', plugins_url( 'css/other-style.css', JETPACK__PLUGIN_FILE ), false, '2.0', 'print' );
		wp_enqueue_style( 'yet-other-style', plugins_url( 'css/yet-other-style.css', JETPACK__PLUGIN_FILE ), false, '3.0', 'all' );

		$cdn_urls = $this->get_cdn_css_urls( $this->get_head_content() );

		$all_media_url = $cdn_urls[0];
		$this->assertEquals( 'all', $all_media_url->media );
		$this->assertArraySubset( array(
			$this->strip_host( plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ) ),
			$this->strip_host( plugins_url( 'css/yet-other-style.css', JETPACK__PLUGIN_FILE ) )
		), $all_media_url->query['f'] );

		$print_media_url = $cdn_urls[1];
		$this->assertEquals( 'print', $print_media_url->media );
		$this->assertArraySubset( array(
			$this->strip_host( plugins_url( 'css/other-style.css', JETPACK__PLUGIN_FILE ) )
		), $print_media_url->query['f'] );
	}

	public function test_doesnt_concat_conditional_css() {
		wp_enqueue_style( 'my-style', plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ), false, '1.0', 'all' );
		wp_enqueue_style( 'conditional-style', plugins_url( 'css/other-style.css', JETPACK__PLUGIN_FILE ), false, '2.0', 'print' );
		wp_style_add_data( 'conditional-style', 'conditional', 'IE' );

		$cdn_urls = $this->get_cdn_css_urls( $this->get_head_content() );

		$this->assertArraySubset( array(
			$this->strip_host( plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ) )
		), $cdn_urls[0]->query['f'] );

		$this->assertNotContains(
			$this->strip_host( plugins_url( 'css/other-style.css', JETPACK__PLUGIN_FILE ) ),
			$cdn_urls[0]->query['f']
		);
	}

	public function test_adds_inline_styles_after_tag() {
		wp_enqueue_style( 'my-style', plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ), false, '1.0', 'all' );
		wp_add_inline_style( 'my-style', "h2 { font-family: 'Helvetica'; }" );

		$content = $this->get_head_content();

		preg_match_all( "|font-family: 'Helvetica';|", $content, $matches );
		$this->assertEquals( 1, count( $matches[0] ), 'should only print once in the head' );

		// assert that it's after the CDN URL
		$cdn_url_pos = strpos( $content, 'mycdn.com' );
		$custom_css_pos = strpos( $content, "font-family: 'Helvetica';" );
		$this->assertTrue( $cdn_url_pos < $custom_css_pos, 'CDN link must be before inline CSS' );

		$cdn_css_urls = $this->get_cdn_css_urls( $content );
	}

	public function test_optionally_include_external_css() {
		// hook to include external assets
		add_filter( 'jetpack_asset_cdn_external_assets', '__return_true' );

		// re-initialize module
		Jetpack_Asset_CDN::reset();
		Jetpack_Asset_CDN::instance();

		wp_enqueue_style( 'my-style', plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ), false, '1.0' );
		wp_enqueue_style( 'external-style', 'http://mysite.com/css/style.css', false, '2.0' );

		$cdn_urls = $this->get_cdn_css_urls( $this->get_head_content() );

		$this->assertArraySubset( array(
			$this->strip_host( plugins_url( 'css/my-style.css', JETPACK__PLUGIN_FILE ) ),
			'http://mysite.com/css/style.css'
		), $cdn_urls[0]->query['f'] );

		$this->assertArraySubset( array(
			'1.0', '2.0'
		), $cdn_urls[0]->query['v'] );
	}

	// TODO: critical CSS
	// TODO: handle 'alt' data
	// TODO: handle rtl
	// TODO: bundle IDs and optimisation - common JS vs page-specific JS

	/**
	 * JS minification/concatenation
	 */

	public function test_concatenates_js() {
		wp_enqueue_script( 'external-script', 'http://mysite.com/js/script.js', false, '8.0' ); // should not be present
		wp_enqueue_script( 'my-script', plugins_url( 'js/my-script.js', JETPACK__PLUGIN_FILE ), false, '1.0' );
		wp_enqueue_script( 'other-script', plugins_url( 'js/other-script.js', JETPACK__PLUGIN_FILE ), false, '2.0' );
		wp_enqueue_script( 'footer-script', plugins_url( 'js/footer-script.js', JETPACK__PLUGIN_FILE ), false, '3.0', true );

		$content = $this->get_head_content();

		// assert old script tags are not there
		$existingScriptPath = plugins_url( 'js/my-script.js', JETPACK__PLUGIN_FILE ) . '?ver=1.0';
		$this->assertEquals( false, strpos( $content, $existingScriptPath ) );

		// ... but the external JS is still there
		$this->assertNotEquals( false, strpos( $content, 'http://mysite.com/js/script.js' ) );

		$header_cdn_js_urls = $this->get_cdn_js_urls( $content );

		$query = $header_cdn_js_urls[0]->query;

		$this->assertTrue( isset( $query['b'] ) ); // base URL
		$this->assertTrue( isset( $query['f'] ) ); // files
		$this->assertTrue( isset( $query['v'] ) ); // versions

		// includes base hostname
		$this->assertEquals( 'http://example.org', $query['b'] );

		// should include URLs without hostname
		$this->assertArraySubset( array(
			$this->strip_host( plugins_url( 'js/my-script.js', JETPACK__PLUGIN_FILE ) ),
			$this->strip_host( plugins_url( 'js/other-script.js', JETPACK__PLUGIN_FILE ) )
		), $query['f'] );

		// includes versions
		$this->assertArraySubset( array(
			'1.0', '2.0'
		), $query['v'] );

		$this->assertNotContains( 'http://mysite.com/js/script.js', $query['f'] );

		// now get the footer URLs
		$footer_cdn_js_urls = $this->get_cdn_js_urls( $this->get_footer_content() );

		$query = $footer_cdn_js_urls[0]->query;

		// includes base hostname
		$this->assertEquals( 'http://example.org', $query['b'] );

		// should include URLs without hostname
		$this->assertArraySubset( array(
			$this->strip_host( plugins_url( 'js/footer-script.js', JETPACK__PLUGIN_FILE ) )
		), $query['f'] );

		// includes versions
		$this->assertArraySubset( array(
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

		// first URL should contain one script
		$first_cdn_url = $header_cdn_js_urls[0];
		$this->assertArraySubset( array(
			$this->strip_host( plugins_url( 'js/my-script.js', JETPACK__PLUGIN_FILE ) )
		), $first_cdn_url->query['f'] );

		$this->assertArraySubset( array(
			'1.0'
		), $first_cdn_url->query['v'] );

		// second URL should contain remaining scripts
		$second_cdn_url = $header_cdn_js_urls[1];
		$this->assertArraySubset( array(
			$this->strip_host( plugins_url( 'js/next-cdn-script.js', JETPACK__PLUGIN_FILE ) ),
			$this->strip_host( plugins_url( 'js/another-cdn-script.js', JETPACK__PLUGIN_FILE ) )
		), $second_cdn_url->query['f'] );

		$this->assertArraySubset( array(
			'3.0', '4.0'
		), $second_cdn_url->query['v'] );
	}

	public function dont_concat_non_cdn_script( $should_concat, $handle, $src ) {
		if ( 'non-cdn-script' === $handle ) {
			return false;
		}
		return $should_concat;
	}

	public function test_doesnt_concat_conditional_js() {
		wp_enqueue_script( 'my-script', plugins_url( 'js/my-script.js', JETPACK__PLUGIN_FILE ), false, '1.0' );
		wp_enqueue_script( 'conditional-script', plugins_url( 'js/other-script.js', JETPACK__PLUGIN_FILE ), false, '2.0' );
		wp_script_add_data( 'conditional-script', 'conditional', 'IE' );

		$cdn_urls = $this->get_cdn_js_urls( $this->get_head_content() );

		$this->assertArraySubset( array(
			$this->strip_host( plugins_url( 'js/my-script.js', JETPACK__PLUGIN_FILE ) )
		), $cdn_urls[0]->query['f'] );
	}

	public function test_optionally_include_external_js() {
		// hook to include external assets
		add_filter( 'jetpack_asset_cdn_external_assets', '__return_true' );

		// re-initialize module
		Jetpack_Asset_CDN::reset();
		Jetpack_Asset_CDN::instance();

		wp_enqueue_script( 'my-script', plugins_url( 'js/my-script.js', JETPACK__PLUGIN_FILE ), false, '1.0' );
		wp_enqueue_script( 'external-script', 'http://mysite.com/js/script.js', false, '2.0' );

		$cdn_urls = $this->get_cdn_js_urls( $this->get_head_content() );

		$this->assertArraySubset( array(
			$this->strip_host( plugins_url( 'js/my-script.js', JETPACK__PLUGIN_FILE ) ),
			'http://mysite.com/js/script.js'
		), $cdn_urls[0]->query['f'] );

		$this->assertArraySubset( array(
			'1.0', '2.0'
		), $cdn_urls[0]->query['v'] );
	}

	// TODO: localization tests

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
		wp_dequeue_script( 'wp-embed' );
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

	// conveniently turn CDN links into objects we can query
	private function get_cdn_js_urls( $content ) {
		// get the concatenated JS link
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