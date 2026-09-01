<?php

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;

/**
 * Unit tests for the Product_Overlay_Template singleton CPT — the WooCommerce
 * product variant of the blocks-overlay template.
 *
 * @package automattic/jetpack-search
 */
class Product_Overlay_Template_Test extends Search_TestCase {

	public function setUp(): void {
		parent::setUp();
		Product_Overlay_Template::register_post_type();
		Product_Overlay_Template::reset_customized_content_cache();
		delete_option( Product_Overlay_Template::OPTION_POST_ID );
	}

	public function tearDown(): void {
		$post_id = (int) get_option( Product_Overlay_Template::OPTION_POST_ID, 0 );
		if ( $post_id ) {
			wp_delete_post( $post_id, true );
		}
		delete_option( Product_Overlay_Template::OPTION_POST_ID );
		Product_Overlay_Template::reset_customized_content_cache();
		parent::tearDown();
	}

	/**
	 * Distinct identifiers from the three sibling singleton CPTs so they never
	 * share a singleton — the shared base caches by class, but post-type,
	 * option, nonces and seed-meta are keyed by class constant.
	 */
	public function test_subclass_constants_are_distinct_from_siblings() {
		$this->assertNotSame( Overlay_Template::POST_TYPE, Product_Overlay_Template::POST_TYPE );
		$this->assertNotSame( Product_Search_Template::POST_TYPE, Product_Overlay_Template::POST_TYPE );
		$this->assertNotSame( Overlay_Template::OPTION_POST_ID, Product_Overlay_Template::OPTION_POST_ID );
		$this->assertNotSame( Overlay_Template::EDITOR_REQUEST_KEY, Product_Overlay_Template::EDITOR_REQUEST_KEY );
		$this->assertNotSame( Overlay_Template::EDITOR_NONCE, Product_Overlay_Template::EDITOR_NONCE );
		$this->assertNotSame( Overlay_Template::SEED_META_KEY, Product_Overlay_Template::SEED_META_KEY );
		$this->assertLessThanOrEqual(
			20,
			strlen( Product_Overlay_Template::POST_TYPE ),
			'register_post_type() limits the slug to 20 chars.'
		);
	}

	/**
	 * No singleton on file ⇒ `get_customized_content()` returns null, the shape
	 * `get_overlay_template_content()` depends on to fall back to the bundled
	 * product overlay template.
	 */
	public function test_uncustomized_state_returns_nulls() {
		$this->assertNull( Product_Overlay_Template::get_customized_content() );
		$this->assertFalse( Product_Overlay_Template::is_customized() );
		$this->assertSame( 0, Product_Overlay_Template::get_post_id() );
	}

	/**
	 * The REST resolver must map this CPT back to its concrete class so
	 * "Restore default" reaches the right subclass — without the map entry the
	 * route would 404 on the product-overlay slug.
	 */
	public function test_rest_controller_resolves_product_overlay_template() {
		$controller = new REST_Controller();
		$ref        = new \ReflectionMethod( $controller, 'resolve_singleton_template_class' );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}

		$this->assertSame(
			Product_Overlay_Template::class,
			$ref->invoke( $controller, Product_Overlay_Template::POST_TYPE )
		);
	}

	/**
	 * The bundled seed is the product overlay markup — product filters present,
	 * and (overlay, not page) no template-part chrome.
	 */
	public function test_read_seed_content_returns_product_overlay_markup() {
		$seed = $this->invoke_protected_static( 'read_seed_content' );
		$this->assertNotEmpty( $seed );
		$this->assertStringContainsString( 'wp:jetpack-search/filters-product', $seed );
		$this->assertStringContainsString( '"layout":"product"', $seed );
		$this->assertStringNotContainsString( 'wp:template-part', $seed, 'Overlay markup ships without header/footer parts.' );
	}

	/**
	 * Seeding a fresh singleton stamps the subclass title and the bundled
	 * product overlay body — exercises `post_title()` + `read_seed_content()`.
	 */
	public function test_ensure_post_exists_seeds_titled_product_overlay() {
		$post_id = $this->invoke_protected_static( 'ensure_post_exists' );
		$this->assertGreaterThan( 0, $post_id );

		$post = get_post( $post_id );
		$this->assertSame( Product_Overlay_Template::POST_TYPE, $post->post_type );
		$this->assertSame( 'Jetpack Search product overlay', $post->post_title );
		$this->assertStringContainsString( 'wp:jetpack-search/filters-product', $post->post_content );
	}

	/**
	 * The wp_die copy hooks return non-empty, product-overlay-specific strings.
	 */
	public function test_failure_messages_present() {
		$this->assertNotEmpty( $this->invoke_protected_static( 'forbidden_message' ) );
		$this->assertNotEmpty( $this->invoke_protected_static( 'create_failure_message' ) );
	}

	/**
	 * Invoke a protected static method on Product_Overlay_Template.
	 *
	 * @param string $method Method name.
	 * @return mixed
	 */
	private function invoke_protected_static( string $method ) {
		$ref = new \ReflectionMethod( Product_Overlay_Template::class, $method );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true );
		}
		return $ref->invoke( null );
	}
}
