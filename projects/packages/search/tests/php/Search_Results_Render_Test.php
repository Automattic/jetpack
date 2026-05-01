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
						'default' => 'card',
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
}
