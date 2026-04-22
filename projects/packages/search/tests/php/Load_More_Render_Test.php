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
class Load_More_Render_Test extends TestCase {

	/**
	 * Register the load-more block once per test class so `do_blocks()` can
	 * resolve it. WordPress is bootstrapped by Test_Environment in
	 * bootstrap.php; the registry persists across tests in the same process,
	 * but `unregister_block_type()` is called in teardown to avoid leaking
	 * state into other test classes.
	 */
	public static function setUpBeforeClass(): void {
		\register_block_type(
			__DIR__ . '/../../src/search-blocks/blocks/load-more'
		);
	}

	/**
	 * Unregister the block so other test classes start from a clean slate.
	 */
	public static function tearDownAfterClass(): void {
		\unregister_block_type( 'jetpack/load-more' );
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
		return do_blocks( '<!-- wp:jetpack/load-more ' . $json . ' /-->' );
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
	 * The label is user-controlled, so the template must escape HTML to
	 * prevent stored XSS through a crafted attribute value.
	 */
	public function test_button_label_is_html_escaped() {
		$markup = $this->render( array( 'buttonLabel' => '<script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $markup );
		$this->assertStringContainsString( '&lt;script&gt;alert(1)&lt;/script&gt;', $markup );
	}
}
