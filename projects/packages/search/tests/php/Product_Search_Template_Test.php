<?php

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;

/**
 * Unit tests for the Product_Search_Template singleton CPT and its
 * integration with Search_Blocks's classic-theme product-search render path.
 *
 * @package automattic/jetpack-search
 */
class Product_Search_Template_Test extends Search_TestCase {

	public function setUp(): void {
		parent::setUp();
		Product_Search_Template::register_post_type();
		Product_Search_Template::reset_customized_content_cache();
		delete_option( Product_Search_Template::OPTION_POST_ID );
	}

	public function tearDown(): void {
		$post_id = (int) get_option( Product_Search_Template::OPTION_POST_ID, 0 );
		if ( $post_id ) {
			wp_delete_post( $post_id, true );
		}
		delete_option( Product_Search_Template::OPTION_POST_ID );
		Product_Search_Template::reset_customized_content_cache();
		parent::tearDown();
	}

	/**
	 * `Product_Search_Template` must declare distinct identifiers from the
	 * two sibling singleton CPTs so they don't share a singleton — the
	 * shared base caches by class but everything else (post-type, option,
	 * nonces) is keyed by class constant.
	 */
	public function test_subclass_constants_are_distinct_from_siblings() {
		$this->assertNotSame( Search_Template::POST_TYPE, Product_Search_Template::POST_TYPE );
		$this->assertNotSame( Overlay_Template::POST_TYPE, Product_Search_Template::POST_TYPE );
		$this->assertNotSame( Search_Template::REST_BASE, Product_Search_Template::REST_BASE );
		$this->assertNotSame( Search_Template::OPTION_POST_ID, Product_Search_Template::OPTION_POST_ID );
		$this->assertNotSame( Search_Template::EDITOR_REQUEST_KEY, Product_Search_Template::EDITOR_REQUEST_KEY );
		$this->assertNotSame( Search_Template::EDITOR_NONCE, Product_Search_Template::EDITOR_NONCE );
		// `SEED_META_KEY` is stamped on every seeded row by the base
		// `ensure_post_exists()`; a shared key would let a future re-seed
		// query target the wrong subclass's posts.
		$this->assertNotSame( Search_Template::SEED_META_KEY, Product_Search_Template::SEED_META_KEY );
		$this->assertNotSame( Overlay_Template::SEED_META_KEY, Product_Search_Template::SEED_META_KEY );
		$this->assertSame( 'jp_product_search', Product_Search_Template::POST_TYPE );
		$this->assertLessThanOrEqual(
			20,
			strlen( Product_Search_Template::POST_TYPE ),
			'register_post_type() limits the slug to 20 chars.'
		);
	}

	/**
	 * No singleton on file ⇒ `get_customized_content()` returns null, the
	 * shape callers depend on to fall back to the bundled product template.
	 */
	public function test_uncustomized_state_returns_nulls() {
		$this->assertNull( Product_Search_Template::get_customized_content() );
		$this->assertFalse( Product_Search_Template::is_customized() );
		$this->assertSame( 0, Product_Search_Template::get_post_id() );
	}

	/**
	 * The REST resolver must map this CPT back to its concrete class so
	 * "Restore default" reaches the right Singleton_Template_Cpt subclass —
	 * without this entry, the route would 404 on the new post-type slug.
	 */
	public function test_rest_controller_resolves_product_search_template() {
		$controller = new \Automattic\Jetpack\Search\REST_Controller();
		$ref        = new \ReflectionMethod( $controller, 'resolve_singleton_template_class' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}

		$this->assertSame(
			Product_Search_Template::class,
			$ref->invoke( $controller, Product_Search_Template::POST_TYPE )
		);
	}

	/**
	 * The seed content for a fresh singleton is exactly what
	 * `Search_Blocks::get_classic_theme_product_search_body()` returns —
	 * placeholders substituted, template-part wrappers stripped — so the
	 * editor opens populated with the same markup the front end renders.
	 */
	public function test_seed_content_matches_classic_theme_product_search_body() {
		$seed = Search_Blocks::get_classic_theme_product_search_body();
		$this->assertNotEmpty( $seed );
		$this->assertStringNotContainsString( 'wp:template-part', $seed, 'Seed must have template-parts stripped.' );
		$this->assertStringContainsString( 'wp:jetpack-search/filters-product', $seed );
		$this->assertStringContainsString( '"layout":"product"', $seed );
	}

	/**
	 * `Search_Blocks::get_classic_theme_product_search_body()` must prefer
	 * a saved customization over the bundled file — the whole point of the
	 * CPT path. An empty string customization (admin saved a blank canvas)
	 * is honored verbatim.
	 */
	public function test_classic_theme_product_search_body_prefers_customization() {
		$post_id = wp_insert_post(
			array(
				'post_type'    => Product_Search_Template::POST_TYPE,
				'post_status'  => 'publish',
				'post_content' => '<!-- wp:heading --><h2>CUSTOMIZED_PRODUCT</h2><!-- /wp:heading -->',
			)
		);
		update_option( Product_Search_Template::OPTION_POST_ID, $post_id );
		Product_Search_Template::reset_customized_content_cache();

		$body = Search_Blocks::get_classic_theme_product_search_body();
		$this->assertStringContainsString( 'CUSTOMIZED_PRODUCT', $body );
		$this->assertStringNotContainsString( 'wp:jetpack-search/filters-product', $body, 'When customized, the bundled body must not be merged in.' );
	}

	/**
	 * Class-keyed cache on the shared base must not cross-contaminate
	 * Product_Search_Template and Search_Template lookups within a request.
	 */
	public function test_subclass_caches_are_isolated() {
		$post_id = wp_insert_post(
			array(
				'post_type'    => Product_Search_Template::POST_TYPE,
				'post_status'  => 'publish',
				'post_content' => 'PRODUCT_TEMPLATE_CONTENT',
			)
		);
		update_option( Product_Search_Template::OPTION_POST_ID, $post_id );
		Product_Search_Template::reset_customized_content_cache();

		$this->assertSame( 'PRODUCT_TEMPLATE_CONTENT', Product_Search_Template::get_customized_content() );
		$this->assertNull( Search_Template::get_customized_content() );
	}
}
