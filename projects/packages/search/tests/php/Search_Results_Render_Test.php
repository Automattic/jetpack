<?php
/**
 * Search Results block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests that the search-results block seeds `state.staticPostTypes` from its
 * author-set `postTypeMode` + `postTypes` attributes — the single source of
 * truth for "which post types this search experience covers."
 *
 * The block is registered inline (rather than via its block.json) so
 * `do_blocks()` can resolve it without the `build/` artifacts the block.json
 * declares — those aren't present in a fresh checkout, and our PHPUnit config
 * trips `failOnNotice` on the missing-asset notices the metadata path emits.
 */
class Search_Results_Render_Test extends TestCase {

	/**
	 * Register the search-results block inline + a couple of fixture CPTs so
	 * `Filter_Post_Type::build_constraint`'s searchable-types allowlist passes
	 * for the slugs we exercise.
	 */
	public static function setUpBeforeClass(): void {
		\register_post_type(
			'product',
			array(
				'public'              => true,
				'exclude_from_search' => false,
				'labels'              => array( 'singular_name' => 'Product' ),
			)
		);
		\register_post_type(
			'portfolio',
			array(
				'public'              => true,
				'exclude_from_search' => false,
				'labels'              => array( 'singular_name' => 'Portfolio' ),
			)
		);

		\register_block_type(
			'jetpack-search/search-results',
			array(
				'attributes'      => array(
					'postTypeMode' => array(
						'type'    => 'string',
						'enum'    => array( 'include', 'exclude' ),
						'default' => 'exclude',
					),
					'postTypes'    => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array( 'type' => 'string' ),
					),
				),
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes, $content ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/search-results/render.php';
					return (string) ob_get_clean();
				},
				// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			)
		);
	}

	/**
	 * Clean up the inline registrations so other suites start fresh.
	 */
	public static function tearDownAfterClass(): void {
		\unregister_block_type( 'jetpack-search/search-results' );
		\unregister_post_type( 'product' );
		\unregister_post_type( 'portfolio' );
	}

	/**
	 * Reset the searchable-types static cache + the Interactivity state
	 * singleton between tests. `wp_interactivity_state()` deep-merges every
	 * call, so without a hard reset the include/exclude lists from one test
	 * bleed into the next. The singleton's `state_data` property is private
	 * on WP core — Reflection is the only handle.
	 */
	protected function setUp(): void {
		parent::setUp();
		$cache = ( new \ReflectionClass( Filter_Post_Type::class ) )->getProperty( 'searchable_cache' );
		if ( PHP_VERSION_ID < 80100 ) {
			$cache->setAccessible( true );
		}
		$cache->setValue( null, null );

		$interactivity = wp_interactivity();
		$ref           = new \ReflectionClass( $interactivity );
		if ( $ref->hasProperty( 'state_data' ) ) {
			$prop = $ref->getProperty( 'state_data' );
			if ( PHP_VERSION_ID < 80100 ) {
				$prop->setAccessible( true );
			}
			$prop->setValue( $interactivity, array() );
		}
	}

	/**
	 * Render the search-results block via `do_blocks` with the given attributes.
	 *
	 * @param array $attributes Block attributes (JSON-encoded into the comment delimiter).
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		return do_blocks(
			'<!-- wp:jetpack-search/search-results ' . $json . ' --><!-- /wp:jetpack-search/search-results -->'
		);
	}

	/**
	 * Single-slug include scope seeds `state.staticPostTypes` with the
	 * `{ include: [slug], exclude: [] }` shape `buildStaticPostTypeClauses`
	 * consumes in the JS store.
	 */
	public function test_render_seeds_include_scope_into_interactivity_state() {
		$this->render(
			array(
				'postTypeMode' => 'include',
				'postTypes'    => array( 'product' ),
			)
		);
		$state = wp_interactivity_state( 'jetpack-search' );
		$this->assertSame(
			array(
				'include' => array( 'product' ),
				'exclude' => array(),
			),
			$state['staticPostTypes']
		);
	}

	/**
	 * Exclude mode seeds the `exclude` side and leaves `include` empty — the
	 * single-mode UX guarantee carried through from `build_constraint()`.
	 */
	public function test_render_seeds_exclude_scope_into_interactivity_state() {
		$this->render(
			array(
				'postTypeMode' => 'exclude',
				'postTypes'    => array( 'product' ),
			)
		);
		$state = wp_interactivity_state( 'jetpack-search' );
		$this->assertSame(
			array(
				'include' => array(),
				'exclude' => array( 'product' ),
			),
			$state['staticPostTypes']
		);
	}

	/**
	 * Unconfigured block (default attrs, empty `postTypes`) leaves the
	 * `staticPostTypes` slot absent from the seed — the store's
	 * `state.staticPostTypes ?? null` fall-through then produces no ES clause.
	 */
	public function test_render_does_not_seed_for_empty_scope() {
		$this->render( array() );
		$state = wp_interactivity_state( 'jetpack-search' );
		$this->assertArrayNotHasKey( 'staticPostTypes', $state );
	}

	/**
	 * Slug sanitization + the searchable-types allowlist flow through
	 * `Filter_Post_Type::build_constraint()` — an unregistered or malformed
	 * slug drops before reaching the seed. Verifies the boundary is in place
	 * even if the saved block attributes drift away from registered CPTs
	 * (older block schemas, hand-edited markup).
	 */
	public function test_render_drops_unregistered_or_malformed_slugs() {
		$this->render(
			array(
				'postTypeMode' => 'include',
				'postTypes'    => array( 'product', 'not_a_real_cpt', '<bad>' ),
			)
		);
		$state = wp_interactivity_state( 'jetpack-search' );
		$this->assertSame( array( 'product' ), $state['staticPostTypes']['include'] );
	}
}
