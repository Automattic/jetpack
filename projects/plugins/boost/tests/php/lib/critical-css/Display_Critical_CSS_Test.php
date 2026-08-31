<?php
/**
 * Tests for Display_Critical_CSS class.
 *
 * @package automattic/jetpack-boost
 * @since 3.13.1
 */

namespace Automattic\Jetpack_Boost\Tests\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Display_Critical_CSS;
use PHPUnit\Framework\Attributes\DataProvider;
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
	 * Test display_critical_css() neutralizes closing style tags, so the CSS
	 * cannot terminate the style element early and break out into HTML context.
	 */
	public function test_display_critical_css_neutralizes_style_breakout() {
		$css_with_breakout = 'body { color: red; }</style><script>alert("xss")</script>';
		$instance          = new Display_Critical_CSS( $css_with_breakout );

		ob_start();
		$instance->display_critical_css();
		$output = ob_get_clean();

		// The only `</style` sequence left must be the real closing tag, so the
		// injected markup stays inert inside the style element's raw text.
		$this->assertSame( 1, substr_count( strtolower( $output ), '</style' ) );
		$this->assertStringEndsWith( '</style>', $output );
		$this->assertStringContainsString( '<\/style><script>', $output );
	}

	/**
	 * Test display_critical_css() neutralizes closing style tags regardless of case.
	 */
	public function test_display_critical_css_neutralizes_style_breakout_case_insensitively() {
		$instance = new Display_Critical_CSS( 'body { color: red; }</StYlE ><p>injected</p>' );

		ob_start();
		$instance->display_critical_css();
		$output = ob_get_clean();

		$this->assertSame( 1, substr_count( strtolower( $output ), '</style' ) );
		$this->assertStringEndsWith( '</style>', $output );
		// The slash must actually be escaped (not merely stripped). str_ireplace
		// matches case-insensitively but substitutes the literal lowercase
		// replacement, so the matched run is normalized to `<\/style`; the trailing
		// payload is left untouched and stays inert text.
		$this->assertStringContainsString( '<\/style ><p>injected</p>', $output );
	}

	/**
	 * Test neutralize_style_closing_tags() locks in the security-critical invariant:
	 * no input can leave a `</style` sequence in the output. This is the shared
	 * sanitizer used by both the inline <style> block and the CSS proxy, so it is
	 * exercised directly here against adversarial and boundary inputs. A single
	 * left-to-right pass over `</style` cannot reconstruct the sequence from its own
	 * `<\/style` output, including from nested/overlapping inputs.
	 *
	 * @dataProvider provide_style_breakout_inputs
	 *
	 * @param string $input Raw CSS input containing one or more `</style` runs.
	 */
	#[DataProvider( 'provide_style_breakout_inputs' )]
	public function test_neutralize_style_closing_tags_blocks_reconstruction( $input ) {
		$output = Display_Critical_CSS::neutralize_style_closing_tags( $input );

		$this->assertSame( 0, substr_count( strtolower( $output ), '</style' ) );
	}

	/**
	 * Adversarial and boundary inputs for the breakout sanitizer. Each contains at
	 * least one `</style` substring; none may survive in the output.
	 *
	 * @return array<string, array{0: string}>
	 */
	public static function provide_style_breakout_inputs() {
		return array(
			'simple closing tag'            => array( '</style>' ),
			'closing tag at EOF no bracket' => array( 'a{}</style' ),
			'closing tag with whitespace'   => array( '</style >' ),
			'closing tag with tab'          => array( "</style\t>" ),
			'closing tag with newline'      => array( "</style\n>" ),
			'closing tag with slash'        => array( '</style/' ),
			'mixed case'                    => array( '</StYlE>' ),
			'nested overlap interleave'     => array( '<</style/style>' ),
			'nested split'                  => array( '</sty</style>le>' ),
			'adjacent doubles'              => array( '</style></style>' ),
			'substring in longer word'      => array( '.x{}</styles-thing' ),
		);
	}

	/**
	 * Test display_critical_css() preserves inline SVGs in CSS values.
	 *
	 * @see https://github.com/Automattic/jetpack/issues/42321
	 */
	public function test_display_critical_css_preserves_inline_svg_data_uri() {
		$css      = '.hero { background-image: url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 8 8\'><circle cx=\'4\' cy=\'4\' r=\'4\' fill=\'%23f00\'/></svg>"); }';
		$instance = new Display_Critical_CSS( $css );

		ob_start();
		$instance->display_critical_css();
		$output = ob_get_clean();

		$this->assertStringContainsString( $css, $output );
	}

	/**
	 * Test display_critical_css() preserves double quotes in CSS values.
	 */
	public function test_display_critical_css_preserves_double_quotes() {
		$css      = '.quote::before { content: "\201C"; font-family: "Times New Roman", serif; }';
		$instance = new Display_Critical_CSS( $css );

		ob_start();
		$instance->display_critical_css();
		$output = ob_get_clean();

		$this->assertStringContainsString( $css, $output );
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
