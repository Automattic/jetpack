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
		wp_set_current_user( 0 );
		\Jetpack_Options::delete_option( 'id' );
		delete_site_transient( 'update_plugins' );

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
	 * The tab's own query is answered from the catalog, in sales order, on one page.
	 */
	public function test_plugins_api_lists_the_catalog_for_the_tab() {
		$this->enable_tab();
		$this->seed_catalog(
			array(
				'gravityforms' => $this->priced_card(),
				'second'       => array_merge( $this->priced_card(), array( 'slug' => 'second' ) ),
			)
		);

		$result = wpcom_marketplace_serve_plugins_api( false, 'query_plugins', (object) array( 'wpcom_marketplace' => true ) );

		$this->assertSame( array( 'gravityforms', 'second' ), array_column( $result->plugins, 'slug' ) );
		$this->assertSame( 2, $result->info['results'] );
		$this->assertSame( 1, $result->info['pages'] );
	}

	/**
	 * Core's list table shows an unreadable catalog as its own error, with a Try Again button.
	 */
	public function test_plugins_api_reports_an_empty_catalog() {
		$this->enable_tab();
		$this->seed_catalog( array() );

		$this->assertInstanceOf(
			WP_Error::class,
			wpcom_marketplace_serve_plugins_api( false, 'query_plugins', (object) array( 'wpcom_marketplace' => true ) )
		);
	}

	/**
	 * Core has no query for a tab it does not know, so the tab asks for the whole catalog.
	 */
	public function test_table_args_ask_for_the_whole_catalog_on_one_page() {
		$this->assertFalse( wpcom_marketplace_table_args( false ), 'Flag off.' );

		$this->enable_tab();
		$this->seed_catalog( array( 'gravityforms' => $this->priced_card() ) );
		$args = wpcom_marketplace_table_args( false );

		$this->assertTrue( $args['wpcom_marketplace'] );
		$this->assertSame( 1, $args['page'] );
		$this->assertSame( 1, $args['per_page'] );
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
	 * Simple sites draw the screen from plugins.php, under core's screen id.
	 */
	public function test_details_are_served_on_the_simple_screen() {
		require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
		$this->enable_tab();
		$this->seed_catalog( array( 'gravityforms' => Marketplace_Catalog::to_card( self::PRODUCT ) ) );

		$GLOBALS['pagenow']        = 'plugins.php';
		$GLOBALS['current_screen'] = WP_Screen::get( 'plugin-install' );
		$result                    = wpcom_marketplace_serve_plugins_api( false, 'plugin_information', (object) array( 'slug' => 'gravityforms' ) );
		unset( $GLOBALS['pagenow'], $GLOBALS['current_screen'] );

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
	 * A heading is a heading. Stripping it glued its text onto the copy either side,
	 * and h2 is the level vendor pages actually use: 151 of them across 38 products.
	 */
	public function test_modal_html_keeps_every_heading_level() {
		$html = Marketplace_Catalog::to_modal_html( '<div>Intro copy.<h2>Key features</h2>More copy.</div>' );

		$this->assertStringContainsString( '<h2>Key features</h2>', $html );
		$this->assertStringNotContainsString( 'copy.Key features', $html );
		$this->assertStringNotContainsString( 'featuresMore', $html );
	}

	/**
	 * Table cells owe a break as much as the row around them does. Breaking on the
	 * row alone ran every cell in it together.
	 */
	public function test_modal_html_separates_table_cells() {
		$html = Marketplace_Catalog::to_modal_html(
			'<table><tr><td>Multiple keyphrases</td><td>Yes</td></tr><tr><th>Support</th><th>Included</th></tr></table>'
		);

		$this->assertStringNotContainsString( 'keyphrasesYes', $html );
		$this->assertStringNotContainsString( 'SupportIncluded', $html );
		$this->assertStringContainsString( 'Multiple keyphrases', $html );
		$this->assertStringContainsString( 'Included', $html );
	}

	/**
	 * Inline tags must not break. The catalog carries 77 `</span>`, and treating
	 * those like block tags would split sentences down the middle.
	 */
	public function test_modal_html_does_not_break_on_inline_tags() {
		$html = Marketplace_Catalog::to_modal_html( '<p>One <span>whole</span> sentence, <sup>really</sup> it is.</p>' );

		$this->assertStringContainsString( 'One whole sentence, really it is.', $html );
	}

	/**
	 * Core's modal allowlist has no b or i, so emphasis written with them would be
	 * dropped a filter later. Normalized to the tags that survive.
	 */
	public function test_modal_html_normalizes_b_and_i() {
		$html = Marketplace_Catalog::to_modal_html( '<p>Plain <b>bold</b> and <i>italic</i>.</p>' );

		$this->assertStringContainsString( '<strong>bold</strong>', $html );
		$this->assertStringContainsString( '<em>italic</em>', $html );

		// The rule must not catch <img>, which shares its first letter with <i>.
		$this->assertStringNotContainsString( '<emmg', Marketplace_Catalog::to_modal_html( '<p>A <img src="x.png" /> here.</p>' ) );
	}

	/**
	 * A description that is nothing but images and wrappers reduces to nothing, and
	 * the card's short description is left in place rather than blanked.
	 */
	public function test_modal_html_reduces_a_wrapper_only_description_to_nothing() {
		$this->assertSame( '', Marketplace_Catalog::to_modal_html( '<div><figure><img src="x.png" /></figure></div>' ) );
	}

	/**
	 * A javascript: href is dropped by wp_kses(). Pinned because the day someone
	 * simplifies this to strip_tags() is the day that stops being true.
	 */
	public function test_modal_html_drops_a_javascript_href() {
		$html = Marketplace_Catalog::to_modal_html( '<p><a href="javascript:alert(1)">Click</a></p>' );

		$this->assertStringNotContainsString( 'javascript:', $html );
		$this->assertStringContainsString( 'Click', $html );
	}

	/**
	 * A lazy-loaded image carries its real source in data-src and a placeholder in
	 * src, and matching both turned the placeholder into a screenshot.
	 */
	public function test_screenshots_ignore_data_src() {
		$html = Marketplace_Catalog::to_screenshots_html( '<img data-src="https://example.com/real.png" src="https://example.com/1x1.gif" />' );

		$this->assertStringContainsString( '1x1.gif', $html );
		$this->assertStringNotContainsString( 'real.png', $html );
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
	 * Simple sites supply the store catalog, since their API client cannot request it.
	 */
	public function test_the_store_catalog_can_be_supplied() {
		$supplied = static function () {
			return array(
				'gravityforms_yearly' => array(
					'product_id'   => 2509,
					'cost_display' => '$132.00',
					'cost'         => 132,
				),
			);
		};
		$fetch    = new ReflectionMethod( Marketplace_Catalog::class, 'fetch_store_products' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$fetch->setAccessible( true );
		}

		add_filter( 'wpcom_marketplace_store_products', $supplied );
		$store = $fetch->invoke( null );
		remove_filter( 'wpcom_marketplace_store_products', $supplied );

		$this->assertSame( 'gravityforms_yearly', $store[2509]['slug'] );
		$this->assertSame( '$132.00', $store[2509]['price'] );
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
	 * Simple sends a purchase that checkout alone cannot complete through Calypso.
	 */
	public function test_purchase_can_be_sent_elsewhere() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		$calypso = static function () {
			return 'https://wordpress.com/plugins/gravityforms/example.org';
		};

		add_filter( 'wpcom_marketplace_checkout_url', $calypso );
		$button = wpcom_marketplace_card_button( $this->priced_card() );
		remove_filter( 'wpcom_marketplace_checkout_url', $calypso );

		$this->assertStringContainsString( 'href="https://wordpress.com/plugins/gravityforms/example.org"', $button );
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
	 * The card's action buys the plugin, at the one term the tab sells, styled as core's Install Now.
	 */
	public function test_button_targets_yearly_checkout() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$button = wpcom_marketplace_card_button( $this->priced_card() );

		$this->assertStringContainsString( 'gravityforms_yearly', $button );
		$this->assertStringNotContainsString( 'gravityforms_monthly', $button );
		$this->assertStringContainsString( 'class="button button-compact"', $button );
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
	 * The tab is core's list table, inside #plugin-filter with the intro, which core's live search empties.
	 */
	public function test_the_tab_draws_cores_list_table_inside_the_form() {
		global $wp_list_table;

		$previous      = $wp_list_table;
		$wp_list_table = new class() {
			/**
			 * Stands in for core's cards.
			 */
			public function display() {
				echo '<div id="the-list">cards</div>';
			}
		};

		ob_start();
		wpcom_marketplace_render_table();
		$html = ob_get_clean();

		$wp_list_table = $previous;

		$this->assertMatchesRegularExpression( '#^<form id="plugin-filter" method="post"><p class="wpcom-marketplace-intro">.+</p><div id="the-list">cards</div></form>$#s', $html );
	}

	/**
	 * Both price rows, as one string.
	 *
	 * @param array $card Normalized product data.
	 * @return string
	 */
	private function price_html( array $card ) {
		return trim( implode( ' ', wpcom_marketplace_price_rows( $card ) ) );
	}

	/**
	 * Collapses runs of whitespace, since the rendered markup is indented.
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
		$html = $this->price_html( $this->priced_card() );

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
		$html = $this->price_html( $this->priced_card() );

		$this->assertStringContainsString( '$13.00/month if billed monthly', $html );
		$this->assertStringContainsString( 'wpcom-marketplace-card__note', $html );
		$this->assertStringNotContainsString( 'or $13.00', $html );
	}

	/**
	 * A product with no monthly variation has nothing to compare against, so it
	 * shows the year alone.
	 */
	public function test_a_yearly_only_product_shows_no_alternative() {
		$card = $this->priced_card();
		unset( $card['wpcom_pricing']['monthly'] );

		$html = $this->price_html( $card );

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

		$html = $this->price_html( $card );

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

		$html = $this->price_html( $card );

		$this->assertStringNotContainsString( 'wpcom-marketplace-card__saving', $html );
	}

	/**
	 * A product we cannot price still renders, minus the price block.
	 */
	public function test_an_unpriced_product_renders_no_price_block() {
		$this->assertSame( '', $this->price_html( Marketplace_Catalog::to_card( self::PRODUCT ) ) );
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

		// A year that costs more than twelve months is not a saving. This is Nelio:
		// $2,748 a year against $99 a month.
		$this->assertSame(
			0,
			Marketplace_Catalog::yearly_saving(
				array(
					'yearly'  => array( 'cost' => 2748.0 ),
					'monthly' => array( 'cost' => 99.0 ),
				)
			)
		);

		// And a gap too large to be two billing terms of one product is refused
		// rather than stated. This is MailPoet: $312 a year against $140 a month,
		// which the arithmetic calls 81% off.
		$this->assertSame(
			0,
			Marketplace_Catalog::yearly_saving(
				array(
					'yearly'  => array( 'cost' => 312.0 ),
					'monthly' => array( 'cost' => 140.0 ),
				)
			)
		);
	}

	/**
	 * Cut at a word, near the 150 characters WordPress.org allows, so cards stay core's height.
	 */
	public function test_long_descriptions_are_cut_to_wordpress_org_length() {
		$card                      = $this->priced_card();
		$card['short_description'] = str_repeat( 'Forms for every project. ', 12 );

		$description = wpcom_marketplace_card_description( $card );

		$this->assertLessThanOrEqual( 151, mb_strlen( $description ) );
		$this->assertStringEndsWith( 'project…', $description );
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
	 * A referral card, as the store shapes one: variations priced like anything else,
	 * with the product type as the only thing saying it is not ours to sell.
	 *
	 * @return array
	 */
	private function referral_card() {
		$card = $this->priced_card();

		$card['wpcom_pricing']['yearly']['type']  = 'saas_plugin';
		$card['wpcom_pricing']['monthly']['type'] = 'saas_plugin';
		$card['wpcom_referral_url']               = 'https://example.com/vendor-pricing';

		return $card;
	}

	/**
	 * The product type is what marks a referral. Nothing about the shape of the
	 * payload does: it carries variations and prices like any other product.
	 */
	public function test_a_saas_product_type_marks_a_referral() {
		$this->assertTrue( Marketplace_Catalog::is_referral( $this->referral_card() ) );
		$this->assertFalse( Marketplace_Catalog::is_referral( $this->priced_card() ) );
		$this->assertFalse( Marketplace_Catalog::is_referral( Marketplace_Catalog::to_card( self::PRODUCT ) ) );
	}

	/**
	 * The store's figures for a referral are not what the vendor charges.
	 */
	public function test_a_referral_starts_for_free_instead_of_showing_a_price() {
		$html = $this->price_html( $this->referral_card() );

		$this->assertStringContainsString( 'Start for free', $html );
		$this->assertStringNotContainsString( '$', $html );
		$this->assertStringNotContainsString( 'Save', $html );
	}

	/**
	 * Signs in a local user linked to WordPress.com account 12345, on blog 67890.
	 *
	 * @return void
	 */
	private function sign_in_wpcom_user() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'referred',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);

		update_user_meta( $user_id, 'wpcom_user_id', '12345' );
		wp_set_current_user( $user_id );
		\Jetpack_Options::update_option( 'id', 67890 );
	}

	/**
	 * Checkout cannot complete a referral, so the action goes to the vendor instead.
	 */
	public function test_a_referral_links_to_the_vendor_not_checkout() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$this->sign_in_wpcom_user();

		$button = wpcom_marketplace_card_button( $this->referral_card() );

		$this->assertStringContainsString( 'https://example.com/vendor-pricing?uuid=12345%2B67890', $button );
		$this->assertStringContainsString( 'Get started', $button );
		$this->assertStringNotContainsString( 'noreferrer', $button );
		$this->assertStringNotContainsString( 'wordpress.com/checkout', $button );
		$this->assertStringNotContainsString( 'Purchase', $button );
	}

	/**
	 * The vendor reads the account and site from `uuid`, so it has to arrive as one value.
	 */
	public function test_the_referral_url_names_the_account_and_site() {
		\Jetpack_Options::update_option( 'id', 67890 );

		$card                       = $this->referral_card();
		$card['wpcom_referral_url'] = 'https://example.com/new?p=155&partner=wpcom';

		$this->assertSame(
			'https://example.com/new?p=155&partner=wpcom&uuid=12345%2B67890',
			Marketplace_Catalog::referral_url( $card, 12345 )
		);
		$this->assertSame( '', Marketplace_Catalog::referral_url( $card, 0 ) );
	}

	/**
	 * A referral without the site's blog id would reach the vendor naming no site.
	 */
	public function test_the_referral_url_needs_a_blog_id() {
		$this->assertSame( '', Marketplace_Catalog::referral_url( $this->referral_card(), 12345 ) );
	}

	/**
	 * Without an account to refer, the vendor could not match the order, so Calypso takes over.
	 */
	public function test_a_referral_with_no_account_to_refer_goes_to_the_product_page() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		\Jetpack_Options::update_option( 'id', 67890 );

		$button = wpcom_marketplace_card_button( $this->referral_card() );

		$this->assertStringContainsString( 'https://wordpress.com/plugins/gravityforms/', $button );
		$this->assertStringNotContainsString( 'uuid=', $button );
		$this->assertStringNotContainsString( 'vendor-pricing', $button );
	}

	/**
	 * With nowhere to send someone, no action is better than one that goes nowhere.
	 */
	public function test_a_referral_without_a_vendor_url_renders_no_action() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

		$card                       = $this->referral_card();
		$card['wpcom_referral_url'] = '';

		$this->assertSame( '', wpcom_marketplace_card_button( $card ) );
	}

	/**
	 * Core's dependency notice reads `requires_plugins`, so the card carries the product's
	 * requirements, minus anything that names the product itself.
	 */
	public function test_requires_plugins_come_from_the_requirements() {
		$card = Marketplace_Catalog::to_card(
			array_merge(
				self::PRODUCT,
				array(
					'requirements' => array(
						'plugins' => array( 'woocommerce', 'woocommerce-payments', 'gravityforms', '', 7, 'woocommerce' ),
						'themes'  => array( 'astra' ),
					),
				)
			)
		);

		$this->assertSame( array( 'woocommerce', 'woocommerce-payments' ), $card['requires_plugins'] );
		$this->assertSame( array(), Marketplace_Catalog::to_card( self::PRODUCT )['requires_plugins'] );
	}

	/**
	 * The dependency cache only answers for slugs some product in the catalog needs.
	 */
	public function test_dependency_slugs_cover_the_whole_catalog() {
		$this->seed_catalog(
			array(
				'a' => array( 'requires_plugins' => array( 'woocommerce', 'woocommerce-payments' ) ),
				'b' => array( 'requires_plugins' => array( 'woocommerce', 'wp-job-manager' ) ),
				'c' => array(),
			)
		);

		$this->assertSame( array( 'woocommerce', 'woocommerce-payments', 'wp-job-manager' ), Marketplace_Catalog::get_dependency_slugs() );
	}

	/**
	 * The referral URL comes through from the endpoint's own field.
	 */
	public function test_the_referral_url_is_read_from_the_payload() {
		$card = Marketplace_Catalog::to_card(
			array_merge( self::PRODUCT, array( 'saas_landing_page' => 'https://example.com/vendor' ) )
		);

		$this->assertSame( 'https://example.com/vendor', $card['wpcom_referral_url'] );
		$this->assertSame( '', Marketplace_Catalog::to_card( self::PRODUCT )['wpcom_referral_url'] );
	}

	/**
	 * Tracks rides along with the tab, and only the tab.
	 */
	public function test_the_tab_loads_its_tracks_script() {
		wpcom_marketplace_render_tab();
		remove_filter( 'admin_body_class', 'wpcom_marketplace_body_class' );

		$this->assertTrue( wp_script_is( 'jetpack-mu-wpcom-wpcom-marketplace-tab', 'enqueued' ) );
	}
}
