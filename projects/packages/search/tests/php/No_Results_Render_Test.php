<?php
/**
 * No Results block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the no-results block's render template.
 *
 * The block is registered inline (rather than from its block.json) so
 * `do_blocks()` can resolve it without depending on `build/` artifacts that
 * aren't present in a fresh checkout — those would trigger notices that
 * fail the suite under `failOnNotice`. The render callback delegates to
 * render.php, which is the file under test.
 */
class No_Results_Render_Test extends TestCase {

	/**
	 * Register the no-results block inline for the whole test class.
	 */
	public static function setUpBeforeClass(): void {
		\register_block_type(
			'jetpack/no-results',
			array(
				'attributes'      => array(
					'message'               => array(
						'type'    => 'string',
						'default' => '',
					),
					'showSearchAgainPrompt' => array(
						'type'    => 'boolean',
						'default' => false,
					),
				),
				// $attributes is consumed by the included render.php via the
				// closure's local scope — phpcs can't see that, hence the disable.
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/no-results/render.php';
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
		\unregister_block_type( 'jetpack/no-results' );
	}

	/**
	 * Render the no-results block with the given attributes via `do_blocks`.
	 *
	 * @param array $attributes Block attributes (JSON-encoded into the comment delimiter).
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		return do_blocks( '<!-- wp:jetpack/no-results ' . $json . ' /-->' );
	}

	/**
	 * An empty `message` must fall back to the translated default so
	 * existing posts (saved before the attribute existed) keep rendering
	 * the original copy.
	 */
	public function test_empty_message_falls_back_to_default() {
		$markup = $this->render( array( 'message' => '' ) );
		$this->assertStringContainsString( 'No results found. Try a different search.', $markup );
	}

	/**
	 * A missing `message` (not just empty) must also fall back. Block editor
	 * saves omit attributes that match their default, so old posts arrive
	 * here without the key at all.
	 */
	public function test_missing_message_falls_back_to_default() {
		$markup = $this->render();
		$this->assertStringContainsString( 'No results found. Try a different search.', $markup );
	}

	/**
	 * A custom `message` must replace the default copy on the front end.
	 */
	public function test_custom_message_renders() {
		$markup = $this->render( array( 'message' => 'Nothing here, sorry.' ) );
		$this->assertStringContainsString( 'Nothing here, sorry.', $markup );
		$this->assertStringNotContainsString( 'No results found. Try a different search.', $markup );
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
	 * When the toggle is off (default) the "search again" hint must not
	 * render, so existing posts don't pick up the new markup silently.
	 */
	public function test_search_again_prompt_hidden_by_default() {
		$markup = $this->render();
		$this->assertStringNotContainsString( 'jetpack-search-no-results__search-again', $markup );
	}

	/**
	 * An explicit `false` must behave the same as the default.
	 */
	public function test_search_again_prompt_hidden_when_false() {
		$markup = $this->render( array( 'showSearchAgainPrompt' => false ) );
		$this->assertStringNotContainsString( 'jetpack-search-no-results__search-again', $markup );
	}

	/**
	 * When the toggle is on, the hint renders as its own `<p>` with the CSS
	 * hook theme authors can target — pinning the element + class pair so a
	 * future refactor can't quietly move the class onto a wrapper.
	 */
	public function test_search_again_prompt_shown_when_true() {
		$markup = $this->render( array( 'showSearchAgainPrompt' => true ) );
		$this->assertStringContainsString( '<p class="jetpack-search-no-results__search-again">', $markup );
		$this->assertStringContainsString( 'Please try again.', $markup );
	}

	/**
	 * The custom-message + prompt combination must render both — the prompt
	 * is a separate affordance, not a replacement for the message.
	 */
	public function test_custom_message_with_search_again_prompt() {
		$markup = $this->render(
			array(
				'message'               => 'Nothing matched your query.',
				'showSearchAgainPrompt' => true,
			)
		);
		$this->assertStringContainsString( 'Nothing matched your query.', $markup );
		$this->assertStringContainsString( 'jetpack-search-no-results__search-again', $markup );
	}

	/**
	 * With the default message and the prompt enabled, neither the message
	 * nor the prompt copy may appear twice — the prompt phrase was chosen
	 * specifically to avoid repeating the default message's trailing
	 * sentence. Guards against future copy edits reintroducing duplication.
	 */
	public function test_default_message_with_prompt_does_not_duplicate_copy() {
		$markup = $this->render( array( 'showSearchAgainPrompt' => true ) );
		$this->assertSame( 1, substr_count( $markup, 'Try a different search.' ) );
		$this->assertSame( 1, substr_count( $markup, 'Please try again.' ) );
	}
}
