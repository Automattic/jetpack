<?php
/**
 * Results Count block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the results-count block's render template.
 *
 * Each test renders the block through `do_blocks()` so WordPress wires up
 * the block context (`WP_Block_Supports::$block_to_render`) the template
 * relies on via `get_block_wrapper_attributes()` — exercising the same path
 * the front end takes, not just an isolated `include`.
 */
class Results_Count_Render_Test extends TestCase {

	/**
	 * Register the results-count block inline (rather than from its block.json
	 * directory) so `do_blocks()` can resolve it without depending on the
	 * `build/` artifacts referenced by block.json's `viewScriptModule` and
	 * `style` entries — those aren't present in a fresh checkout, and our
	 * PHPUnit config has `failOnNotice` set, so any missing-asset notice
	 * during metadata resolution would fail the suite. The render callback
	 * just delegates to render.php, which is the file under test.
	 */
	public static function setUpBeforeClass(): void {
		\register_block_type(
			'jetpack/results-count',
			array(
				'attributes'      => array(
					'template' => array(
						'type'    => 'string',
						'default' => '',
					),
				),
				// $attributes is consumed by the included render.php via the
				// closure's local scope — phpcs can't see that, hence the disable.
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/results-count/render.php';
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
		\unregister_block_type( 'jetpack/results-count' );
	}

	/**
	 * Clear any seeded Interactivity state between tests so a custom template
	 * written by one test can't leak into another's default-template
	 * assertions. `wp_interactivity_state()` merges into a process-global
	 * store, and the suite exercises that store directly.
	 */
	protected function setUp(): void {
		parent::setUp();
		if ( function_exists( 'wp_interactivity' ) ) {
			// Re-seed the namespace with an empty strings map. Passing an
			// empty override on the `strings` key is how we zero out a prior
			// `resultsCountTemplate` value without introducing a new helper
			// on the core API surface.
			wp_interactivity_state( 'jetpack-search', array( 'strings' => array( 'resultsCountTemplate' => '' ) ) );
		}
	}

	/**
	 * Render the results-count block with the given attributes via `do_blocks`.
	 *
	 * @param array $attributes Block attributes (JSON-encoded into the comment delimiter).
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		return do_blocks( '<!-- wp:jetpack/results-count ' . $json . ' /-->' );
	}

	/**
	 * Read the current `strings.resultsCountTemplate` value from the
	 * Interactivity state store. Returns '' when no override has been seeded,
	 * which matches the render.php contract: only a non-empty user-supplied
	 * template writes to state.
	 *
	 * @return string
	 */
	private function seeded_template(): string {
		if ( ! function_exists( 'wp_interactivity_state' ) ) {
			return '';
		}
		$state = wp_interactivity_state( 'jetpack-search' );
		return (string) ( $state['strings']['resultsCountTemplate'] ?? '' );
	}

	/**
	 * An empty `template` must leave the global default in place so existing
	 * posts (saved before the attribute existed) keep rendering the original
	 * "Showing …" copy from `Search_Blocks::build_initial_strings()`. render.php
	 * signals "use the default" by not seeding any override.
	 */
	public function test_empty_template_does_not_override_default() {
		$this->render( array( 'template' => '' ) );
		$this->assertSame( '', $this->seeded_template() );
	}

	/**
	 * A missing `template` (not just empty) must also leave the default in
	 * place. Block editor saves omit attributes that match their default, so
	 * old posts arrive here without the key at all.
	 */
	public function test_missing_template_does_not_override_default() {
		$this->render();
		$this->assertSame( '', $this->seeded_template() );
	}

	/**
	 * A whitespace-only template (e.g. user typed spaces and stopped) must
	 * fall back to the default — matches the "Leave empty to use the default"
	 * promise in the editor inspector and keeps the block from pushing a
	 * blank string into shared state where it would blank out the getter's
	 * template branch for every other render on the page.
	 */
	public function test_whitespace_only_template_does_not_override_default() {
		$this->render( array( 'template' => '   ' ) );
		$this->assertSame( '', $this->seeded_template() );
	}

	/**
	 * A custom non-empty template is pushed into `state.strings.resultsCountTemplate`
	 * so the view-bundle getter reads it (instead of the default seeded by
	 * `Search_Blocks::build_initial_strings()`) when formatting the count.
	 */
	public function test_custom_template_overrides_state() {
		$custom = 'Showing %1$d of %3$d results for %4$s';
		$this->render( array( 'template' => $custom ) );
		$this->assertSame( $custom, $this->seeded_template() );
	}

	/**
	 * An unsupported placeholder (e.g. %5$d) must survive into state verbatim.
	 * render.php never formats the template itself — it only forwards the raw
	 * string, and the JS formatter leaves unknown placeholders in place so
	 * authors get a visible hint on the front end rather than a silent swallow.
	 */
	public function test_unsupported_placeholder_survives_state() {
		$custom = 'Page %1$d–%2$d, extra=%5$d, total=%3$d';
		$this->render( array( 'template' => $custom ) );
		$this->assertSame( $custom, $this->seeded_template() );
	}

	/**
	 * The template is user-controlled. `wp_interactivity_state()` serialises
	 * its payload into a single JSON blob in the output HTML, so any HTML in
	 * the template must ride through as escaped JSON text rather than as a
	 * live `<script>` element in the rendered page.
	 */
	public function test_template_with_html_is_not_rendered_as_markup() {
		$markup = $this->render( array( 'template' => '<script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $markup );
	}

	/**
	 * The rendered element must carry the Interactivity wiring the store
	 * getter relies on: the namespace and the text binding. The searching
	 * label now flows through `state.strings.searching` (seeded by
	 * `build_initial_strings()`) instead of `data-wp-context`, so render.php
	 * no longer emits a context attribute at all — we assert both facts so a
	 * regression that reintroduces per-instance context would fail loudly.
	 */
	public function test_renders_interactivity_wiring_without_context() {
		$markup = $this->render();
		$this->assertStringContainsString( 'data-wp-interactive="jetpack-search"', $markup );
		$this->assertStringContainsString( 'data-wp-text="state.resultsCountText"', $markup );
		$this->assertStringNotContainsString( 'data-wp-context', $markup );
	}
}
