<?php
/**
 * Load More block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the load-more block's render template.
 *
 * Each test renders the block through `do_blocks()` so WordPress wires up
 * the block context (`WP_Block_Supports::$block_to_render`) the template
 * relies on via `get_block_wrapper_attributes()` — exercising the same path
 * the front end takes, not just an isolated `include`.
 */
class Results_Load_More_Render_Test extends TestCase {

	/**
	 * Register the load-more block inline (rather than from its block.json
	 * directory) so `do_blocks()` can resolve it without depending on the
	 * `build/` artifacts referenced by block.json's `viewScriptModule` and
	 * `style` entries — those aren't present in a fresh checkout, and our
	 * PHPUnit config has `failOnNotice` set, so any missing-asset notice
	 * during metadata resolution would fail the suite. The render callback
	 * just delegates to render.php, which is the file under test.
	 */
	public static function setUpBeforeClass(): void {
		\register_block_type(
			'jetpack-search/results-load-more',
			array(
				'attributes'      => array(
					'buttonLabel' => array(
						'type'    => 'string',
						'default' => '',
					),
				),
				// $attributes is consumed by the included render.php via the
				// closure's local scope — phpcs can't see that, hence the disable.
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/results-load-more/render.php';
					return (string) ob_get_clean();
				},
				// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			)
		);
	}

	/**
	 * Unregister the block so other test classes start from a clean slate.
	 */
	public static function tearDownAfterClass(): void {
		\unregister_block_type( 'jetpack-search/results-load-more' );
	}

	/**
	 * Render the load-more block with the given attributes via `do_blocks`.
	 *
	 * @param array $attributes Block attributes (JSON-encoded into the comment delimiter).
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		return do_blocks( '<!-- wp:jetpack-search/results-load-more ' . $json . ' /-->' );
	}

	/**
	 * An empty `buttonLabel` must fall back to the translated default so
	 * existing posts (saved before the attribute existed) keep rendering
	 * the original "Load more results" copy.
	 */
	public function test_empty_button_label_falls_back_to_default() {
		$markup = $this->render( array( 'buttonLabel' => '' ) );
		$this->assertStringContainsString( 'Load more results', $markup );
	}

	/**
	 * A missing `buttonLabel` (not just empty) must also fall back. Block
	 * editor saves omit attributes that match their default, so old posts
	 * arrive here without the key at all.
	 */
	public function test_missing_button_label_falls_back_to_default() {
		$markup = $this->render();
		$this->assertStringContainsString( 'Load more results', $markup );
	}

	/**
	 * A custom `buttonLabel` must replace the default copy on the front end.
	 */
	public function test_custom_button_label_renders() {
		$markup = $this->render( array( 'buttonLabel' => 'Show more posts' ) );
		$this->assertStringContainsString( 'Show more posts', $markup );
		$this->assertStringNotContainsString( 'Load more results', $markup );
	}

	/**
	 * A whitespace-only label (e.g. user typed spaces and stopped) must
	 * fall back to the default — the editor inspector promises "Leave
	 * empty to use the default", and a blank-looking value should behave
	 * like empty rather than render a visually empty button.
	 */
	public function test_whitespace_only_button_label_falls_back_to_default() {
		$markup = $this->render( array( 'buttonLabel' => '   ' ) );
		$this->assertStringContainsString( 'Load more results', $markup );
	}

	/**
	 * The label is user-controlled, so the template must escape HTML to
	 * prevent stored XSS through a crafted attribute value.
	 */
	public function test_button_label_is_html_escaped() {
		$markup = $this->render( array( 'buttonLabel' => '<script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $markup );
		$this->assertStringContainsString( '&lt;script&gt;alert(1)&lt;/script&gt;', $markup );
	}
}
