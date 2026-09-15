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
		'variations'        => array(
			'monthly' => array( 'product_id' => 2510 ),
			'yearly'  => array( 'product_id' => 2509 ),
		),
	);

	/**
	 * The store catalog, as /rest/v1.1/products shapes it.
	 *
	 * @var array
	 */
	private const STORE = array(
		2509 => array(
			'slug'  => 'gravityforms_yearly',
			'price' => '$132.00',
		),
		2510 => array(
			'slug'  => 'gravityforms_monthly',
			'price' => '$12.00',
		),
	);

	/**
	 * A priced card, as the tab renders it.
	 *
	 * @return array
	 */
	private function priced_card() {
		$catalog = Marketplace_Catalog::attach_pricing(
			array( 'gravityforms' => Marketplace_Catalog::to_card( self::PRODUCT ) ),
			self::STORE
		);

		return $catalog['gravityforms'];
	}

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
	 * Coming first is also what makes it the default: core lands on whichever tab
	 * comes first when none is requested.
	 */
	public function test_tab_is_registered_first_and_becomes_the_default() {
		$this->enable_tab();

		$tabs = wpcom_marketplace_add_tab(
			array(
				'featured'    => 'Featured',
				'popular'     => 'Popular',
				'recommended' => 'Recommended',
			)
		);

		$this->assertSame(
			array( WPCOM_MARKETPLACE_TAB, 'featured', 'popular', 'recommended' ),
			array_keys( $tabs )
		);
		$this->assertSame( WPCOM_MARKETPLACE_TAB, array_key_first( $tabs ) );
	}

	/**
	 * Core puts Search Results and Beta Testing ahead of Featured on the screens that
	 * add them, and means those to be the landing tab there.
	 */
	public function test_tab_does_not_displace_cores_own_leading_tabs() {
		$this->enable_tab();

		$tabs = wpcom_marketplace_add_tab(
			array(
				'beta'     => 'Beta Testing',
				'featured' => 'Featured',
				'popular'  => 'Popular',
			)
		);

		$this->assertSame(
			array( 'beta', WPCOM_MARKETPLACE_TAB, 'featured', 'popular' ),
			array_keys( $tabs )
		);
	}

	/**
	 * Falls back to the front when core has no Featured tab to anchor against.
	 */
	public function test_tab_goes_first_without_a_featured_anchor() {
		$this->enable_tab();

		$tabs = wpcom_marketplace_add_tab( array( 'popular' => 'Popular' ) );

		$this->assertSame( array( WPCOM_MARKETPLACE_TAB, 'popular' ), array_keys( $tabs ) );
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

		$GLOBALS['pagenow'] = 'plugin-install.php';
		$this->assertFalse(
			wpcom_marketplace_serve_plugins_api( false, 'plugin_information', (object) array( 'slug' => 'akismet' ) )
		);
		unset( $GLOBALS['pagenow'] );
	}

	/**
	 * Details are served on the plugin screens, where the modal lives.
	 */
	public function test_details_are_served_on_the_plugin_install_screen() {
		$this->enable_tab();
		$this->seed_catalog( array( 'gravityforms' => Marketplace_Catalog::to_card( self::PRODUCT ) ) );

		$GLOBALS['pagenow'] = 'plugin-install.php';
		$result             = wpcom_marketplace_serve_plugins_api( false, 'plugin_information', (object) array( 'slug' => 'gravityforms' ) );
		unset( $GLOBALS['pagenow'] );

		$this->assertIsObject( $result );
		$this->assertSame( 'gravityforms', $result->slug );
	}

	/**
	 * Other admin screens call plugins_api( 'plugin_information' ) too, and none of
	 * them should pay for a catalog read.
	 */
	public function test_details_are_not_served_off_the_plugin_screens() {
		$this->enable_tab();
		$this->seed_catalog( array( 'gravityforms' => Marketplace_Catalog::to_card( self::PRODUCT ) ) );

		$GLOBALS['pagenow'] = 'admin.php';
		$result             = wpcom_marketplace_serve_plugins_api( false, 'plugin_information', (object) array( 'slug' => 'gravityforms' ) );
		unset( $GLOBALS['pagenow'] );

		$this->assertFalse( $result );
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
	 * Core's details modal guards active_installs on isset(), so a zero would be
	 * rendered as the claim "Less Than 10 Active Installations".
	 */
	public function test_details_drop_the_browse_only_fields() {
		$this->enable_tab();
		$this->seed_catalog( array( 'gravityforms' => Marketplace_Catalog::to_card( self::PRODUCT ) ) );

		$details = Marketplace_Catalog::get_product_details( 'gravityforms' );

		$this->assertArrayNotHasKey( 'active_installs', $details );
		$this->assertArrayNotHasKey( 'downloaded', $details );

		// The list table does read it unguarded, so the card keeps it.
		$this->assertArrayHasKey( 'active_installs', Marketplace_Catalog::to_card( self::PRODUCT ) );
	}

	/**
	 * The cached shape changes with the code that builds it, so the key has to move
	 * too or sites keep serving whatever the previous version wrote.
	 */
	public function test_cache_keys_carry_the_version() {
		$this->assertStringContainsString( (string) Marketplace_Catalog::CACHE_VERSION, Marketplace_Catalog::LIST_CACHE_KEY );
		$this->assertStringContainsString( (string) Marketplace_Catalog::CACHE_VERSION, Marketplace_Catalog::PRODUCT_CACHE_PREFIX );
	}

	/**
	 * Vendor descriptions are WooCommerce.com product pages. Core's modal loads none
	 * of that CSS, so the layout markup has to go before it gets there.
	 */
	public function test_modal_html_drops_vendor_layout_markup() {
		$vendor = '<div class="features"><div class="feature feature__right">'
			. '<h3><span style="font-weight: 400;">Yoast SEO Premium</span></h3>'
			. '<span style="font-weight: 300;"><strong>Real-time SEO guidance</strong> and AI tools.</span>'
			. '<figure><img src="https://example.com/banner.png" alt="" /></figure>'
			. '</div></div>';

		$html = Marketplace_Catalog::to_modal_html( $vendor );

		$this->assertStringNotContainsString( '<div', $html );
		$this->assertStringNotContainsString( '<figure', $html );
		$this->assertStringNotContainsString( '<img', $html );
		$this->assertStringNotContainsString( '<span', $html );
		$this->assertStringNotContainsString( 'style=', $html );
		$this->assertStringNotContainsString( 'class=', $html );

		// The words survive, and so does the markup the modal can style.
		$this->assertStringContainsString( 'Real-time SEO guidance', $html );
		$this->assertStringContainsString( '<strong>', $html );
		$this->assertStringContainsString( '<h3>', $html );
	}

	/**
	 * Core only constrains images inside #section-screenshots, so that is where they
	 * have to go if they are to survive at a sane width.
	 */
	public function test_screenshots_are_lifted_out_of_the_description() {
		$vendor = '<figure class="graphic"><img src="https://example.com/one.png" alt="" width="494" height="300" /></figure>'
			. '<figure class="graphic"><div class="image__background" style="background: #0075b3;"></div>'
			. '<img src="https://example.com/two.png" alt="" width="494" height="300" /></figure>';

		$html = Marketplace_Catalog::to_screenshots_html( $vendor );

		$this->assertStringStartsWith( '<ol>', $html );
		$this->assertSame( 2, substr_count( $html, '<li>' ) );
		$this->assertStringContainsString( 'https://example.com/one.png', $html );
		$this->assertStringContainsString( 'https://example.com/two.png', $html );

		// Rebuilt from the URLs, so none of the vendor's markup rides along.
		$this->assertStringNotContainsString( 'figure', $html );
		$this->assertStringNotContainsString( 'class=', $html );
		$this->assertStringNotContainsString( 'style=', $html );
	}

	/**
	 * The same image used twice is one screenshot.
	 */
	public function test_screenshots_are_deduplicated() {
		$html = Marketplace_Catalog::to_screenshots_html(
			'<img src="https://example.com/a.png" /><img src="https://example.com/a.png" />'
		);

		$this->assertSame( 1, substr_count( $html, '<li>' ) );
	}

	/**
	 * A description with no images gets no section rather than an empty list.
	 */
	public function test_screenshots_absent_when_there_are_no_images() {
		$this->assertSame( '', Marketplace_Catalog::to_screenshots_html( '<div>Just words.</div>' ) );
		$this->assertSame( '', Marketplace_Catalog::to_screenshots_html( '' ) );
	}

	/**
	 * The source has no paragraph tags at all, so without re-paragraphing the text
	 * arrives as one run once the layout divs are gone.
	 */
	public function test_modal_html_paragraphs_text_that_had_none() {
		$vendor = '<div>First block of copy.</div><div>Second block of copy.</div>';

		$html = Marketplace_Catalog::to_modal_html( $vendor );

		$this->assertSame( 2, substr_count( $html, '<p>' ) );
		$this->assertStringContainsString( 'First block of copy.', $html );
		$this->assertStringContainsString( 'Second block of copy.', $html );
	}

	/**
	 * Links are the one attribute-bearing tag worth keeping.
	 */
	public function test_modal_html_keeps_links_and_lists() {
		$html = Marketplace_Catalog::to_modal_html(
			'<ul><li>One</li><li><a href="https://example.com" title="t">Two</a></li></ul>'
		);

		$this->assertStringContainsString( '<ul>', $html );
		$this->assertStringContainsString( '<li>One</li>', $html );
		$this->assertStringContainsString( 'href="https://example.com"', $html );
	}

	/**
	 * An empty description stays empty rather than becoming an empty paragraph.
	 */
	public function test_modal_html_leaves_an_empty_description_alone() {
		$this->assertSame( '', Marketplace_Catalog::to_modal_html( '' ) );
	}

	/**
	 * A wpcom outage empties the tab rather than breaking the screen, and is cached
	 * briefly so the next page load does not repeat the request.
	 */
	public function test_catalog_degrades_when_wpcom_cannot_be_reached() {
		$fail = static function () {
			return new WP_Error( 'http_request_failed', 'offline' );
		};
		add_filter( 'pre_http_request', $fail );

		$products = Marketplace_Catalog::get_products();

		remove_filter( 'pre_http_request', $fail );

		$this->assertSame( array(), $products );
		$this->assertSame( array(), get_transient( Marketplace_Catalog::LIST_CACHE_KEY ) );
	}

	/**
	 * A slug that is not ours has no details to serve.
	 */
	public function test_details_are_null_for_an_unknown_slug() {
		$this->seed_catalog( array( 'gravityforms' => Marketplace_Catalog::to_card( self::PRODUCT ) ) );

		$this->assertNull( Marketplace_Catalog::get_product_details( 'not-ours' ) );
	}

	/**
	 * Checkout is addressed by store slug, which the marketplace payload does not
	 * carry: it gives a numeric id that has to be resolved against the store catalog.
	 */
	public function test_pricing_is_resolved_from_the_store_catalog() {
		$card = $this->priced_card();

		$this->assertSame( 'gravityforms_yearly', $card['wpcom_pricing']['yearly']['slug'] );
		$this->assertSame( '$132.00', $card['wpcom_pricing']['yearly']['price'] );
		$this->assertSame( 'gravityforms_monthly', $card['wpcom_pricing']['monthly']['slug'] );
	}

	/**
	 * A variation the store does not know is left out rather than half-populated.
	 */
	public function test_pricing_skips_unknown_variations() {
		$catalog = Marketplace_Catalog::attach_pricing(
			array( 'gravityforms' => Marketplace_Catalog::to_card( self::PRODUCT ) ),
			array( 2509 => self::STORE[2509] )
		);

		$this->assertArrayHasKey( 'yearly', $catalog['gravityforms']['wpcom_pricing'] );
		$this->assertArrayNotHasKey( 'monthly', $catalog['gravityforms']['wpcom_pricing'] );
	}

	/**
	 * The button goes straight to checkout, which is what the Calypso product page's
	 * own button does. Landing there is the whole point of skipping that page.
	 */
	public function test_checkout_url_targets_the_store_product() {
		$url = Marketplace_Catalog::checkout_url( $this->priced_card(), 'yearly' );

		$this->assertStringContainsString( '/checkout/', $url );
		$this->assertStringContainsString( 'gravityforms_yearly', $url );
		$this->assertStringEndsWith( '#step2', $url );
	}

	/**
	 * No store product means nothing to buy.
	 */
	public function test_checkout_url_is_empty_without_a_variation() {
		$this->assertSame( '', Marketplace_Catalog::checkout_url( $this->priced_card(), 'weekly' ) );
		$this->assertSame( '', Marketplace_Catalog::checkout_url( Marketplace_Catalog::to_card( self::PRODUCT ), 'yearly' ) );
	}

	/**
	 * Yearly unless the reader asks for monthly.
	 */
	public function test_billing_term_defaults_to_yearly() {
		$this->assertSame( 'yearly', wpcom_marketplace_billing_term() );

		$_GET['billing'] = 'monthly';
		$this->assertSame( 'monthly', wpcom_marketplace_billing_term() );

		$_GET['billing'] = 'nonsense';
		$this->assertSame( 'yearly', wpcom_marketplace_billing_term() );

		unset( $_GET['billing'] );
	}

	/**
	 * The price belongs on the button: it is the only thing on the card that says
	 * what the click costs, and the click goes straight to a payment page.
	 */
	public function test_button_carries_the_price_and_checkout_url() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$links = wpcom_marketplace_action_links( array( '<a class="install-now">Install Now</a>' ), $this->priced_card() );

		$this->assertStringContainsString( '$132.00', $links[0] );
		$this->assertStringContainsString( 'year', $links[0] );
		$this->assertStringContainsString( 'gravityforms_yearly', $links[0] );
		$this->assertStringNotContainsString( 'install-now', $links[0] );
	}

	/**
	 * Switching to monthly reprices every button on the tab.
	 */
	public function test_button_follows_the_selected_term() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$_GET['billing'] = 'monthly';
		$links           = wpcom_marketplace_action_links( array( '<a class="install-now">Install Now</a>' ), $this->priced_card() );
		unset( $_GET['billing'] );

		$this->assertStringContainsString( '$12.00', $links[0] );
		$this->assertStringContainsString( 'month', $links[0] );
		$this->assertStringContainsString( 'gravityforms_monthly', $links[0] );
	}

	/**
	 * A product with no store variation still gets somewhere useful.
	 */
	public function test_button_falls_back_to_the_product_page() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$links = wpcom_marketplace_action_links(
			array( '<a class="install-now">Install Now</a>' ),
			Marketplace_Catalog::to_card( self::PRODUCT )
		);

		$this->assertStringContainsString( 'Get started', $links[0] );
		$this->assertStringContainsString( 'wordpress.com/plugins/gravityforms/', $links[0] );
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
		$this->assertStringNotContainsString( 'target=', $links[0] );
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
