<?php
/**
 * AI Answer block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the ai-answer block's render template.
 *
 * Asserts that render output is gated by `AI_Answers::is_enabled()`, and that
 * the attribute-driven affordances (heading, citations region, Show-more
 * button) appear / disappear in the markup the way the front-end consumer
 * expects.
 */
class Ai_Answer_Render_Test extends TestCase {

	/**
	 * Register the ai-answer block inline so `do_blocks()` can resolve it
	 * without depending on `build/` artifacts referenced by block.json.
	 */
	public static function setUpBeforeClass(): void {
		\register_block_type(
			'jetpack-search/ai-answer',
			array(
				'attributes'      => array(
					'heading'        => array(
						'type'    => 'string',
						'default' => '',
					),
					'showCitations'  => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'enableShowMore' => array(
						'type'    => 'boolean',
						'default' => true,
					),
				),
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/ai-answer/render.php';
					return (string) ob_get_clean();
				},
				// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			)
		);
	}

	public static function tearDownAfterClass(): void {
		\unregister_block_type( 'jetpack-search/ai-answer' );
	}

	protected function setUp(): void {
		parent::setUp();
		update_option( 'jetpack_search_ai_answers_enabled', true );
	}

	protected function tearDown(): void {
		delete_option( 'jetpack_search_ai_answers_enabled' );
		parent::tearDown();
	}

	/**
	 * Render the ai-answer block via `do_blocks()`.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		return do_blocks( '<!-- wp:jetpack-search/ai-answer ' . $json . ' /-->' );
	}

	public function test_disabled_renders_nothing() {
		update_option( 'jetpack_search_ai_answers_enabled', false );
		$markup = $this->render();
		$this->assertSame( '', trim( $markup ) );
	}

	public function test_enabled_renders_panel_wrapper() {
		$markup = $this->render();
		$this->assertStringContainsString( 'jp-search-answers-panel', $markup );
		$this->assertStringContainsString( 'data-wp-interactive="jetpack-search"', $markup );
	}

	public function test_default_heading_is_ai_answer() {
		$markup = $this->render();
		$this->assertStringContainsString( 'AI answer', $markup );
	}

	public function test_custom_heading_overrides_default() {
		$markup = $this->render( array( 'heading' => 'Quick summary' ) );
		$this->assertStringContainsString( 'Quick summary', $markup );
		$this->assertStringNotContainsString( '>AI answer<', $markup );
	}

	public function test_show_citations_true_renders_citations_list() {
		$markup = $this->render( array( 'showCitations' => true ) );
		$this->assertStringContainsString( 'jp-search-answers-panel__citations', $markup );
	}

	public function test_show_citations_false_omits_citations_list() {
		$markup = $this->render( array( 'showCitations' => false ) );
		$this->assertStringNotContainsString( 'jp-search-answers-panel__citations', $markup );
	}

	public function test_enable_show_more_true_renders_button() {
		$markup = $this->render( array( 'enableShowMore' => true ) );
		$this->assertStringContainsString( 'jp-search-answers-panel__toggle', $markup );
		$this->assertStringContainsString( 'actions.showExtendedAiAnswer', $markup );
	}

	public function test_enable_show_more_false_omits_button() {
		$markup = $this->render( array( 'enableShowMore' => false ) );
		$this->assertStringNotContainsString( 'jp-search-answers-panel__toggle', $markup );
		$this->assertStringNotContainsString( 'showExtendedAiAnswer', $markup );
	}

	public function test_panel_is_hidden_until_status_changes() {
		$markup = $this->render();
		// The panel binds to `state.aiPanelHidden` and also carries the bare
		// `hidden` attribute so server-rendered visitors never see the
		// scaffold before hydration. Use a regex so whitespace around the
		// attribute (tabs / newlines between `aria-live=` and `hidden`) is
		// allowed to vary without breaking the assertion.
		$this->assertStringContainsString( 'data-wp-bind--hidden="state.aiPanelHidden"', $markup );
		$this->assertMatchesRegularExpression( '/aria-live="polite"\s+hidden\s*>/', $markup );
	}
}
