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
	 * Reset `$_GET` and the WC-blocks-enabled memo between tests so URL parsing
	 * and the gate state never leak across cases. Interactivity state
	 * carries across tests, but render.php always writes `sortOrder`
	 * deterministically from attrs + URL, so each render overwrites
	 * whatever the previous one left behind.
	 */
	protected function setUp(): void {
		parent::setUp();
		$_GET = array();
		Search_Blocks::reset_woocommerce_blocks_enabled_cache();
	}

	protected function tearDown(): void {
		Search_Blocks::reset_woocommerce_blocks_enabled_cache();
		parent::tearDown();
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

	/** Default render on a non-Woo site: dropdown, "Sort by", base options only. */
	public function test_default_attributes_render_select_with_base_options() {
		$markup = $this->render();
		$this->assertStringContainsString( '<select', $markup );
		$this->assertStringContainsString( 'Sort by', $markup );
		foreach ( array( 'relevance', 'newest', 'oldest' ) as $key ) {
			$this->assertStringContainsString( 'value="' . $key . '"', $markup );
		}
		foreach ( array( 'rating_desc', 'price_asc', 'price_desc' ) as $key ) {
			$this->assertStringNotContainsString( 'value="' . $key . '"', $markup );
		}
	}

	/**
	 * On a WooCommerce site, when an author opts the product-format keys
	 * into `availableSortOptions`, the renderer must expose them with the
	 * matching translated labels. Authors keep the base-three default until
	 * they explicitly check the new options in the inspector — that's the
	 * "non-Woo behavior is unchanged" half of the acceptance criteria.
	 */
	public function test_woocommerce_active_renders_product_keys_when_author_opts_in() {
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( true );
		try {
			$markup = $this->render(
				array(
					'availableSortOptions' => array(
						'relevance',
						'newest',
						'oldest',
						'rating_desc',
						'price_asc',
						'price_desc',
					),
				)
			);
			foreach ( array( 'relevance', 'newest', 'oldest', 'rating_desc', 'price_asc', 'price_desc' ) as $key ) {
				$this->assertStringContainsString( 'value="' . $key . '"', $markup );
			}
			$this->assertStringContainsString( 'Rating', $markup );
			$this->assertStringContainsString( 'Price: low to high', $markup );
			$this->assertStringContainsString( 'Price: high to low', $markup );
		} finally {
			Search_Blocks::set_woocommerce_blocks_enabled_for_testing( null );
		}
	}

	/**
	 * Even when WooCommerce is active, an unmodified block insertion — same
	 * defaults the author would get on a non-Woo site — keeps the base
	 * three options. This protects the "looks exactly as it does after
	 * jetpack#48282" promise from the issue's acceptance criteria.
	 */
	public function test_woocommerce_active_keeps_base_options_when_author_did_not_opt_in() {
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( true );
		try {
			$markup = $this->render();
			foreach ( array( 'relevance', 'newest', 'oldest' ) as $key ) {
				$this->assertStringContainsString( 'value="' . $key . '"', $markup );
			}
			foreach ( array( 'rating_desc', 'price_asc', 'price_desc' ) as $key ) {
				$this->assertStringNotContainsString( 'value="' . $key . '"', $markup );
			}
		} finally {
			Search_Blocks::set_woocommerce_blocks_enabled_for_testing( null );
		}
	}

	/**
	 * On a non-Woo site a `?orderby=price_asc` deep link must collapse to
	 * the block's `defaultSort` (which itself falls back to `relevance`),
	 * mirroring the JS-side gate in store/url-state.js.
	 */
	public function test_url_product_sort_collapses_when_woocommerce_inactive() {
		$_GET = array( 'orderby' => 'price_asc' );
		try {
			$markup = $this->render();
			$this->assertStringNotContainsString( 'value="price_asc"', $markup );
			$this->assertMatchesRegularExpression(
				'/<option[^>]*value="relevance"[^>]*selected/',
				$markup
			);
		} finally {
			$_GET = array();
		}
	}

	/**
	 * On a Woo site the URL `?orderby=price_asc` must win over `defaultSort`
	 * and select the corresponding option so deep links round-trip end-to-end.
	 */
	public function test_url_product_sort_selected_when_woocommerce_active() {
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( true );
		$_GET = array( 'orderby' => 'price_asc' );
		try {
			$markup = $this->render(
				array( 'availableSortOptions' => array( 'relevance', 'price_asc', 'price_desc' ) )
			);
			$this->assertMatchesRegularExpression(
				'/<option[^>]*value="price_asc"[^>]*selected/',
				$markup
			);
		} finally {
			$_GET = array();
			Search_Blocks::set_woocommerce_blocks_enabled_for_testing( null );
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
		$this->assertStringContainsString( 'jetpack-search-results-sort--popover', $markup );
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
		$this->assertStringContainsString( 'jetpack-search-results-sort--popover', $markup );
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
			'/class="jetpack-search-results-sort__trigger"[^>]*data-wp-on--keydown="actions\.onSortTriggerKeydown"/s',
			$markup
		);

		// Each menu item ships with the roving-tabindex defaults.
		$this->assertStringContainsString( 'data-wp-bind--tabindex="state.sortMenuItemTabIndex"', $markup );
		$this->assertStringContainsString( 'data-wp-on--keydown="actions.onSortMenuKeydown"', $markup );
		$this->assertMatchesRegularExpression(
			'/class="jetpack-search-results-sort__menu-item"[^>]*tabindex="-1"/s',
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

	/**
	 * Every popover menu item — base or product — must bind `aria-checked`
	 * to the shared `state.isSortOptionSelected` getter (which reads back
	 * through `data-wp-context.sortKey`). Using a per-key getter map would
	 * leave product keys falling through to a literal `"false"` binding,
	 * which the Interactivity API resolves as `state.false` (undefined),
	 * leaving screen reader users without a "currently selected" signal.
	 */
	public function test_display_as_popover_aria_checked_uses_shared_getter_for_all_keys() {
		Search_Blocks::set_woocommerce_blocks_enabled_for_testing( true );
		try {
			$markup = $this->render(
				array(
					'displayAs'            => 'popover',
					'availableSortOptions' => array( 'relevance', 'newest', 'oldest', 'rating_desc', 'price_asc', 'price_desc' ),
				)
			);
			foreach ( array( 'relevance', 'newest', 'oldest', 'rating_desc', 'price_asc', 'price_desc' ) as $key ) {
				$this->assertMatchesRegularExpression(
					'/data-wp-context=\'[^\']*' . preg_quote( $key, '/' ) . '[^\']*\'\s+data-wp-bind--aria-checked="state\.isSortOptionSelected"/s',
					$markup,
					"Expected $key menu item to bind aria-checked to state.isSortOptionSelected."
				);
			}
			$this->assertStringNotContainsString( 'data-wp-bind--aria-checked="false"', $markup );
		} finally {
			Search_Blocks::set_woocommerce_blocks_enabled_for_testing( null );
		}
	}

	/** Label is user-controlled; must be HTML-escaped to block stored XSS. */
	public function test_label_is_html_escaped() {
		$markup = $this->render( array( 'label' => '<script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $markup );
		$this->assertStringContainsString( '&lt;script&gt;alert(1)&lt;/script&gt;', $markup );
	}
}
