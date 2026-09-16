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
			'cost'  => 132.0,
		),
		2510 => array(
			'slug'  => 'gravityforms_monthly',
			'price' => '$13.00',
			'cost'  => 13.0,
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
	 * The tab renders its own grid, so it has no listing to serve through the plugin
	 * API. Anything still asking for one is a .org query and not ours to answer.
	 */
	public function test_plugins_api_does_not_answer_listings() {
		$this->enable_tab();
		$this->seed_catalog( array( 'gravityforms' => Marketplace_Catalog::to_card( self::PRODUCT ) ) );

		$this->assertFalse(
			wpcom_marketplace_serve_plugins_api( false, 'query_plugins', (object) array( 'wpcom_marketplace' => true ) )
		);
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
	 * An unreachable wpcom empties the tab rather than breaking the screen, and is
	 * cached briefly so the next page load does not repeat the attempt.
	 *
	 * The connection fails before the HTTP layer here, so this covers the degradation
	 * path but not the request itself.
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
	 * Checkout sends Back wherever it feels like otherwise, and for someone arriving
	 * from wp-admin that is the plan picker rather than the screen they left.
	 */
	public function test_checkout_url_carries_a_back_url() {
		$url = Marketplace_Catalog::checkout_url(
			$this->priced_card(),
			'yearly',
			'https://example.org/wp-admin/plugin-install.php?tab=' . WPCOM_MARKETPLACE_TAB
		);

		$this->assertStringContainsString( 'checkoutBackUrl=', $url );
		$this->assertStringContainsString( rawurlencode( 'https://example.org/wp-admin/plugin-install.php' ), $url );

		// The query has to land before the fragment, or checkout never reads it.
		$this->assertLessThan( strpos( $url, '#step2' ), strpos( $url, 'checkoutBackUrl=' ) );
		$this->assertStringEndsWith( '#step2', $url );
	}

	/**
	 * The parameter is omitted rather than sent empty when there is nowhere to go back to.
	 */
	public function test_checkout_url_omits_an_empty_back_url() {
		$this->assertStringNotContainsString(
			'checkoutBackUrl',
			Marketplace_Catalog::checkout_url( $this->priced_card(), 'yearly' )
		);
	}

	/**
	 * The card's button sends Back to this tab.
	 */
	public function test_button_sends_checkout_back_to_the_tab() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$button = wpcom_marketplace_card_button( $this->priced_card() );

		$this->assertStringContainsString( 'checkoutBackUrl', $button );
		$this->assertStringContainsString( rawurlencode( 'plugin-install.php' ), $button );
	}

	/**
	 * No store product means nothing to buy.
	 */
	public function test_checkout_url_is_empty_without_a_variation() {
		$this->assertSame( '', Marketplace_Catalog::checkout_url( $this->priced_card(), 'weekly' ) );
		$this->assertSame( '', Marketplace_Catalog::checkout_url( Marketplace_Catalog::to_card( self::PRODUCT ), 'yearly' ) );
	}

	/**
	 * The tab sells one term, and a stray query string does not change it.
	 */
	public function test_the_tab_sells_yearly_only() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$this->assertSame( 'yearly', WPCOM_MARKETPLACE_TERM );

		$_GET['billing'] = 'monthly';
		$button          = wpcom_marketplace_card_button( $this->priced_card() );
		unset( $_GET['billing'] );

		$this->assertStringContainsString( 'gravityforms_yearly', $button );
	}

	/**
	 * The card's action buys the plugin, at the one term the tab sells.
	 */
	public function test_button_targets_yearly_checkout() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$button = wpcom_marketplace_card_button( $this->priced_card() );

		$this->assertStringContainsString( 'gravityforms_yearly', $button );
		$this->assertStringNotContainsString( 'gravityforms_monthly', $button );
		$this->assertStringContainsString( 'button-primary', $button );
		$this->assertStringContainsString( 'Purchase', $button );
	}

	/**
	 * The price moved out of the button and into its own block, so the button says
	 * what it does rather than what it costs.
	 */
	public function test_button_does_not_carry_the_price() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$button = wpcom_marketplace_card_button( $this->priced_card() );

		$this->assertStringNotContainsString( '$132.00', $button );
	}

	/**
	 * A product with no store variation still gets somewhere useful.
	 */
	public function test_button_falls_back_to_the_product_page() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$button = wpcom_marketplace_card_button( Marketplace_Catalog::to_card( self::PRODUCT ) );

		$this->assertStringContainsString( 'Get started', $button );
		$this->assertStringContainsString( 'wordpress.com/plugins/gravityforms/', $button );
		// Same tab: this is still the purchase path, not a detour.
		$this->assertStringNotContainsString( 'target=', $button );
	}

	/**
	 * The switcher is gone. A control for the whole screen was a lot of furniture
	 * for a choice that belongs to one purchase, and checkout offers the term there.
	 */
	public function test_no_billing_switcher_is_rendered() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$this->enable_tab();
		$this->seed_catalog( array( 'gravityforms' => $this->priced_card() ) );

		ob_start();
		wpcom_marketplace_render_grid();
		$html = ob_get_clean();

		$this->assertStringNotContainsString( 'wpcom-marketplace-billing', $html );
		$this->assertStringNotContainsString( 'billing=', $html );
		$this->assertFalse( function_exists( 'wpcom_marketplace_billing_switcher' ) );
	}

	/**
	 * Collapses runs of whitespace, since checked() adds a leading space of its own.
	 *
	 * @param string $html Rendered markup.
	 * @return string
	 */
	private static function squash( $html ) {
		return (string) preg_replace( '/\s+/', ' ', $html );
	}

	/**
	 * Prices read as "$10.00/month", so the noun has to follow the term.
	 */
	public function test_term_noun_follows_the_term() {
		$this->assertSame( 'month', wpcom_marketplace_term_noun( 'monthly' ) );
		$this->assertSame( 'year', wpcom_marketplace_term_noun( 'yearly' ) );
	}

	/**
	 * The stylesheet scopes itself to this class, so losing it unstyles the tab.
	 */
	public function test_body_class_marks_the_tab() {
		$this->assertStringContainsString( 'wpcom-marketplace-tab', wpcom_marketplace_body_class( 'wp-admin' ) );
		$this->assertStringContainsString( 'wp-admin', wpcom_marketplace_body_class( 'wp-admin' ) );
	}

	/**
	 * The intro is the only thing on the screen explaining why these buttons cost money.
	 */
	public function test_intro_renders() {
		ob_start();
		wpcom_marketplace_intro();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'wpcom-marketplace-intro', $html );
		$this->assertStringContainsString( 'subscription', $html );
	}

	/**
	 * The headline is the year, which is what the button charges, and the saving sits
	 * with it. Neither figure is the year divided by twelve, which is an amount nobody
	 * is ever charged.
	 */
	public function test_the_headline_is_the_yearly_price_with_the_saving() {
		ob_start();
		wpcom_marketplace_render_price( $this->priced_card() );
		$html = self::squash( ob_get_clean() );

		$this->assertStringContainsString( '$132.00', $html );
		$this->assertStringContainsString( '/year', $html );
		$this->assertStringContainsString( 'Save 15%', $html );

		// $11.00 would be the year divided by twelve.
		$this->assertStringNotContainsString( '$11.00', $html );

		// The saving belongs to the headline, ahead of the monthly alternative.
		$this->assertLessThan(
			strpos( $html, 'if billed monthly' ),
			strpos( $html, 'Save 15%' ),
			'The saving should sit with the price it applies to.'
		);
	}

	/**
	 * The monthly price follows in small type, so the saving can be checked rather
	 * than taken on trust. Phrased as a condition, not an offer: "or" read as a
	 * second option the reader could pick here, and the button only buys the year.
	 */
	public function test_the_monthly_price_is_shown_as_a_comparison() {
		ob_start();
		wpcom_marketplace_render_price( $this->priced_card() );
		$html = self::squash( ob_get_clean() );

		$this->assertStringContainsString( '$13.00/month if billed monthly', $html );
		$this->assertStringContainsString( 'wpcom-marketplace-card__alternative', $html );
		$this->assertStringNotContainsString( 'or $13.00', $html );
	}

	/**
	 * A product with no monthly variation has nothing to compare against, so it
	 * shows the year alone.
	 */
	public function test_a_yearly_only_product_shows_no_alternative() {
		$card = $this->priced_card();
		unset( $card['wpcom_pricing']['monthly'] );

		ob_start();
		wpcom_marketplace_render_price( $card );
		$html = self::squash( ob_get_clean() );

		$this->assertStringContainsString( '$132.00', $html );
		$this->assertStringContainsString( '/year', $html );
		$this->assertStringNotContainsString( 'if billed monthly', $html );
	}

	/**
	 * A product we cannot sell by the year is priced by the month instead of vanishing.
	 */
	public function test_a_monthly_only_product_prices_at_the_month() {
		$card = $this->priced_card();
		unset( $card['wpcom_pricing']['yearly'] );

		ob_start();
		wpcom_marketplace_render_price( $card );
		$html = self::squash( ob_get_clean() );

		$this->assertStringContainsString( '$13.00', $html );
		$this->assertStringContainsString( '/month', $html );
		$this->assertStringNotContainsString( 'Save', $html );
	}

	/**
	 * A saving too small to act on is noise, so it is not shown at all.
	 */
	public function test_a_negligible_saving_is_not_advertised() {
		$card = $this->priced_card();

		// A year that costs twelve months: nothing saved.
		$card['wpcom_saving'] = 0;

		ob_start();
		wpcom_marketplace_render_price( $card );
		$html = ob_get_clean();

		$this->assertStringNotContainsString( 'wpcom-marketplace-card__saving', $html );
	}

	/**
	 * A product we cannot price still renders, minus the price block.
	 */
	public function test_an_unpriced_product_renders_no_price_block() {
		ob_start();
		wpcom_marketplace_render_price( Marketplace_Catalog::to_card( self::PRODUCT ) );

		$this->assertSame( '', ob_get_clean() );
	}

	/**
	 * The saving is a percentage because it is not a flat discount: across the
	 * catalog it runs from nothing at all to a third off.
	 */
	public function test_yearly_saving_is_the_gap_against_twelve_months() {
		$this->assertSame(
			15,
			Marketplace_Catalog::yearly_saving(
				array(
					'yearly'  => array( 'cost' => 132.0 ),
					'monthly' => array( 'cost' => 13.0 ),
				)
			)
		);

		// Nothing to compare against.
		$this->assertSame( 0, Marketplace_Catalog::yearly_saving( array( 'yearly' => array( 'cost' => 132.0 ) ) ) );

		// A year that costs more than twelve months is not a saving.
		$this->assertSame(
			0,
			Marketplace_Catalog::yearly_saving(
				array(
					'yearly'  => array( 'cost' => 200.0 ),
					'monthly' => array( 'cost' => 10.0 ),
				)
			)
		);
	}

	/**
	 * The card carries what a reader needs to choose: who made it, what it does,
	 * what it costs, and a way to see more.
	 */
	public function test_card_renders_its_parts() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		ob_start();
		wpcom_marketplace_render_card( $this->priced_card() );
		$html = self::squash( ob_get_clean() );

		$this->assertStringContainsString( 'Gravity Forms', $html );
		$this->assertStringContainsString( 'By Gravity Forms', $html );
		$this->assertStringContainsString( 'Build custom forms', $html );
		$this->assertStringContainsString( '$132.00', $html );
		$this->assertStringContainsString( 'gravityforms_yearly', $html );

		// The modal is core's, and it is reached the way core reaches it.
		$this->assertStringContainsString( 'thickbox open-plugin-details-modal', $html );
		$this->assertStringContainsString( 'tab=plugin-information', $html );
	}

	/**
	 * The category gives a reader something to orient by between the author and the
	 * description. 54 of the 56 live products carry one.
	 */
	public function test_card_shows_the_category() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$card                   = $this->priced_card();
		$card['wpcom_category'] = 'SEO';

		ob_start();
		wpcom_marketplace_render_card( $card );
		$html = self::squash( ob_get_clean() );

		$this->assertStringContainsString( 'wpcom-marketplace-card__category', $html );
		$this->assertStringContainsString( 'SEO', $html );
	}

	/**
	 * Nothing is rendered for a product with no category worth showing, rather than
	 * an empty line that would push its card out of step with the row.
	 */
	public function test_card_omits_an_absent_category() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		ob_start();
		wpcom_marketplace_render_card( $this->priced_card() );
		$html = ob_get_clean();

		$this->assertStringNotContainsString( 'wpcom-marketplace-card__category', $html );
	}

	/**
	 * "Plugins" is on nearly every product and says nothing on a screen that only
	 * lists plugins, so the category is the first tag after it.
	 */
	public function test_the_category_skips_the_plugins_tag() {
		$card = Marketplace_Catalog::to_card(
			array_merge(
				self::PRODUCT,
				array(
					'tags' => array(
						'plugins' => 'Plugins',
						'seo'     => 'SEO',
					),
				)
			)
		);

		$this->assertSame( 'SEO', $card['wpcom_category'] );

		$only_plugins = Marketplace_Catalog::to_card(
			array_merge( self::PRODUCT, array( 'tags' => array( 'plugins' => 'Plugins' ) ) )
		);

		$this->assertSame( '', $only_plugins['wpcom_category'] );
	}

	/**
	 * A dependency the site does not have is a gate rather than a detail: without it
	 * the product cannot do anything, whatever it costs.
	 */
	public function test_an_unmet_requirement_is_named_on_the_card() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		$card                   = $this->priced_card();
		$card['wpcom_requires'] = array( 'woocommerce' );

		$this->assertSame( array( 'WooCommerce' ), wpcom_marketplace_unmet_requirements( $card ) );
	}

	/**
	 * Nothing is said when the dependency is already active, since there is nothing
	 * for the reader to do about it.
	 */
	public function test_an_active_requirement_is_not_mentioned() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		// get_plugins() reads this cache before it touches the filesystem.
		wp_cache_set(
			'plugins',
			array( '' => array( 'woocommerce/woocommerce.php' => array( 'Name' => 'WooCommerce' ) ) ),
			'plugins'
		);
		update_option( 'active_plugins', array( 'woocommerce/woocommerce.php' ) );

		$card                   = $this->priced_card();
		$card['wpcom_requires'] = array( 'woocommerce' );

		$this->assertSame( array(), wpcom_marketplace_unmet_requirements( $card ) );

		wp_cache_delete( 'plugins', 'plugins' );
		delete_option( 'active_plugins' );
	}

	/**
	 * An installed but deactivated plugin is still unmet, and is named from its own
	 * header rather than from our list.
	 */
	public function test_an_inactive_requirement_is_named_from_its_header() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		wp_cache_set(
			'plugins',
			array( '' => array( 'some-plugin/some-plugin.php' => array( 'Name' => 'Some Plugin' ) ) ),
			'plugins'
		);

		$card                   = $this->priced_card();
		$card['wpcom_requires'] = array( 'some-plugin' );

		$this->assertSame( array( 'Some Plugin' ), wpcom_marketplace_unmet_requirements( $card ) );

		wp_cache_delete( 'plugins', 'plugins' );
	}

	/**
	 * A slug we cannot name is left off the card. The payload gives a directory slug
	 * and these do not humanize, so a guess would read worse than saying nothing.
	 */
	public function test_an_unnameable_requirement_is_omitted() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		$card                   = $this->priced_card();
		$card['wpcom_requires'] = array( 'some-plugin-we-cannot-name' );

		$this->assertSame( array(), wpcom_marketplace_unmet_requirements( $card ) );
	}

	/**
	 * A product with no declared requirements asks nothing of the site.
	 */
	public function test_a_product_with_no_requirements_is_met() {
		$this->assertSame( array(), wpcom_marketplace_unmet_requirements( $this->priced_card() ) );
	}

	/**
	 * Requirements come through from the endpoint's own shape.
	 */
	public function test_required_plugins_are_read_from_the_payload() {
		$card = Marketplace_Catalog::to_card(
			array_merge(
				self::PRODUCT,
				array(
					'requirements' => array(
						'plugins' => array( 'woocommerce' ),
						'themes'  => array(),
					),
				)
			)
		);

		$this->assertSame( array( 'woocommerce' ), $card['wpcom_requires'] );
		$this->assertSame( array(), Marketplace_Catalog::to_card( self::PRODUCT )['wpcom_requires'] );
	}

	/**
	 * A malformed product is skipped rather than rendered as an empty card.
	 */
	public function test_card_without_a_slug_is_skipped() {
		ob_start();
		wpcom_marketplace_render_card( array( 'name' => 'Nameless' ) );

		$this->assertSame( '', ob_get_clean() );
	}

	/**
	 * The grid draws every product, in the order the catalog supplied them.
	 */
	public function test_grid_renders_a_card_per_product() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$this->enable_tab();
		$this->seed_catalog(
			array(
				'gravityforms' => $this->priced_card(),
				'second'       => array_merge(
					$this->priced_card(),
					array(
						'slug' => 'second',
						'name' => 'Second Plugin',
					)
				),
			)
		);

		ob_start();
		wpcom_marketplace_render_grid();
		$html = ob_get_clean();

		$this->assertSame( 2, substr_count( $html, 'wpcom-marketplace-card ' ) );
		$this->assertStringContainsString( '2 items', $html );
		$this->assertLessThan(
			strpos( $html, 'Second Plugin' ),
			strpos( $html, 'Gravity Forms' ),
			'The catalog arrives ranked by sales, so the grid must not reorder it.'
		);
	}

	/**
	 * An unreadable catalog says so rather than rendering an empty screen.
	 */
	public function test_grid_reports_an_empty_catalog() {
		$this->enable_tab();
		$this->seed_catalog( array() );

		ob_start();
		wpcom_marketplace_render_grid();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'notice', $html );
		$this->assertStringNotContainsString( 'wpcom-marketplace-grid', $html );
	}
}
