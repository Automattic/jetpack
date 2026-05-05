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
					'layout' => array(
						'type'    => 'string',
						'default' => 'expanded',
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
}
