<?php
/**
 * Tests for the Marketplace tab on the Add Plugins screen.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Marketplace_Catalog;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-plugins/wpcom-marketplace-tab.php';

/**
 * Class Wpcom_Marketplace_Tab_Test
 */
class Wpcom_Marketplace_Tab_Test extends \WorDBless\BaseTestCase {

	/**
	 * Per-flag filter, so toggling ours leaves every other flag alone.
	 *
	 * @var string
	 */
	private const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . WPCOM_MARKETPLACE_TAB_FLAG;

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
		'description'       => '<p>The long one.</p>',
		'icons'             => 'https://example.com/icon.png',
		'rating'            => '53.4',
		'author'            => '<a href="#">Gravity Forms</a>',
		'version'           => '3.1.1',
		'last_updated'      => '2026-09-03',
		'banners'           => null,
	);

	/**
	 * Turn the tab on for the duration of a test.
	 *
	 * @return void
	 */
	private function enable_tab() {
		add_filter( self::FLAG_FILTER, '__return_true' );
	}

	/**
	 * Put a catalog in place without going near the network.
	 *
	 * @param array $products Products keyed by slug.
	 * @return void
	 */
	private function seed_catalog( array $products ) {
		set_transient( Marketplace_Catalog::LIST_CACHE_KEY, $products, HOUR_IN_SECONDS );
	}

	/**
	 * Clean up.
	 *
	 * @return void
	 */
	public function tear_down() {
		delete_transient( Marketplace_Catalog::LIST_CACHE_KEY );
		remove_filter( self::FLAG_FILTER, '__return_true' );

		parent::tear_down();
	}

	/**
	 * Every key core reads without an isset() guard has to be present, or the
	 * plugin card renders warnings.
	 */
	public function test_card_sets_every_field_core_reads_unguarded() {
		$card = Marketplace_Catalog::to_card( self::PRODUCT );

		$required = array(
			'name',
			'slug',
			'version',
			'author',
			'short_description',
			'sections',
			'icons',
			'rating',
			'num_ratings',
			'ratings',
			'active_installs',
			'downloaded',
			'last_updated',
			'homepage',
			'download_link',
			'contributors',
		);

		foreach ( $required as $key ) {
			$this->assertArrayHasKey( $key, $card, "Missing '$key', which core reads unguarded." );
		}

		// Core falls back to icons['default'] with no guard of its own.
		$this->assertArrayHasKey( 'default', $card['icons'] );
	}

	/**
	 * The wpcom shapes that core would choke on are converted, not passed through.
	 */
	public function test_card_normalizes_wpcom_shapes() {
		$card = Marketplace_Catalog::to_card( self::PRODUCT );

		// Icons arrive as a bare URL string, core wants the sized array.
		$this->assertSame( 'https://example.com/icon.png', $card['icons']['1x'] );
		$this->assertSame( 'https://example.com/icon.png', $card['icons']['default'] );

		$this->assertSame( 0, $card['rating'] );
		$this->assertSame( 0, $card['num_ratings'] );

		// The author arrives wrapped in a link that goes nowhere.
		$this->assertSame( 'Gravity Forms', $card['author'] );

		$this->assertSame( '', $card['download_link'] );

		$this->assertTrue( $card['wpcom_marketplace'] );
	}

	/**
	 * Retired and hidden products are not on offer and must not be listed.
	 */
	public function test_retired_and_hidden_products_are_not_listed() {
		$catalog = Marketplace_Catalog::to_catalog(
			array(
				self::PRODUCT,
				array_merge(
					self::PRODUCT,
					array(
						'slug'       => 'retired-one',
						'is_retired' => true,
					)
				),
				array_merge(
					self::PRODUCT,
					array(
						'slug'      => 'hidden-one',
						'is_hidden' => true,
					)
				),
			)
		);

		$this->assertSame( array( 'gravityforms' ), array_keys( $catalog ) );
	}

	/**
	 * A malformed entry is skipped rather than taking the whole catalog down.
	 */
	public function test_malformed_products_are_skipped() {
		$catalog = Marketplace_Catalog::to_catalog(
			array(
				'not an array',
				array( 'name' => 'No slug' ),
				self::PRODUCT,
			)
		);

		$this->assertSame( array( 'gravityforms' ), array_keys( $catalog ) );
	}

	/**
	 * The tab sits after Featured, leaving the screen's default view unchanged.
	 */
	public function test_tab_is_registered_after_featured() {
		$this->enable_tab();

		$tabs = wpcom_marketplace_add_tab(
			array(
				'featured'    => 'Featured',
				'popular'     => 'Popular',
				'recommended' => 'Recommended',
			)
		);

		$this->assertSame(
			array( 'featured', WPCOM_MARKETPLACE_TAB, 'popular', 'recommended' ),
			array_keys( $tabs )
		);
		$this->assertSame( 'featured', array_key_first( $tabs ) );
	}

	/**
	 * With the flag off nothing about the screen changes.
	 */
	public function test_tab_is_absent_by_default() {
		$this->assertSame(
			array( 'featured' ),
			array_keys( wpcom_marketplace_add_tab( array( 'featured' => 'Featured' ) ) )
		);
	}

	/**
	 * Turning the flag off beats the registered default, whatever that becomes.
	 */
	public function test_tab_is_absent_when_flag_is_off() {
		add_filter( self::FLAG_FILTER, '__return_true' );
		$this->assertContains( WPCOM_MARKETPLACE_TAB, array_keys( wpcom_marketplace_add_tab( array( 'featured' => 'Featured' ) ) ) );
		remove_filter( self::FLAG_FILTER, '__return_true' );

		add_filter( self::FLAG_FILTER, '__return_false' );
		$this->assertSame(
			array( 'featured' ),
			array_keys( wpcom_marketplace_add_tab( array( 'featured' => 'Featured' ) ) )
		);
		remove_filter( self::FLAG_FILTER, '__return_false' );
	}

	/**
	 * Core skips the query for a tab it does not recognise unless the args say otherwise.
	 */
	public function test_api_args_restore_and_tag_the_query() {
		$this->enable_tab();

		$args = wpcom_marketplace_tab_api_args( false );

		$this->assertIsArray( $args );
		$this->assertTrue( $args['wpcom_marketplace'] );

		// prepare_items() reads these back after the query without guarding them.
		$this->assertArrayHasKey( 'per_page', $args );
		$this->assertArrayHasKey( 'page', $args );
	}

	/**
	 * The tab's listing comes back in the envelope the list table reads.
	 */
	public function test_plugins_api_returns_the_catalog_for_our_tab() {
		$this->enable_tab();
		$this->seed_catalog( array( 'gravityforms' => Marketplace_Catalog::to_card( self::PRODUCT ) ) );

		$response = wpcom_marketplace_serve_plugins_api( false, 'query_plugins', (object) array( 'wpcom_marketplace' => true ) );

		$this->assertIsObject( $response );
		$this->assertSame( 1, $response->info['results'] );
		$this->assertSame( 'gravityforms', $response->plugins[0]['slug'] );
	}

	/**
	 * A .org query is left for WordPress.org to answer.
	 */
	public function test_plugins_api_ignores_other_queries() {
		$this->enable_tab();
		$this->seed_catalog( array( 'gravityforms' => Marketplace_Catalog::to_card( self::PRODUCT ) ) );

		$this->assertFalse(
			wpcom_marketplace_serve_plugins_api( false, 'query_plugins', (object) array( 'browse' => 'popular' ) )
		);

		$this->assertFalse(
			wpcom_marketplace_serve_plugins_api( false, 'plugin_information', (object) array( 'slug' => 'akismet' ) )
		);
	}

	/**
	 * Another filter having already answered wins.
	 */
	public function test_plugins_api_does_not_override_an_earlier_result() {
		$this->enable_tab();

		$existing = (object) array( 'plugins' => array() );

		$this->assertSame(
			$existing,
			wpcom_marketplace_serve_plugins_api( $existing, 'query_plugins', (object) array( 'wpcom_marketplace' => true ) )
		);
	}

	/**
	 * Core resolves installed state from the directory name, so the card's slug has to
	 * be the software slug. Three products in the live catalog differ from their own.
	 */
	public function test_card_uses_the_software_slug() {
		$card = Marketplace_Catalog::to_card(
			array_merge(
				self::PRODUCT,
				array(
					'slug'          => 'mailpoet-business',
					'software_slug' => 'mailpoet-premium',
				)
			)
		);

		$this->assertSame( 'mailpoet-premium', $card['slug'] );
		$this->assertSame( 'mailpoet-business', $card['wpcom_product_slug'] );

		// The purchase link still needs the product slug.
		$this->assertStringContainsString( 'wordpress.com/plugins/mailpoet-business/', $card['homepage'] );
	}

	/**
	 * One product in the live catalog has no software slug at all.
	 */
	public function test_card_falls_back_to_the_product_slug() {
		$product = self::PRODUCT;
		unset( $product['software_slug'] );

		$this->assertSame( 'gravityforms', Marketplace_Catalog::to_card( $product )['slug'] );
	}

	/**
	 * The catalog is keyed by the slug core will ask for.
	 */
	public function test_catalog_is_keyed_by_software_slug() {
		$catalog = Marketplace_Catalog::to_catalog(
			array(
				array_merge(
					self::PRODUCT,
					array(
						'slug'          => 'js-composer',
						'software_slug' => 'js_composer',
					)
				),
			)
		);

		$this->assertSame( array( 'js_composer' ), array_keys( $catalog ) );
	}

	/**
	 * An unexpected payload shape produces a usable card rather than a warning.
	 */
	public function test_card_survives_unexpected_shapes() {
		$card = Marketplace_Catalog::to_card(
			array(
				'slug'    => 'odd-one',
				'icons'   => array( '1x' => 'https://example.com/a.png' ),
				'banners' => null,
			)
		);

		$this->assertSame( '', $card['version'] );
		$this->assertSame( '', $card['icons']['default'] );
		$this->assertSame( array(), $card['banners'] );
		$this->assertSame( '', $card['last_updated'] );
	}

	/**
	 * A product that is not installed is bought, not downloaded.
	 */
	public function test_install_button_is_replaced_for_our_products() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$links = wpcom_marketplace_action_links(
			array( '<a class="install-now">Install Now</a>', '<a>More Details</a>' ),
			Marketplace_Catalog::to_card( self::PRODUCT )
		);

		$this->assertStringContainsString( 'Get started', $links[0] );
		$this->assertStringContainsString( 'wordpress.com/plugins/gravityforms/', $links[0] );
		$this->assertStringNotContainsString( 'install-now', $links[0] );

		// The Details link is left alone.
		$this->assertStringContainsString( 'More Details', $links[1] );
	}

	/**
	 * WordPress.org plugins keep core's button.
	 */
	public function test_install_button_is_untouched_for_org_plugins() {
		$original = array( '<a class="install-now">Install Now</a>' );

		$this->assertSame(
			$original,
			wpcom_marketplace_action_links(
				$original,
				array(
					'slug' => 'akismet',
					'name' => 'Akismet',
				)
			)
		);
	}
}
