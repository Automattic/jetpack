<?php
/**
 * Search Results block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Integration tests for the search-results block render template.
 */
class Search_Results_Render_Test extends TestCase {

	/**
	 * Register the search-results block inline so `do_blocks()` can resolve it
	 * without depending on built artifacts.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		\register_block_type(
			'jetpack/search-results',
			array(
				'attributes'      => array(
					'layout'           => array(
						'type'    => 'string',
						'default' => 'expanded',
					),
					'noResultsMessage' => array(
						'type'    => 'string',
						'default' => '',
					),
					'errorMessage'     => array(
						'type'    => 'string',
						'default' => '',
					),
				),
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/search-results/render.php';
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
		\unregister_block_type( 'jetpack/search-results' );
		parent::tearDownAfterClass();
	}

	/**
	 * Render the search-results block with the given attributes via `do_blocks`.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		return do_blocks( '<!-- wp:jetpack/search-results ' . $json . ' /-->' );
	}

	/**
	 * Compact result rows match Instant Search's normal single-site result
	 * metadata and do not render an author byline.
	 */
	public function test_compact_layout_does_not_render_author_slot() {
		$markup = $this->render( array( 'layout' => 'compact' ) );
		$this->assertStringContainsString( 'jetpack-search-results--compact', $markup );
		$this->assertStringNotContainsString( 'jetpack-search-results__author', $markup );
		$this->assertStringNotContainsString( 'context.result.author', $markup );
	}

	/**
	 * Expanded is the default layout when no `layout` attribute is set, and
	 * it opts into the path + image sections.
	 */
	public function test_expanded_layout_is_the_default_and_includes_path_and_image() {
		$markup = $this->render();
		$this->assertStringContainsString( 'jetpack-search-results--expanded', $markup );
		$this->assertStringContainsString( 'jetpack-search-results__path', $markup );
		$this->assertStringContainsString( 'jetpack-search-results__image', $markup );
	}

	/**
	 * Compact omits the path and image sections — its row only carries a
	 * title and a date.
	 */
	public function test_compact_layout_omits_path_and_image() {
		$markup = $this->render( array( 'layout' => 'compact' ) );
		$this->assertStringNotContainsString( 'jetpack-search-results__path', $markup );
		$this->assertStringNotContainsString( 'jetpack-search-results__image-link', $markup );
	}

	/**
	 * Product layout renders price + rating bindings and omits the path /
	 * date sections that aren't relevant for a WooCommerce grid card.
	 */
	public function test_product_layout_renders_price_and_rating_bindings() {
		$markup = $this->render( array( 'layout' => 'product' ) );
		$this->assertStringContainsString( 'jetpack-search-results--product', $markup );
		$this->assertStringContainsString( 'jetpack-search-results__price', $markup );
		$this->assertStringContainsString( 'jetpack-search-results__rating', $markup );
		$this->assertStringContainsString( 'context.result.formattedPrice', $markup );
		$this->assertStringContainsString( 'context.result.ratingPercent', $markup );
		$this->assertStringNotContainsString( 'jetpack-search-results__path', $markup );
		$this->assertStringNotContainsString( 'jetpack-search-results__date', $markup );
	}

	/**
	 * Product layout renders the match-hint badge with Interactivity API bindings
	 * for hiding when there is no hint and toggling between content / comments text.
	 */
	public function test_product_layout_renders_match_hint_badge() {
		$markup = $this->render( array( 'layout' => 'product' ) );
		$this->assertStringContainsString( 'jetpack-search-results__match-hint', $markup );
		$this->assertStringContainsString( 'context.result.matchHint', $markup );
		$this->assertStringContainsString( 'context.result.matchHintIsComments', $markup );
		$this->assertStringContainsString( '<mark>', $markup );
		$this->assertStringContainsString( 'Matches content', $markup );
		$this->assertStringContainsString( 'Matches comments', $markup );
	}

	/**
	 * Non-product layouts (expanded, compact) must NOT render the match-hint
	 * badge — it is gated strictly to the product layout.
	 */
	public function test_non_product_layouts_do_not_render_match_hint_badge() {
		foreach ( array( 'expanded', 'compact' ) as $layout ) {
			$markup = $this->render( array( 'layout' => $layout ) );
			$this->assertStringNotContainsString(
				'jetpack-search-results__match-hint',
				$markup,
				"Layout '$layout' should not contain the match-hint badge."
			);
		}
	}

	/**
	 * Unknown layout values fall back to the expanded defaults so a
	 * misconfigured block never renders an empty list.
	 */
	public function test_unknown_layout_falls_back_to_expanded() {
		$markup = $this->render( array( 'layout' => 'nonsense' ) );
		$this->assertStringContainsString( 'jetpack-search-results--expanded', $markup );
	}

	/**
	 * Pre-rename block markup used `card` for what is now called `expanded`.
	 * Saved content with `{"layout":"card"}` should keep rendering as the
	 * first-class expanded layout, not fall through the unknown-layout path.
	 */
	public function test_legacy_card_value_resolves_to_expanded() {
		$markup = $this->render( array( 'layout' => 'card' ) );
		$this->assertStringContainsString( 'jetpack-search-results--expanded', $markup );
		$this->assertStringContainsString( 'jetpack-search-results__path', $markup );
		$this->assertStringContainsString( 'jetpack-search-results__image', $markup );
	}

	/**
	 * Expanded layout emits the content-snippet section wired to
	 * `context.result.hasContentPieces` / `context.result.contentPieces`
	 * so highlighted passages from the API surface under the title.
	 */
	public function test_expanded_layout_renders_content_snippet_bindings() {
		$markup = $this->render( array( 'layout' => 'expanded' ) );
		$this->assertStringContainsString( 'jetpack-search-results__content', $markup );
		$this->assertStringContainsString( 'context.result.hasContentPieces', $markup );
		$this->assertStringContainsString( 'context.result.contentPieces', $markup );
	}

	/**
	 * Compact layout should NOT render the content-snippet section — the
	 * dense single-line row only carries a title and a date.
	 */
	public function test_compact_layout_omits_content_snippet() {
		$markup = $this->render( array( 'layout' => 'compact' ) );
		$this->assertStringNotContainsString( 'jetpack-search-results__content', $markup );
		$this->assertStringNotContainsString( 'context.result.contentPieces', $markup );
	}

	/**
	 * Product layout should NOT render the content-snippet section — product
	 * cards show price and rating instead of an editorial excerpt.
	 */
	public function test_product_layout_omits_content_snippet() {
		$markup = $this->render( array( 'layout' => 'product' ) );
		$this->assertStringNotContainsString( 'jetpack-search-results__content', $markup );
		$this->assertStringNotContainsString( 'context.result.contentPieces', $markup );
	}

	/**
	 * The block renders the no-results region with the default copy when no
	 * custom message is provided. The region is hidden by default and gated
	 * by `state.showNoResults` on hydration.
	 */
	public function test_no_results_region_falls_back_to_default_message() {
		$markup = $this->render();
		$this->assertStringContainsString( 'jetpack-search-results__no-results', $markup );
		$this->assertStringContainsString( 'No results found. Try a different search.', $markup );
		$this->assertStringContainsString( 'data-wp-bind--hidden="!state.showNoResults"', $markup );
	}

	/**
	 * A custom `noResultsMessage` replaces the default empty-state copy.
	 */
	public function test_no_results_region_renders_custom_message() {
		$markup = $this->render( array( 'noResultsMessage' => 'Nothing here, sorry.' ) );
		$this->assertStringContainsString( 'Nothing here, sorry.', $markup );
		$this->assertStringNotContainsString( 'No results found. Try a different search.', $markup );
	}

	/**
	 * Both message attributes are user-controlled, so the template must
	 * escape HTML to prevent stored XSS through a crafted attribute value.
	 */
	public function test_no_results_message_is_html_escaped() {
		$markup = $this->render( array( 'noResultsMessage' => '<script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $markup );
		$this->assertStringContainsString( '&lt;script&gt;alert(1)&lt;/script&gt;', $markup );
	}

	/**
	 * A whitespace-only `noResultsMessage` must fall back to the default so
	 * an author who saved spaces still gets the intended copy.
	 */
	public function test_no_results_region_whitespace_falls_back_to_default() {
		$markup = $this->render( array( 'noResultsMessage' => "  \t\n " ) );
		$this->assertStringContainsString( 'No results found. Try a different search.', $markup );
	}

	/**
	 * The block renders the error region with the default copy when no
	 * custom message is provided. The region carries `role="alert"` so
	 * assistive tech announces it the moment it becomes visible.
	 */
	public function test_error_region_falls_back_to_default_message() {
		$markup = $this->render();
		$this->assertStringContainsString( 'jetpack-search-results__error', $markup );
		$this->assertStringContainsString( 'Something went wrong. Please try again.', $markup );
		$this->assertStringContainsString( 'data-wp-bind--hidden="!state.showError"', $markup );
		$this->assertStringContainsString( 'role="alert"', $markup );
	}

	/**
	 * A custom `errorMessage` replaces the default copy on the front end.
	 */
	public function test_error_region_renders_custom_message() {
		$markup = $this->render( array( 'errorMessage' => 'Search is offline right now.' ) );
		$this->assertStringContainsString( 'Search is offline right now.', $markup );
		$this->assertStringNotContainsString( 'Something went wrong. Please try again.', $markup );
	}

	/**
	 * A whitespace-only `errorMessage` must fall back to the default —
	 * otherwise an author who typed spaces would ship a blank alert. The
	 * Inspector help text already tells authors to leave the field empty
	 * for the default; the fallback is the belt-and-suspenders for anyone
	 * who misses that.
	 */
	public function test_error_region_whitespace_falls_back_to_default() {
		$markup = $this->render( array( 'errorMessage' => "  \t\n " ) );
		$this->assertStringContainsString( 'Something went wrong. Please try again.', $markup );
	}

	/**
	 * Both message attributes are user-controlled, so the template must
	 * escape HTML to prevent stored XSS through a crafted attribute value.
	 */
	public function test_error_message_is_html_escaped() {
		$markup = $this->render( array( 'errorMessage' => '<script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $markup );
		$this->assertStringContainsString( '&lt;script&gt;alert(1)&lt;/script&gt;', $markup );
	}

	/**
	 * Helper: render the block with `is_initial_loading()` returning true by
	 * seeding `$_GET` with a category filter. Resets the memoised cache
	 * before and after so the skeleton tests are isolated from one another
	 * and from the non-skeleton tests above.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered markup.
	 */
	private function render_with_skeleton( array $attributes = array() ): string {
		Search_Blocks::reset_initial_loading_cache();
		$_GET['category'] = array( 'test' ); // triggers parse_url_filters() → is_initial_loading() === true
		$markup            = $this->render( $attributes );
		unset( $_GET['category'] );
		Search_Blocks::reset_initial_loading_cache();
		return $markup;
	}

	/**
	 * Under is_initial_loading, the product-layout skeleton places a square
	 * image placeholder at the top of each item — before the copy block —
	 * matching the actual product item's flex-direction:column / image-first
	 * layout. No path or meta rows should appear (those belong to the
	 * expanded layout only).
	 */
	public function test_product_layout_skeleton_has_square_image_first_and_no_path_or_meta() {
		$markup = $this->render_with_skeleton( array( 'layout' => 'product' ) );

		$this->assertStringContainsString( 'jetpack-search-results__item--skeleton', $markup );

		// Square product-image placeholder must be present.
		$this->assertStringContainsString( 'jetpack-search-skeleton--product-image', $markup );

		// Standard 16/10 image skeleton must NOT be emitted for the product layout.
		$this->assertStringNotContainsString( 'jetpack-search-skeleton--image', $markup );

		// No path or meta skeletons — the product card does not show those.
		$this->assertStringNotContainsString( 'jetpack-search-skeleton--path', $markup );
		$this->assertStringNotContainsString( 'jetpack-search-skeleton--meta', $markup );

		// Image placeholder comes before the copy block in DOM order.
		$image_pos = strpos( $markup, 'jetpack-search-skeleton--product-image' );
		$copy_pos  = strpos( $markup, 'jetpack-search-results__copy' );
		$this->assertNotFalse( $image_pos, 'Product-image skeleton placeholder must be present.' );
		$this->assertNotFalse( $copy_pos, 'Copy wrapper must be present in the skeleton item.' );
		$this->assertLessThan( $copy_pos, $image_pos, 'Product-image placeholder must precede the copy block in DOM order.' );
	}

	/**
	 * Under is_initial_loading, the product-layout skeleton includes a small
	 * price placeholder in addition to the title skeleton.
	 */
	public function test_product_layout_skeleton_includes_price_placeholder() {
		$markup = $this->render_with_skeleton( array( 'layout' => 'product' ) );

		$this->assertStringContainsString( 'jetpack-search-skeleton--title', $markup );
		$this->assertStringContainsString( 'jetpack-search-skeleton--price', $markup );
	}

	/**
	 * Under is_initial_loading, the expanded layout keeps the existing
	 * 16/10 image skeleton (no square product-image placeholder).
	 */
	public function test_expanded_layout_skeleton_uses_standard_image_skeleton() {
		$markup = $this->render_with_skeleton( array( 'layout' => 'expanded' ) );

		$this->assertStringContainsString( 'jetpack-search-skeleton--image', $markup );
		$this->assertStringNotContainsString( 'jetpack-search-skeleton--product-image', $markup );
		$this->assertStringContainsString( 'jetpack-search-skeleton--path', $markup );
		$this->assertStringContainsString( 'jetpack-search-skeleton--meta', $markup );
	}

	/**
	 * Under is_initial_loading, the compact layout emits no image skeleton
	 * at all — not the standard 16/10 one and not the square product one.
	 */
	public function test_compact_layout_skeleton_has_no_image_placeholder() {
		$markup = $this->render_with_skeleton( array( 'layout' => 'compact' ) );

		$this->assertStringNotContainsString( 'jetpack-search-skeleton--image', $markup );
		$this->assertStringNotContainsString( 'jetpack-search-skeleton--product-image', $markup );
	}
}
