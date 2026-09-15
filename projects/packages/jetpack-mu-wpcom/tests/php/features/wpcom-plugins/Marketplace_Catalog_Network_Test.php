<?php
/**
 * Tests for the marketplace catalog's reads of WordPress.com.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Marketplace_Catalog;

/**
 * Class Marketplace_Catalog_Network_Test
 *
 * Covers the paths that talk to wpcom. A site with no blog token cannot sign a
 * request, so `Client` gives up before the HTTP layer and `pre_http_request` is
 * never reached: these tests fake a site connection first, then answer the
 * requests themselves.
 */
class Marketplace_Catalog_Network_Test extends \WorDBless\BaseTestCase {

	/**
	 * A product as the marketplace endpoint returns it.
	 *
	 * @var array
	 */
	private const PRODUCT = array(
		'id'                => 2509,
		'name'              => 'Gravity Forms',
		'slug'              => 'gravityforms',
		'software_slug'     => 'gravityforms',
		'short_description' => 'Build custom forms for any project.',
		'icons'             => 'https://example.com/icon.png',
		'author'            => 'Gravity Forms',
		'version'           => '3.1.1',
		'last_updated'      => '2026-09-03',
		'variations'        => array(
			'monthly' => array( 'product_id' => 2510 ),
			'yearly'  => array( 'product_id' => 2509 ),
		),
	);

	/**
	 * The store catalog, as the products endpoint returns it: keyed by store slug,
	 * with the numeric id the marketplace payload refers to.
	 *
	 * @var array
	 */
	private const STORE_RESPONSE = array(
		'gravityforms_yearly'  => array(
			'product_id'   => 2509,
			'cost_display' => '$132.00',
		),
		'gravityforms_monthly' => array(
			'product_id'   => 2510,
			'cost_display' => '$12.00',
		),
	);

	/**
	 * Every URL requested during a test, in order.
	 *
	 * @var string[]
	 */
	private $requests = array();

	/**
	 * Give the site enough of a connection to sign a request.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();

		$this->requests = array();

		// The token has to contain a dot: signing splits it into secret and id.
		( new Tokens() )->update_blog_token( 'test.blogtoken' );
		\Jetpack_Options::update_option( 'id', 123 );

		// Until this is set the URL is built with no host and refused as malformed,
		// which happens before pre_http_request and would make these tests depend on
		// whether something else in the suite ran first.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
	}

	/**
	 * Clean up.
	 *
	 * @return void
	 */
	public function tear_down() {
		remove_all_filters( 'pre_http_request' );

		// Signing installs this filter on every call and never removes it.
		remove_all_filters( 'jetpack_constant_default_value' );
		Constants::clear_constants();

		delete_transient( Marketplace_Catalog::LIST_CACHE_KEY );
		delete_transient( Marketplace_Catalog::PRODUCT_CACHE_PREFIX . 'gravityforms' );

		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'id' );

		parent::tear_down();
	}

	/**
	 * Answers matching requests with a JSON body, and anything unmatched with a 404.
	 *
	 * Routes are matched in the order given, so a longer path goes before the
	 * shorter one it starts with.
	 *
	 * @param array<string, array> $routes URL fragment to response body.
	 * @return void
	 */
	private function answer_wpcom( array $routes ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $routes ) {
				$this->requests[] = $url;

				foreach ( $routes as $fragment => $body ) {
					if ( str_contains( $url, $fragment ) ) {
						return array(
							'response' => array(
								'code'    => 200,
								'message' => 'OK',
							),
							'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
						);
					}
				}

				return array(
					'response' => array(
						'code'    => 404,
						'message' => 'Not Found',
					),
					'body'     => '{}',
				);
			},
			10,
			3
		);
	}

	/**
	 * Answers every request the same way.
	 *
	 * @param int    $code HTTP status code.
	 * @param string $body Response body.
	 * @return void
	 */
	private function answer_wpcom_with( $code, $body ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $code, $body ) {
				$this->requests[] = $url;

				return array(
					'response' => array(
						'code'    => $code,
						'message' => 200 === $code ? 'OK' : 'Error',
					),
					'body'     => $body,
				);
			},
			10,
			3
		);
	}

	/**
	 * The list the tab renders comes from two endpoints: the marketplace says what
	 * is sold, the store says what each variation costs and what slug checkout wants.
	 */
	public function test_catalog_is_fetched_priced_and_cached() {
		$this->answer_wpcom(
			array(
				'v2/marketplace/products?' => array( 'results' => array( self::PRODUCT ) ),
				'v1.1/products'            => self::STORE_RESPONSE,
			)
		);

		$products = Marketplace_Catalog::get_products();

		$this->assertArrayHasKey( 'gravityforms', $products );

		$pricing = $products['gravityforms']['wpcom_pricing'];
		$this->assertSame( '$132.00', $pricing['yearly']['price'] );
		$this->assertSame( 'gravityforms_yearly', $pricing['yearly']['slug'] );
		$this->assertSame( '$12.00', $pricing['monthly']['price'] );
		$this->assertSame( 'gravityforms_monthly', $pricing['monthly']['slug'] );

		// Cached, so opening the screen again does not repeat either request.
		$this->assertSame( $products, get_transient( Marketplace_Catalog::LIST_CACHE_KEY ) );
	}

	/**
	 * Both reads happen, and the store one is not skipped when the marketplace
	 * answers: a card with no price has nothing to put on its button.
	 */
	public function test_both_the_marketplace_and_the_store_are_read() {
		$this->answer_wpcom(
			array(
				'v2/marketplace/products?' => array( 'results' => array( self::PRODUCT ) ),
				'v1.1/products'            => self::STORE_RESPONSE,
			)
		);

		Marketplace_Catalog::get_products();

		$this->assertCount( 2, $this->requests );
		$this->assertStringContainsString( 'wpcom/v2/marketplace/products', $this->requests[0] );
		$this->assertStringContainsString( 'rest/v1.1/products', $this->requests[1] );
	}

	/**
	 * A failed read empties the tab rather than breaking the screen, and is cached
	 * briefly so an outage does not mean an outbound request per page load.
	 */
	public function test_a_failed_read_empties_the_catalog_and_is_briefly_cached() {
		$this->answer_wpcom_with( 500, '{"error":"oops"}' );

		$this->assertSame( array(), Marketplace_Catalog::get_products() );
		$this->assertSame( array(), get_transient( Marketplace_Catalog::LIST_CACHE_KEY ) );
	}

	/**
	 * A 200 carrying something other than JSON is a failed read too. An error page
	 * served with the wrong status is the realistic way this happens.
	 */
	public function test_a_non_json_body_is_treated_as_a_failed_read() {
		$this->answer_wpcom_with( 200, '<html><body>Maintenance</body></html>' );

		$this->assertSame( array(), Marketplace_Catalog::get_products() );
	}

	/**
	 * The store being unavailable costs the price, not the listing. The button
	 * falls back to the product page, which is still better than an empty tab.
	 */
	public function test_cards_are_listed_unpriced_when_the_store_is_unavailable() {
		$this->answer_wpcom( array( 'v2/marketplace/products?' => array( 'results' => array( self::PRODUCT ) ) ) );

		$products = Marketplace_Catalog::get_products();

		$this->assertArrayHasKey( 'gravityforms', $products );
		$this->assertSame( array(), $products['gravityforms']['wpcom_pricing'] );
	}

	/**
	 * The long description is only read by the modal, so it is fetched per product
	 * when one opens, cleaned of the vendor's page layout, and cached.
	 */
	public function test_details_are_fetched_cleaned_and_cached() {
		$description = '<div class="hero"><h3>Forms</h3><p>Drag and drop.</p></div>'
			. '<figure><img src="https://example.com/one.png" alt="Editor" /></figure>';

		$this->answer_wpcom(
			array(
				'v2/marketplace/products/gravityforms' => array_merge( self::PRODUCT, array( 'description' => $description ) ),
				'v2/marketplace/products?'             => array( 'results' => array( self::PRODUCT ) ),
				'v1.1/products'                        => self::STORE_RESPONSE,
			)
		);

		$details = Marketplace_Catalog::get_product_details( 'gravityforms' );

		$this->assertStringContainsString( 'Drag and drop.', $details['sections']['description'] );
		$this->assertStringNotContainsString( '<div', $details['sections']['description'] );
		$this->assertStringContainsString( 'https://example.com/one.png', $details['sections']['screenshots'] );

		$this->assertSame( $details, get_transient( Marketplace_Catalog::PRODUCT_CACHE_PREFIX . 'gravityforms' ) );
	}

	/**
	 * A warm details cache is served without asking wpcom anything.
	 */
	public function test_details_come_from_the_cache_without_a_request() {
		set_transient(
			Marketplace_Catalog::LIST_CACHE_KEY,
			array( 'gravityforms' => Marketplace_Catalog::to_card( self::PRODUCT ) ),
			HOUR_IN_SECONDS
		);
		set_transient(
			Marketplace_Catalog::PRODUCT_CACHE_PREFIX . 'gravityforms',
			array( 'name' => 'From cache' ),
			HOUR_IN_SECONDS
		);

		$this->answer_wpcom( array() );

		$this->assertSame( array( 'name' => 'From cache' ), Marketplace_Catalog::get_product_details( 'gravityforms' ) );
		$this->assertSame( array(), $this->requests );
	}
}
