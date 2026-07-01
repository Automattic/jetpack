<?php
/**
 * Filter_Wc_Attribute render.php integration tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Integration tests for the filter-wc-attribute block render template.
 *
 * Exercises the pre-hydration skeleton branch introduced to match
 * filter-checkbox / filter-date parity (RSM-2809).
 */
class Filter_Wc_Attribute_Render_Test extends TestCase {

	/**
	 * Register the filter-wc-attribute block so `do_blocks()` can resolve it
	 * without depending on the built JS/CSS artifacts.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		if ( ! function_exists( 'wp_interactivity_state' ) ) {
			return; // Skip registration — tests will markTestSkipped individually.
		}
		\register_block_type(
			'jetpack-search/filter-wc-attribute',
			array(
				'attributes'      => array(
					'attributeTaxonomy' => array(
						'type'    => 'string',
						'default' => '',
					),
					'label'             => array(
						'type'    => 'string',
						'default' => '',
					),
					'showCount'         => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'maxItems'          => array(
						'type'    => 'integer',
						'default' => 10,
					),
					'bucketSortOrder'   => array(
						'type'    => 'string',
						'default' => 'count',
					),
				),
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/filter-wc-attribute/render.php';
					return (string) ob_get_clean();
				},
				// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			)
		);
	}

	/**
	 * Unregister the block so other test classes start from a clean slate.
	 * Guard on the registry so the early-return path in setUpBeforeClass doesn't
	 * leave us calling unregister on a block that was never registered — that
	 * triggers a "Block type … is not registered" notice and fails under
	 * failOnNotice.
	 */
	public static function tearDownAfterClass(): void {
		if (
			class_exists( '\WP_Block_Type_Registry' )
			&& \WP_Block_Type_Registry::get_instance()->is_registered( 'jetpack-search/filter-wc-attribute' )
		) {
			\unregister_block_type( 'jetpack-search/filter-wc-attribute' );
		}
		parent::tearDownAfterClass();
	}

	/**
	 * Reset the is_initial_loading memo between tests so `$_GET` mutations
	 * in one test can't leak into the next.
	 */
	protected function tearDown(): void {
		Search_Blocks::reset_initial_loading_cache();
		parent::tearDown();
	}

	/**
	 * Guard helper — skips the test when wp_interactivity_state() is absent
	 * (WP < 6.5 test environments).
	 */
	private function require_interactivity_api(): void {
		if ( ! function_exists( 'wp_interactivity_state' ) ) {
			$this->markTestSkipped( 'wp_interactivity_state() unavailable in this environment.' );
		}
	}

	/**
	 * Render the block via `do_blocks()`.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		return do_blocks( '<!-- wp:jetpack-search/filter-wc-attribute ' . $json . ' /-->' );
	}

	/**
	 * Render the block with `is_initial_loading()` returning true by seeding
	 * `$_GET` with a WC attribute filter param. Resets the memoised cache
	 * before and after so the skeleton tests are isolated from one another
	 * and from the non-skeleton tests above.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered markup.
	 */
	private function render_with_skeleton( array $attributes = array() ): string {
		Search_Blocks::reset_initial_loading_cache();
		$_GET['pa_color'] = array( 'red' ); // triggers parse_url_filters() → is_initial_loading() === true
		$markup           = $this->render( $attributes );
		unset( $_GET['pa_color'] );
		Search_Blocks::reset_initial_loading_cache();
		return $markup;
	}

	/**
	 * Without a URL filter param the block has no seeded buckets and no
	 * initial-loading signal. The skeleton still renders — the IA runtime
	 * re-shows it on a client-side search from a bare page — but carries a
	 * static `hidden` attribute, and the wrapper is hidden too.
	 */
	public function test_skeleton_hidden_when_not_initial_loading(): void {
		$this->require_interactivity_api();

		$markup = $this->render( array( 'attributeTaxonomy' => 'pa_color' ) );

		$this->assertStringContainsString( 'jetpack-search-filter__list--skeleton', $markup );
		$this->assertStringContainsString( 'jetpack-search-filter__item--skeleton', $markup );
		// The skeleton list carries a static `hidden` attribute off the initial
		// paint. Match `hidden` only as a standalone attribute (preceded by
		// whitespace, followed by whitespace / `>` / `=`) so the assertion can't
		// be satisfied by `data-wp-bind--hidden` or `aria-hidden`.
		$this->assertSame( 1, preg_match( '/<ul[^>]*\s+hidden(?=\s|\/|>|=)/', $markup ) );
		// The wrapper is hidden too — no buckets and no initial load.
		$this->assertSame( 1, preg_match( '/<div[^>]*\s+hidden(?=\s|\/|>|=)/', $markup ) );
	}

	/**
	 * On a deep-link URL that carries a `pa_<slug>[]=value` param, the block
	 * must emit the shimmer skeleton rows on first paint (matching the
	 * behaviour of filter-checkbox / filter-date). RSM-2809 regression guard.
	 */
	public function test_skeleton_is_emitted_when_initial_loading(): void {
		$this->require_interactivity_api();

		$markup = $this->render_with_skeleton( array( 'attributeTaxonomy' => 'pa_color' ) );

		$this->assertStringContainsString( 'jetpack-search-filter__list--skeleton', $markup );
		$this->assertStringContainsString( 'jetpack-search-filter__item--skeleton', $markup );
		// Wrapper and skeleton list must be visible while the skeleton is up —
		// no static `hidden` attribute on the opening div or any `<ul>`. Matches
		// `hidden` only as a standalone attribute so the indirect bindings
		// (`data-wp-bind--hidden`, `aria-hidden`, `wrapperHidden`) don't
		// false-positive.
		$this->assertSame( 0, preg_match( '/<div[^>]*\s+hidden(?=\s|\/|>|=)/', $markup ) );
		$this->assertSame( 0, preg_match( '/<ul[^>]*\s+hidden(?=\s|\/|>|=)/', $markup ) );
	}

	/**
	 * During initial loading the skeleton list carries the IA binding that
	 * hides it once the first fetch resolves client-side.
	 */
	public function test_skeleton_carries_state_skeleton_hidden_binding(): void {
		$this->require_interactivity_api();

		$markup = $this->render_with_skeleton( array( 'attributeTaxonomy' => 'pa_color' ) );

		$this->assertStringContainsString( 'state.skeletonHidden', $markup );
	}

	/**
	 * The wrapper uses the shared `context.wrapperHidden` binding and the
	 * `syncFilterWrapperVisibility` watch callback — matching the pattern used
	 * by filter-checkbox and filter-date.
	 */
	public function test_wrapper_uses_context_wrapper_hidden_binding(): void {
		$this->require_interactivity_api();

		$markup = $this->render( array( 'attributeTaxonomy' => 'pa_color' ) );

		$this->assertStringContainsString( 'context.wrapperHidden', $markup );
		$this->assertStringContainsString( 'callbacks.syncFilterWrapperVisibility', $markup );
		// Must NOT use the old direct state binding.
		$this->assertStringNotContainsString( '!state.hasFilterBuckets', $markup );
	}

	/**
	 * When no `attributeTaxonomy` is set, the block bails early and renders
	 * nothing (the editor would show a Placeholder in this state).
	 */
	public function test_empty_taxonomy_renders_nothing(): void {
		$this->require_interactivity_api();

		$markup = $this->render( array( 'attributeTaxonomy' => '' ) );

		$this->assertSame( '', $markup );
	}

	/**
	 * A custom label is emitted as an `<h3>` heading before the skeleton or
	 * the filter list.
	 */
	public function test_label_is_rendered_as_heading(): void {
		$this->require_interactivity_api();

		$markup = $this->render_with_skeleton(
			array(
				'attributeTaxonomy' => 'pa_color',
				'label'             => 'Colour',
			)
		);

		$this->assertStringContainsString( '<h3 class="jetpack-search-filter__title">Colour</h3>', $markup );
	}
}
