<?php
/**
 * Tests for Display_Critical_CSS class.
 *
 * @package automattic/jetpack-boost
 * @since $$next-version$$
 */

namespace Automattic\Jetpack_Boost\Tests\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Display_Critical_CSS;
use WorDBless\BaseTestCase;

// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedStylesheet

/**
 * Class Display_Critical_CSS_Test
 *
 * @since $$next-version$$
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
