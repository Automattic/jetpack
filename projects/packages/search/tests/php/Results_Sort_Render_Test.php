<?php
/**
 * Results Sort block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

/**
 * Integration tests for the results-sort block's render template.
 *
 * Each test renders through `do_blocks()` so WordPress wires up the block
 * context `get_block_wrapper_attributes()` needs — exercising the same path
 * the front end takes, not just an isolated `include`.
 */
class Results_Sort_Render_Test extends TestCase {

	/**
	 * Register the results-sort block inline so `do_blocks()` can resolve it
	 * without requiring the `build/` artifacts referenced by block.json's
	 * `viewScriptModule` and `style` entries. The render callback forwards
	 * `$attributes` to the render.php under test.
	 */
	public static function setUpBeforeClass(): void {
		\register_block_type(
			'jetpack-search/results-sort',
			array(
				'attributes'      => array(
					'defaultSort'          => array(
						'type'    => 'string',
						'default' => 'relevance',
					),
					'availableSortOptions' => array(
						'type'    => 'array',
						'default' => array( 'relevance', 'newest', 'oldest' ),
					),
					'label'                => array(
						'type'    => 'string',
						'default' => '',
					),
					'displayAs'            => array(
						'type'    => 'string',
						'default' => 'select',
					),
					'display'              => array(
						'type' => 'string',
					),
				),
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/results-sort/render.php';
					return (string) ob_get_clean();
				},
				// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			)
		);
	}

	/**
	 * Release the block registration so subsequent test classes don't
	 * collide with our inline attribute schema.
	 */
	public static function tearDownAfterClass(): void {
		\unregister_block_type( 'jetpack-search/results-sort' );
	}

	/**
	 * Reset `$_GET` between tests so URL parsing never leaks across cases.
	 * Interactivity state carries across tests, but render.php always writes
	 * `sortOrder` deterministically from attrs + URL, so each render
	 * overwrites whatever the previous one left behind.
	 */
	protected function setUp(): void {
		parent::setUp();
		$_GET = array();
	}

	/**
	 * Render the results-sort block with the given attributes via `do_blocks`.
	 *
	 * @param array $attributes Block attributes (JSON-encoded into the comment delimiter).
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		return do_blocks( '<!-- wp:jetpack-search/results-sort ' . $json . ' /-->' );
	}

	/** Default render: dropdown, "Sort by", all base options. Product keys deferred to RSM-1082. */
	public function test_default_attributes_render_select_with_base_options() {
		$markup = $this->render();
		$this->assertStringContainsString( '<select', $markup );
		$this->assertStringContainsString( 'Sort by', $markup );
		foreach ( array( 'relevance', 'newest', 'oldest' ) as $key ) {
			$this->assertStringContainsString( 'value="' . $key . '"', $markup );
		}
	}

	/** `displayAs=radio` emits a `<fieldset>` of radios, not a dropdown. */
	public function test_display_as_radio_renders_fieldset_with_radios() {
		$markup = $this->render( array( 'displayAs' => 'radio' ) );
		$this->assertStringContainsString( '<fieldset', $markup );
		$this->assertStringNotContainsString( '<select', $markup );
		$this->assertStringContainsString( 'type="radio"', $markup );
	}

	/** `displayAs=popover` emits the compact icon trigger and menu. */
	public function test_display_as_popover_renders_menu() {
		$markup = $this->render( array( 'displayAs' => 'popover' ) );
		$this->assertStringContainsString( 'jetpack-search-sort--popover', $markup );
		$this->assertStringContainsString( 'aria-haspopup="menu"', $markup );
		$this->assertStringContainsString( 'role="menu"', $markup );
		$this->assertStringNotContainsString( '<select', $markup );
	}

	/**
	 * Blocks inserted before `displayAs` landed used `display=popover`.
	 * They must keep rendering the compact icon trigger.
	 */
	public function test_legacy_display_popover_renders_menu() {
		$markup = $this->render( array( 'display' => 'popover' ) );
		$this->assertStringContainsString( 'jetpack-search-sort--popover', $markup );
		$this->assertStringContainsString( 'aria-haspopup="menu"', $markup );
		$this->assertStringContainsString( 'role="menu"', $markup );
		$this->assertStringNotContainsString( '<select', $markup );
	}

	/**
	 * Popover menu items participate in the ARIA menu keyboard pattern:
	 * each item starts with `tabindex="-1"` (server-rendered), carries a
	 * roving-tabindex binding, a `data-wp-context` with its sort key, and
	 * a keydown handler so arrow keys can navigate within the menu. The
	 * trigger also has its own keydown handler so ArrowDown/ArrowUp open
	 * the popover with focus on the first or last item.
	 */
	public function test_display_as_popover_menu_items_have_keyboard_navigation_hooks() {
		$markup = $this->render( array( 'displayAs' => 'popover' ) );

		// Trigger handles ArrowDown/ArrowUp/Enter/Space to open the menu.
		$this->assertMatchesRegularExpression(
			'/class="jetpack-search-sort__trigger"[^>]*data-wp-on--keydown="actions\.onSortTriggerKeydown"/s',
			$markup
		);

		// Each menu item ships with the roving-tabindex defaults.
		$this->assertStringContainsString( 'data-wp-bind--tabindex="state.sortMenuItemTabIndex"', $markup );
		$this->assertStringContainsString( 'data-wp-on--keydown="actions.onSortMenuKeydown"', $markup );
		$this->assertMatchesRegularExpression(
			'/class="jetpack-search-sort__menu-item"[^>]*tabindex="-1"/s',
			$markup
		);

		// Per-item context carries the sort key for the watch callback.
		$this->assertStringContainsString( 'data-wp-context=', $markup );
		$this->assertStringContainsString( '&quot;sortKey&quot;:&quot;relevance&quot;', $markup );
		$this->assertStringContainsString( '&quot;sortKey&quot;:&quot;newest&quot;', $markup );
		$this->assertStringContainsString( '&quot;sortKey&quot;:&quot;oldest&quot;', $markup );
	}

	/** URL `?orderby=` wins over `defaultSort` so deep links keep their meaning. */
	public function test_url_sort_wins_over_default_sort() {
		$_GET = array( 'orderby' => 'oldest' );
		try {
			$markup = $this->render( array( 'defaultSort' => 'newest' ) );
			$this->assertMatchesRegularExpression(
				'/<option[^>]*value="oldest"[^>]*selected/',
				$markup
			);
			$this->assertDoesNotMatchRegularExpression(
				'/<option[^>]*value="newest"[^>]*selected/',
				$markup
			);
		} finally {
			$_GET = array();
		}
	}

	/** Label is user-controlled; must be HTML-escaped to block stored XSS. */
	public function test_label_is_html_escaped() {
		$markup = $this->render( array( 'label' => '<script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $markup );
		$this->assertStringContainsString( '&lt;script&gt;alert(1)&lt;/script&gt;', $markup );
	}
}
