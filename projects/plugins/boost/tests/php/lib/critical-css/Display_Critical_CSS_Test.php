<?php
/**
 * Tests for Display_Critical_CSS class.
 *
 * @package automattic/jetpack-boost
 * @since 3.13.1
 */

namespace Automattic\Jetpack_Boost\Tests\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Display_Critical_CSS;
use WorDBless\BaseTestCase;

// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedStylesheet

/**
 * Class Display_Critical_CSS_Test
 *
 * @since 3.13.1
 */
class Display_Critical_CSS_Test extends BaseTestCase {

	/**
	 * Test instance.
	 *
	 * @var Display_Critical_CSS
	 */
	private $instance;

	/**
	 * Sample CSS for testing.
	 *
	 * @var string
	 */
	private $sample_css = 'body { color: red; }';

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();
		$this->instance = new Display_Critical_CSS( $this->sample_css );
	}

	/**
	 * Test display_critical_css() with valid CSS.
	 */
	public function test_display_critical_css_with_valid_css() {
		ob_start();
		$this->instance->display_critical_css();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<style id="jetpack-boost-critical-css">', $output );
		$this->assertStringContainsString( $this->sample_css, $output );
		$this->assertStringContainsString( '</style>', $output );
	}

	/**
	 * Test display_critical_css() with empty CSS.
	 */
	public function test_display_critical_css_with_empty_css() {
		$instance = new Display_Critical_CSS( '' );

		ob_start();
		$result = $instance->display_critical_css();
		$output = ob_get_clean();

		$this->assertFalse( $result );
		$this->assertEmpty( $output );
	}

	/**
	 * Test display_critical_css() strips HTML tags.
	 */
	public function test_display_critical_css_strips_html() {
		$css_with_html = 'body { color: red; }</style><script>alert("xss")</script>';
		$instance      = new Display_Critical_CSS( $css_with_html );

		ob_start();
		$instance->display_critical_css();
		$output = ob_get_clean();

		$this->assertStringNotContainsString( '<script>', $output );
		$this->assertStringNotContainsString( 'alert', $output );
		$this->assertSame( 1, substr_count( $output, '</style>' ) );
	}

	/**
	 * Test asynchronize_stylesheets() with async method.
	 */
	public function test_asynchronize_stylesheets_async() {
		$html   = '<link rel="stylesheet" href="style.css" media="all" />';
		$output = $this->instance->asynchronize_stylesheets( $html, 'handle', 'style.css', 'all' );

		$this->assertStringContainsString( 'media="not all"', $output );
		$this->assertStringContainsString( 'data-media="all"', $output );
		$this->assertStringContainsString( 'onload=', $output );
		$this->assertStringContainsString( '<noscript>', $output );
		// Verify HTML structure is preserved.
		$this->assertStringContainsString( 'rel="stylesheet"', $output );
		$this->assertStringContainsString( 'href="style.css"', $output );
	}

	/**
	 * Test asynchronize_stylesheets() with deferred method.
	 */
	public function test_asynchronize_stylesheets_deferred() {
		add_filter(
			'jetpack_boost_async_style',
			function () {
				return 'deferred';
			}
		);

		$html   = '<link rel="stylesheet" href="style.css" media="all" />';
		$output = $this->instance->asynchronize_stylesheets( $html, 'handle', 'style.css', 'all' );

		$this->assertStringContainsString( 'media="not all"', $output );
		$this->assertStringContainsString( 'data-media="all"', $output );
		$this->assertStringNotContainsString( 'onload=', $output );
		$this->assertStringContainsString( '<noscript>', $output );
	}

	/**
	 * Test asynchronize_stylesheets() with disabled async loading.
	 */
	public function test_asynchronize_stylesheets_disabled() {
		add_filter( 'jetpack_boost_async_style', '__return_false' );

		$html   = '<link rel="stylesheet" href="style.css" media="all" />';
		$output = $this->instance->asynchronize_stylesheets( $html, 'handle', 'style.css', 'all' );

		$this->assertSame( $html, $output );
	}

	/**
	 * Test asynchronize_stylesheets() with empty CSS.
	 */
	public function test_asynchronize_stylesheets_with_empty_css() {
		$instance = new Display_Critical_CSS( '' );

		$html   = '<link rel="stylesheet" href="style.css" media="all" />';
		$output = $instance->asynchronize_stylesheets( $html, 'handle', 'style.css', 'all' );

		$this->assertSame( $html, $output );
	}

	/**
	 * Test asynchronize_stylesheets() without media attribute.
	 */
	public function test_asynchronize_stylesheets_without_media_attribute() {
		$html   = '<link rel="stylesheet" href="https://example.com/style.css">';
		$output = $this->instance->asynchronize_stylesheets( $html, 'handle', 'https://example.com/style.css', 'all' );

		$this->assertStringContainsString( 'media="not all"', $output );
		$this->assertStringContainsString( 'data-media="all"', $output );
		$this->assertStringContainsString( 'onload=', $output );
		$this->assertStringContainsString( '<noscript>', $output );
		// Verify HTML structure is preserved.
		$this->assertStringContainsString( 'rel="stylesheet"', $output );
		$this->assertStringContainsString( 'href="https://example.com/style.css"', $output );
	}

	/**
	 * Test asynchronize_stylesheets() with full URL preserves href.
	 */
	public function test_asynchronize_stylesheets_preserves_full_url() {
		$url    = 'https://example.com/wp-content/plugins/test/style.css?ver=1.0';
		$html   = '<link rel="stylesheet" id="test-css" href="' . $url . '" type="text/css" media="all">';
		$output = $this->instance->asynchronize_stylesheets( $html, 'test', $url, 'all' );

		$this->assertStringContainsString( 'media="not all"', $output );
		$this->assertStringContainsString( 'data-media="all"', $output );
		// Verify all original attributes are preserved.
		$this->assertStringContainsString( 'rel="stylesheet"', $output );
		$this->assertStringContainsString( 'id="test-css"', $output );
		$this->assertStringContainsString( 'href="' . $url . '"', $output );
		$this->assertStringContainsString( 'type="text/css"', $output );
	}

	/**
	 * Test asynchronize_stylesheets() with single-quoted attributes.
	 */
	public function test_asynchronize_stylesheets_single_quoted_attributes() {
		$html   = "<link rel='stylesheet' href='style.css' media='all' />";
		$output = $this->instance->asynchronize_stylesheets( $html, 'handle', 'style.css', 'all' );

		$this->assertStringContainsString( 'media="not all"', $output );
		$this->assertStringContainsString( 'data-media="all"', $output );
		$this->assertStringContainsString( '<noscript>', $output );
	}

	/**
	 * Test onload_flip_stylesheets() output.
	 */
	public function test_onload_flip_stylesheets() {
		ob_start();
		$this->instance->onload_flip_stylesheets();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<script>', $output );
		$this->assertStringContainsString( 'window.addEventListener', $output );
		$this->assertStringContainsString( 'jetpack-boost-critical-css', $output );
		$this->assertStringContainsString( '</script>', $output );
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		parent::tear_down();
		remove_all_filters( 'jetpack_boost_async_style' );
	}
}
