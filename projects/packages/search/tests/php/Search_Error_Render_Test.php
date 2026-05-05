<?php
/**
 * Search Error block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the search-error block's render template.
 *
 * Mirrors No_Results_Render_Test: the block is registered inline (rather
 * than from its block.json) so `do_blocks()` can resolve it without
 * depending on `build/` artifacts that aren't present in a fresh checkout.
 */
class Search_Error_Render_Test extends TestCase {

	/**
	 * Register the search-error block inline for the whole test class.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		\register_block_type(
			'jetpack/search-error',
			array(
				'attributes'      => array(
					'message' => array(
						'type'    => 'string',
						'default' => '',
					),
				),
				// $attributes is consumed by the included render.php via the
				// closure's local scope — phpcs can't see that, hence the disable.
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/search-error/render.php';
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
		\unregister_block_type( 'jetpack/search-error' );
		parent::tearDownAfterClass();
	}

	/**
	 * Render the search-error block with the given attributes via `do_blocks`.
	 *
	 * @param array $attributes Block attributes (JSON-encoded into the comment delimiter).
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		return do_blocks( '<!-- wp:jetpack/search-error ' . $json . ' /-->' );
	}

	/**
	 * An empty `message` must fall back to the translated default so existing
	 * posts (saved before the attribute existed) keep rendering the original
	 * copy.
	 */
	public function test_empty_message_falls_back_to_default() {
		$markup = $this->render( array( 'message' => '' ) );
		$this->assertStringContainsString( 'Something went wrong. Please try again.', $markup );
	}

	/**
	 * A missing `message` (not just empty) must also fall back. Block editor
	 * saves omit attributes that match their default, so old posts arrive
	 * here without the key at all.
	 */
	public function test_missing_message_falls_back_to_default() {
		$markup = $this->render();
		$this->assertStringContainsString( 'Something went wrong. Please try again.', $markup );
	}

	/**
	 * A whitespace-only `message` must fall back to the default — otherwise
	 * an author who typed spaces would ship a blank alert. The Inspector
	 * help text already tells authors to leave the field empty for the
	 * default; the fallback is the belt-and-suspenders for anyone who
	 * misses that.
	 */
	public function test_whitespace_message_falls_back_to_default() {
		$markup = $this->render( array( 'message' => "  \t\n " ) );
		$this->assertStringContainsString( 'Something went wrong. Please try again.', $markup );
	}

	/**
	 * A custom `message` must replace the default copy on the front end.
	 */
	public function test_custom_message_renders() {
		$markup = $this->render( array( 'message' => 'Search is offline right now.' ) );
		$this->assertStringContainsString( 'Search is offline right now.', $markup );
		$this->assertStringNotContainsString( 'Something went wrong. Please try again.', $markup );
	}

	/**
	 * The message is user-controlled, so the template must escape HTML to
	 * prevent stored XSS through a crafted attribute value.
	 */
	public function test_message_is_html_escaped() {
		$markup = $this->render( array( 'message' => '<script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $markup );
		$this->assertStringContainsString( '&lt;script&gt;alert(1)&lt;/script&gt;', $markup );
	}

	/**
	 * Assistive tech needs to know the message is an alert, otherwise a
	 * silently-appearing error wouldn't be announced. The role lives on
	 * the wrapper so the announcement carries the full message text.
	 */
	public function test_wrapper_carries_alert_role() {
		$markup = $this->render();
		$this->assertStringContainsString( 'role="alert"', $markup );
	}
}
