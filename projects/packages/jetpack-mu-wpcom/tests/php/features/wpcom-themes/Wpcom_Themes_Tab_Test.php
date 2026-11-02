<?php
/**
 * Tests for the Marketplace tab on the Add Themes screen.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Status\Cache;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-themes/wpcom-themes-tab.php';

/**
 * Class Wpcom_Themes_Tab_Test
 */
class Wpcom_Themes_Tab_Test extends \WorDBless\BaseTestCase {

	/**
	 * Per-flag filter, so toggling ours leaves every other flag alone.
	 *
	 * @var string
	 */
	private const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . WPCOM_THEMES_TAB_FLAG;

	/**
	 * Whether a test has mocked the site's plan, which tear_down has to undo.
	 *
	 * @var bool
	 */
	private $mocking = false;

	/**
	 * A theme as `/wpcom/v2/themes` returns it, trimmed to the fields we read.
	 *
	 * @var array
	 */
	private const THEME = array(
		'id'          => 'organic-stax',
		'stylesheet'  => 'organic-stax',
		'name'        => 'STAX',
		'author'      => 'Organic Themes',
		'description' => 'A premium block theme.',
		'version'     => '1.0',
		'screenshot'  => 'https://theme.files.wordpress.com/2023/02/stax-featured.jpg',
		'demo_uri'    => 'https://stax.organicthemes.com/',
		'block_theme' => true,
		'date_added'  => '2023-02-01',
		'taxonomies'  => array(),
		'theme_tier'  => array( 'slug' => 'personal' ),
	);

	/**
	 * A partner theme as the tier listing returns it, sold by the month and by the year.
	 *
	 * @var array
	 */
	private const PARTNER_THEMES = array(
		'themes' => array(
			array(
				'id'              => 'organic-stax',
				'product_details' => array(
					array( 'product_slug' => 'theme_stax_monthly' ),
					array( 'product_slug' => 'theme_stax_yearly' ),
				),
			),
		),
	);

	/**
	 * Those two products, as the store returns them.
	 *
	 * @var array
	 */
	private const STORE_PRODUCTS = array(
		'theme_stax_monthly' => array(
			'product_type'         => 'marketplace_theme',
			'product_term'         => 'month',
			'billing_product_slug' => 'theme-stax',
		),
		'theme_stax_yearly'  => array(
			'product_type'           => 'marketplace_theme',
			'product_term'           => 'year',
			'billing_product_slug'   => 'theme-stax',
			'cost_per_month_display' => '$7.20',
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
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
	}

	/**
	 * Clean up.
	 *
	 * @return void
	 */
	public function tear_down() {
		remove_all_filters( self::FLAG_FILTER );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'jetpack_constant_default_value' );
		Constants::clear_constants();
		// Host memoizes is_woa_site past clear_constants().
		Cache::clear();
		wp_deregister_script( 'wpcom-themes-tab' );

		// The shared reader caches in the object cache.
		wp_cache_flush();

		unset( $GLOBALS['wpcom_get_site_purchases_test_value'] );
		if ( $this->mocking ) {
			Monkey\tearDown();
		}

		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'id' );

		parent::tear_down();
	}

	/**
	 * Turn the tab on for the duration of a test.
	 *
	 * @return void
	 */
	private function enable_tab() {
		$this->pretend_atomic();
		add_filter( self::FLAG_FILTER, '__return_true' );
	}

	/**
	 * Make is_woa_site() true, which the tab requires.
	 *
	 * @return void
	 */
	private function pretend_atomic() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', 'wpcomsh.php' );
		// Host memoizes the answer, so a cached one from another test would stick.
		Cache::clear();
	}

	/**
	 * Make the site a Simple one.
	 *
	 * @return void
	 */
	private function pretend_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		Cache::clear();
	}

	/**
	 * Answers every request the same way, recording the URL.
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
	 * Answers matching requests with a JSON body, and anything unmatched with a 404.
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
	 * Answers the two reads that pricing a partner theme takes.
	 *
	 * @param array|null $store Store products, or null for the ones both fixtures share.
	 * @return void
	 */
	private function answer_with_partner_prices( ?array $store = null ) {
		$this->answer_wpcom(
			array(
				'tier=partner' => array( 'body' => self::PARTNER_THEMES ),
				'/products'    => $store ?? self::STORE_PRODUCTS,
			)
		);
	}

	/**
	 * Answers with a page of themes.
	 *
	 * @param array $themes Themes on the page, malformed entries included.
	 * @param int   $found  Total across all pages.
	 * @return void
	 */
	private function answer_with_themes( array $themes, $found = null ) {
		unset( $found );

		$this->answer_wpcom_with(
			200,
			wp_json_encode(
				array( 'body' => array( 'themes' => $themes ) ),
				JSON_UNESCAPED_SLASHES
			)
		);
	}

	/**
	 * Answers with a single theme, as `/themes/<slug>` returns it.
	 *
	 * @param array $theme The theme.
	 * @return void
	 */
	private function answer_with_theme( array $theme ) {
		$this->answer_wpcom_with( 200, wp_json_encode( array( 'body' => $theme ), JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * Query the themes API as core's theme.js does for a tab.
	 *
	 * @param array $args Request arguments.
	 * @return false|object|array
	 */
	private function query( array $args ) {
		return wpcom_themes_tab_serve_themes_api( false, 'query_themes', (object) $args );
	}

	/**
	 * The tab's query is answered from the WordPress.com themes endpoint.
	 */
	public function test_serves_themes_from_wpcom() {
		$this->enable_tab();
		$this->answer_with_themes( array( self::THEME ), 1 );

		$result = $this->query( array( 'browse' => WPCOM_THEMES_TAB ) );

		$this->assertCount( 1, $this->requests );
		$this->assertStringContainsString( '/wpcom/v2/themes', $this->requests[0] );
		// The tab lists every tier, so the request must not scope itself to one.
		$this->assertStringNotContainsString( 'tier=', $this->requests[0] );

		$theme = $result->themes[0];
		$this->assertSame( 'organic-stax', $theme->slug );
		$this->assertSame( 'STAX', $theme->name );
		$this->assertSame( 'Organic Themes', $theme->author['display_name'] );
		$this->assertSame( self::THEME['screenshot'], $theme->screenshot_url );
		// The demo site renders as a preview, without its own promos, given these args.
		$this->assertSame( self::THEME['demo_uri'] . '?demo=true&iframe=true&theme_preview=true', $theme->preview_url );
		$this->assertTrue( $theme->wpcom_marketplace_tab );
	}

	/**
	 * Core's wp_ajax_query_themes() reads these without isset() guards.
	 */
	public function test_themes_have_the_fields_core_reads() {
		$this->enable_tab();
		$this->answer_with_themes( array( self::THEME ) );

		$theme = $this->query( array( 'browse' => WPCOM_THEMES_TAB ) )->themes[0];

		foreach ( array( 'slug', 'name', 'version', 'description', 'screenshot_url', 'preview_url', 'rating', 'num_ratings', 'requires', 'requires_php' ) as $field ) {
			$this->assertObjectHasProperty( $field, $theme );
		}
		$this->assertArrayHasKey( 'display_name', $theme->author );
		$this->assertObjectHasProperty( 'installed', $theme );
		$this->assertSame( 'personal', $theme->theme_tier );
	}

	/**
	 * Themes without a usable id cannot be installed or linked, so they are dropped.
	 */
	public function test_skips_themes_without_an_id() {
		$this->enable_tab();
		$this->answer_with_themes( array( self::THEME, array( 'name' => 'No id' ), 'not-a-theme' ), 3 );

		$result = $this->query( array( 'browse' => WPCOM_THEMES_TAB ) );

		$this->assertCount( 1, $result->themes );
	}

	/**
	 * Scrolling the grid slices a catalog that was fetched once, rather than asking per page.
	 */
	public function test_pages_through_the_catalog_from_one_fetch() {
		$this->enable_tab();
		$themes = array();
		for ( $i = 1; $i <= WPCOM_THEMES_TAB_PER_PAGE + 50; $i++ ) {
			$themes[] = array_merge( self::THEME, array( 'id' => 'theme-' . $i ) );
		}
		$this->answer_with_themes( $themes );

		$result = $this->query(
			array(
				'browse' => WPCOM_THEMES_TAB,
				'page'   => 2,
			)
		);

		$this->assertCount( 50, $result->themes );
		$this->assertSame( 'theme-' . ( WPCOM_THEMES_TAB_PER_PAGE + 1 ), $result->themes[0]->slug );
		$this->assertSame( 2, $result->info['page'] );
		$this->assertSame( 2, $result->info['pages'] );
		$this->assertSame( WPCOM_THEMES_TAB_PER_PAGE + 50, $result->info['results'] );
		$this->assertCount( 1, $this->requests );
	}

	/**
	 * A second view within the cache window does not call WordPress.com again.
	 */
	public function test_caches_the_catalog() {
		$this->enable_tab();
		$this->answer_with_themes( array( self::THEME ), 1 );

		$this->query( array( 'browse' => WPCOM_THEMES_TAB ) );
		$result = $this->query( array( 'browse' => WPCOM_THEMES_TAB ) );

		$this->assertCount( 1, $this->requests );
		$this->assertCount( 1, $result->themes );
	}

	/**
	 * A failed read is not cached, so a moment's trouble does not empty the tab for a day.
	 */
	public function test_failure_is_empty_and_not_cached() {
		$this->enable_tab();
		$this->answer_wpcom_with( 500, '{}' );

		$first  = $this->query( array( 'browse' => WPCOM_THEMES_TAB ) );
		$second = $this->query( array( 'browse' => WPCOM_THEMES_TAB ) );

		$this->assertSame( array(), $first->themes );
		$this->assertSame( 0, $first->info['results'] );
		$this->assertSame( array(), $second->themes );
		$this->assertCount( 2, $this->requests );
	}

	/**
	 * A preview link is answered with our copy of the theme, WordPress.org tiers included.
	 */
	public function test_answers_preview_link_for_any_wpcom_theme() {
		$this->enable_tab();
		// The free tier is on WordPress.org too, so this is the case that proves we answer regardless.
		$this->answer_with_theme( array_merge( self::THEME, array( 'theme_tier' => array( 'slug' => 'free' ) ) ) );

		$result = $this->query( array( 'theme' => 'organic-stax' ) );

		$this->assertCount( 1, $result->themes );
		$this->assertSame( 'organic-stax', $result->themes[0]->slug );
		$this->assertSame( self::THEME['demo_uri'] . '?demo=true&iframe=true&theme_preview=true', $result->themes[0]->preview_url );
		$this->assertTrue( $result->themes[0]->wpcom_marketplace_tab );
		// One request by slug, rather than paging through the whole catalog to find it.
		$this->assertCount( 1, $this->requests );
		$this->assertStringContainsString( '/rest/v1.2/themes/organic-stax', $this->requests[0] );
	}

	/**
	 * A preview link for a theme WordPress.com does not have is left to WordPress.org.
	 */
	public function test_leaves_other_preview_links_to_core() {
		$this->enable_tab();
		$this->answer_wpcom_with( 404, wp_json_encode( array( 'error' => 'unknown_theme' ), JSON_UNESCAPED_SLASHES ) );

		$this->assertFalse( $this->query( array( 'theme' => 'twentytwentyfive' ) ) );
	}

	/**
	 * Core's own tabs, search and theme details still go to WordPress.org.
	 */
	public function test_leaves_other_tabs_to_core() {
		$this->enable_tab();
		$this->answer_with_themes( array( self::THEME ), 1 );

		$this->assertFalse( $this->query( array( 'browse' => 'popular' ) ) );
		$this->assertFalse( $this->query( array( 'search' => 'blog' ) ) );
		$this->assertFalse( wpcom_themes_tab_serve_themes_api( false, 'theme_information', (object) array( 'slug' => 'organic-stax' ) ) );
		$this->assertSame( array(), $this->requests );
	}

	/**
	 * With the flag off, neither the tab nor its results appear, and nothing is fetched.
	 */
	public function test_does_nothing_when_flag_is_off() {
		$this->answer_with_themes( array( self::THEME ), 1 );

		$this->assertFalse( $this->query( array( 'browse' => WPCOM_THEMES_TAB ) ) );
		$this->assertSame( array(), $this->requests );

		wpcom_themes_tab_enqueue_script();
		$this->assertFalse( wp_script_is( 'wpcom-themes-tab', 'enqueued' ) );
	}

	/**
	 * A result from an earlier filter is passed through untouched.
	 */
	public function test_respects_an_earlier_result() {
		$this->enable_tab();
		$earlier = (object) array( 'themes' => array() );

		$this->assertSame( $earlier, wpcom_themes_tab_serve_themes_api( $earlier, 'query_themes', (object) array( 'browse' => WPCOM_THEMES_TAB ) ) );
	}

	/**
	 * With the flag on, the Add Themes screen loads the tab script.
	 */
	public function test_enqueues_script_when_flag_is_on() {
		$this->enable_tab();

		wpcom_themes_tab_enqueue_script();

		$this->assertTrue( wp_script_is( 'wpcom-themes-tab', 'enqueued' ) );
	}

	/**
	 * A bare Add Themes request lands on this tab, which core would otherwise route to Popular.
	 */
	public function test_bare_request_defaults_to_the_tab() {
		$this->enable_tab();

		$this->assertTrue( wpcom_themes_tab_is_default_view( array() ) );
	}

	/**
	 * A request that asks for a view, a search, an upload or a preview is left alone.
	 */
	public function test_requested_views_are_left_alone() {
		$this->enable_tab();

		$this->assertFalse( wpcom_themes_tab_is_default_view( array( 'browse' => 'popular' ) ) );
		$this->assertFalse( wpcom_themes_tab_is_default_view( array( 'browse' => WPCOM_THEMES_TAB ) ) );
		$this->assertFalse( wpcom_themes_tab_is_default_view( array( 'search' => 'dark' ) ) );
		$this->assertFalse( wpcom_themes_tab_is_default_view( array( 'upload' => '' ) ) );
		$this->assertFalse( wpcom_themes_tab_is_default_view( array( 'theme' => 'organic-stax' ) ) );
	}

	/**
	 * With the flag off the screen keeps core's own default view.
	 */
	public function test_no_default_view_when_flag_is_off() {
		$this->assertFalse( wpcom_themes_tab_is_default_view( array() ) );
	}

	/**
	 * The flag turns the tab on only where WordPress.com hosts the site.
	 *
	 * @param string $host    `self-hosted`, `atomic` or `simple`.
	 * @param bool   $enabled Whether the tab should show.
	 * @dataProvider provide_hosts
	 */
	#[DataProvider( 'provide_hosts' )]
	public function test_the_flag_enables_the_tab_on_wpcom_hosts_only( string $host, bool $enabled ) {
		if ( 'atomic' === $host ) {
			$this->pretend_atomic();
		} elseif ( 'simple' === $host ) {
			$this->pretend_simple();
		}
		add_filter( self::FLAG_FILTER, '__return_true' );

		$this->assertSame( $enabled, wpcom_themes_tab_enabled() );
	}

	/**
	 * Hosts, and whether the flag shows the tab on each.
	 *
	 * @return array<string, array{0: string, 1: bool}>
	 */
	public static function provide_hosts(): array {
		return array(
			'self-hosted' => array( 'self-hosted', false ),
			'Atomic'      => array( 'atomic', true ),
			'Simple'      => array( 'simple', true ),
		);
	}

	/**
	 * Checkout returns to the theme once bought, and back to the tab when it is abandoned.
	 *
	 * Both are query values rather than paths, so both are encoded.
	 */
	public function test_checkout_returns_to_the_theme_it_was_bought_for() {
		$this->site_has_plan( false );
		$url = wpcom_themes_tab_checkout_url( 'example-bundle', 'example' );

		$this->assertStringContainsString( 'https://wordpress.com/checkout/example.org/example-bundle', $url );
		$this->assertStringContainsString( 'checkoutBackUrl=' . rawurlencode( wpcom_themes_tab_url() ), $url );
		$this->assertStringContainsString(
			'redirect_to=' . rawurlencode( admin_url( 'theme-install.php?theme=example' ) ),
			$url
		);

		$theme = wpcom_themes_tab_add_plan(
			(object) array(
				'slug'       => 'example',
				'theme_tier' => 'woocommerce',
			)
		);
		$this->assertSame( WPCom_Themes_Tiers::plan_for( 'woocommerce' ), $theme->required_plan );
	}

	/**
	 * A theme needing no plan is badged as included, and keeps the install core would run.
	 */
	public function test_a_theme_needing_no_plan_is_included() {
		$theme = wpcom_themes_tab_add_plan(
			(object) array(
				'slug'       => 'example',
				'theme_tier' => 'free',
			)
		);

		$this->assertSame( 'Included with plan', $theme->plan_badge );
		$this->assertFalse( isset( $theme->upgrade_url ) );
		$this->assertFalse( isset( $theme->required_plan ) );
	}

	/**
	 * A partner theme names the product to price it by, and sells itself rather than a plan.
	 */
	public function test_a_partner_theme_is_priced_and_sold() {
		// The site already has a paid plan, so only the theme is sold.
		$this->site_has_plan( true );
		$this->answer_with_partner_prices();

		$theme = $this->add_plan_to_partner_theme();

		// The theme lists its monthly product first, and the one to quote is still the yearly one.
		$this->assertSame( 'theme_stax_yearly', $theme->price_product );
		$this->assertSame( '', $theme->required_plan );
		$this->assertStringContainsString( 'theme_stax_yearly', $theme->purchase_url );
		$this->assertStringContainsString(
			'redirect_to=' . rawurlencode( admin_url( 'theme-install.php?theme=organic-stax' ) ),
			$theme->purchase_url
		);
	}

	/**
	 * A site that needs the plan as well buys both at once, which checkout splits on the comma.
	 */
	public function test_checkout_can_charge_for_a_plan_and_a_theme_together() {
		$url = wpcom_themes_tab_checkout_url( array( 'personal-bundle', 'theme_stax_yearly' ), 'organic-stax' );

		$this->assertStringContainsString( '/checkout/example.org/personal-bundle,theme_stax_yearly?', $url );

		$this->site_has_plan( false );
		$this->answer_with_partner_prices();
		$theme = $this->add_plan_to_partner_theme();

		$this->assertSame( 'personal-bundle', $theme->required_plan );
		$this->assertStringContainsString( '/personal-bundle,theme_stax_yearly?', $theme->purchase_url );
	}

	/**
	 * A theme the site already subscribes to is core's to install, so it is not sold again.
	 */
	public function test_a_subscribed_partner_theme_claims_nothing() {
		$this->answer_with_partner_prices();
		// Matched on the billing slug, so the monthly subscription answers for the yearly product.
		$GLOBALS['wpcom_get_site_purchases_test_value'] = array( (object) array( 'billing_product_slug' => 'theme-stax' ) );

		$theme = $this->add_plan_to_partner_theme();

		$this->assertFalse( isset( $theme->price_product ) );
		$this->assertFalse( isset( $theme->purchase_url ) );
	}

	/**
	 * A partner theme the store has no product for says nothing rather than a price we do not have.
	 */
	public function test_an_unsold_partner_theme_claims_nothing() {
		$this->answer_with_partner_prices( array() );

		$theme = $this->add_plan_to_partner_theme();

		$this->assertFalse( isset( $theme->price_product ) );
		$this->assertFalse( isset( $theme->purchase_url ) );
	}

	/**
	 * A theme the store has withdrawn cannot be bought, so it is not offered either.
	 */
	public function test_a_withdrawn_partner_theme_claims_nothing() {
		$store                                   = self::STORE_PRODUCTS;
		$store['theme_stax_yearly']['available'] = false;
		$this->answer_with_partner_prices( $store );

		$theme = $this->add_plan_to_partner_theme();

		$this->assertFalse( isset( $theme->price_product ) );
		$this->assertFalse( isset( $theme->purchase_url ) );
	}

	/**
	 * The pricing filter keeps what the site can install with nothing to buy, before paging.
	 *
	 * @param bool          $has_plan  Whether the site's plan grants every tier.
	 * @param array<object> $purchases The site's purchases.
	 * @param string[]      $listed    Slugs the filter keeps.
	 * @dataProvider provide_included_themes
	 */
	#[DataProvider( 'provide_included_themes' )]
	public function test_the_pricing_filter_lists_only_what_the_plan_includes( bool $has_plan, array $purchases, array $listed ) {
		$this->enable_tab();
		$this->site_has_plan( $has_plan );
		$GLOBALS['wpcom_get_site_purchases_test_value'] = $purchases;
		$this->answer_wpcom(
			array(
				'tier=partner'     => array( 'body' => self::PARTNER_THEMES ),
				'/products'        => self::STORE_PRODUCTS,
				'/wpcom/v2/themes' => array(
					'body' => array(
						'themes' => array(
							array_merge(
								self::THEME,
								array(
									'id'         => 'free-theme',
									'theme_tier' => array( 'slug' => 'free' ),
								)
							),
							array_merge( self::THEME, array( 'id' => 'personal-theme' ) ),
							array_merge( self::THEME, array( 'theme_tier' => array( 'slug' => 'partner' ) ) ),
						),
					),
				),
			)
		);

		$result = $this->query(
			array(
				'browse'        => WPCOM_THEMES_TAB,
				'wpcom_pricing' => WPCOM_THEMES_TAB_INCLUDED,
			)
		);

		$this->assertSame( $listed, array_column( $result->themes, 'slug' ) );
		$this->assertSame( count( $listed ), $result->info['results'] );
	}

	/**
	 * Plans and purchases, and the themes each leaves the filter listing.
	 *
	 * @return array<string, array{0: bool, 1: array<object>, 2: string[]}>
	 */
	public static function provide_included_themes(): array {
		return array(
			'no plan'                    => array( false, array(), array( 'free-theme' ) ),
			'a plan'                     => array( true, array(), array( 'free-theme', 'personal-theme' ) ),
			'a plan and a partner theme' => array(
				true,
				array( (object) array( 'billing_product_slug' => 'theme-stax' ) ),
				array( 'free-theme', 'personal-theme', 'organic-stax' ),
			),
		);
	}

	/**
	 * Say whether the site's plan grants every tier.
	 *
	 * @param bool $has Whether it does.
	 * @return void
	 */
	private function site_has_plan( bool $has ) {
		// Other suites leave their own expectation behind, which would refuse this stub.
		Monkey\tearDown();
		Monkey\setUp();
		$this->mocking = true;
		Functions\when( 'wpcom_site_has_feature' )->justReturn( $has );
	}

	/**
	 * The partner theme the fixtures price, as the grid hands it over.
	 *
	 * @return stdClass
	 */
	private function add_plan_to_partner_theme() {
		return wpcom_themes_tab_add_plan(
			(object) array(
				'slug'       => 'organic-stax',
				'name'       => 'STAX',
				'theme_tier' => 'partner',
			)
		);
	}

	/**
	 * Answers WordPress.org's batch lookup, listing the slugs given and failing from one request on.
	 *
	 * Registered after the WordPress.com answers, which reply to every URL, so this one wins.
	 *
	 * @param callable $listed    Whether WordPress.org lists a slug.
	 * @param int      $fail_from The request, counting from 1, that fails along with every later one.
	 * @return stdClass Counts the requests made, in `n`.
	 */
	private function answer_wporg( callable $listed, int $fail_from = 0 ) {
		$count = (object) array( 'n' => 0 );

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $listed, $fail_from, $count ) {
				if ( ! str_contains( $url, 'api.wordpress.org/themes/info' ) ) {
					return $preempt;
				}

				++$count->n;
				if ( $fail_from && $count->n >= $fail_from ) {
					return array(
						'response' => array(
							'code'    => 500,
							'message' => 'Error',
						),
						'body'     => '',
					);
				}

				wp_parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $query );
				$body = array();
				foreach ( explode( ',', $query['request']['slugs'] ) as $slug ) {
					$body[ $slug ] = $listed( $slug ) ? array( 'slug' => $slug ) : array( 'error' => 'Theme not found' );
				}

				return array(
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
				);
			},
			20,
			3
		);

		return $count;
	}

	/**
	 * WordPress.org caps a lookup at 100 themes, so a bigger catalog is asked about in batches.
	 */
	public function test_asks_wporg_about_the_catalog_in_batches_it_accepts() {
		$themes = array();
		for ( $i = 1; $i <= WPCom_Themes_Api::WP_ORG_BATCH_SIZE + 1; $i++ ) {
			$themes[] = array_merge( self::THEME, array( 'id' => 'theme-' . $i ) );
		}
		$this->answer_with_themes( $themes );
		$listed = array( 'theme-2', 'theme-101' );
		$count  = $this->answer_wporg( fn( $slug ) => in_array( $slug, $listed, true ) );

		$this->assertSame( $listed, wpcom_themes_tab_api()->fetch_wporg_slugs( array_column( $themes, 'id' ) ) );
		$this->assertSame( 2, $count->n );
	}

	/**
	 * Search also returns themes outside the catalog, such as older default themes, which are asked about too.
	 */
	public function test_asks_wporg_about_searched_themes_outside_the_catalog() {
		$this->answer_with_themes( array( self::THEME ) );
		$count = $this->answer_wporg( '__return_true' );

		$this->assertSame(
			array( 'organic-stax', 'twentytwentyone' ),
			wpcom_themes_tab_api()->fetch_wporg_slugs( array( 'organic-stax', 'twentytwentyone' ) )
		);
		$this->assertSame( 2, $count->n );
	}

	/**
	 * A failed batch would read as "not on WordPress.org" for its themes, so nothing is answered or kept.
	 */
	public function test_a_failed_wporg_batch_answers_nothing() {
		$themes = array();
		for ( $i = 1; $i <= WPCom_Themes_Api::WP_ORG_BATCH_SIZE + 1; $i++ ) {
			$themes[] = array_merge( self::THEME, array( 'id' => 'theme-' . $i ) );
		}
		$this->answer_with_themes( $themes );
		$count = $this->answer_wporg( '__return_true', 2 );

		foreach ( array( 'first', 'second' ) as $call ) {
			$this->assertNull( wpcom_themes_tab_api()->fetch_wporg_slugs( array( 'theme-1' ) ), "The $call call." );
		}
		// Two for the first call; the second asks again, which a cached failure would not.
		$this->assertSame( 3, $count->n );
	}

	/**
	 * Answers a search for "portfolio" with partner themes that match it in different ways.
	 *
	 * @return void
	 */
	private function answer_portfolio_search() {
		$partner = fn( $id, $name ) => array_merge(
			self::THEME,
			array(
				'id'         => $id,
				'name'       => $name,
				'theme_tier' => array( 'slug' => 'partner' ),
			)
		);
		$sold    = fn( $id ) => array(
			'id'              => $id,
			'product_details' => array( array( 'product_slug' => "theme_{$id}_yearly" ) ),
		);
		$product = fn( $id ) => array(
			'product_type'         => 'marketplace_theme',
			'product_term'         => 'year',
			'billing_product_slug' => "theme-{$id}",
		);

		$this->answer_wpcom(
			array(
				'tier=partner'     => array(
					'body' => array(
						'themes' => array( $sold( 'organic-stax' ), $sold( 'portfolio-twin' ), $sold( 'portfolio-pro' ) ),
					),
				),
				'/products'        => array(
					'theme_organic-stax_yearly'   => $product( 'organic-stax' ),
					'theme_portfolio-twin_yearly' => $product( 'portfolio-twin' ),
					'theme_portfolio-pro_yearly'  => $product( 'portfolio-pro' ),
				),
				'/wpcom/v2/themes' => array(
					'body' => array(
						'themes' => array(
							// Matched by WordPress.com somewhere other than the name, and listed first.
							$partner( 'organic-stax', 'STAX' ),
							// Not sold, so it cannot be bought or installed.
							$partner( 'portfolio-unsold', 'Portfolio Unsold' ),
							// WordPress.org lists another author's theme under this slug.
							$partner( 'portfolio-twin', 'Portfolio Twin' ),
							$partner( 'portfolio-pro', 'Portfolio Pro' ),
							array_merge(
								self::THEME,
								array(
									'id'   => 'portfolio-plain',
									'name' => 'Portfolio Plain',
								)
							),
						),
					),
				),
			)
		);
	}

	/**
	 * A search's first page leads with up to two sold partner themes, names matching first, above
	 * WordPress.org's results as they were.
	 */
	public function test_a_search_leads_with_matching_partner_themes() {
		$this->enable_tab();
		$this->site_has_plan( true );
		$this->answer_portfolio_search();

		$from_wporg = array( (object) array( 'slug' => 'portfolio-twin' ), (object) array( 'slug' => 'from-wporg' ) );
		$result     = wpcom_themes_tab_splice_search_partners(
			(object) array(
				'info'   => array( 'results' => 2 ),
				'themes' => $from_wporg,
			),
			'query_themes',
			(object) array( 'search' => 'portfolio' )
		);

		$this->assertSame( array( 'portfolio-twin', 'portfolio-pro', 'portfolio-twin', 'from-wporg' ), array_column( $result->themes, 'slug' ) );
		$this->assertSame( $from_wporg, array_slice( $result->themes, 2 ) );
		$this->assertSame( 4, $result->info['results'] );

		$offered = $result->themes[0];
		$this->assertTrue( $offered->wpcom_search_slot );
		$this->assertFalse( $offered->wpcom_marketplace_tab );
		$this->assertStringContainsString(
			'checkoutBackUrl=' . rawurlencode( admin_url( 'theme-install.php?search=portfolio' ) ),
			$offered->purchase_url
		);
	}

	/**
	 * Only a keyword search's first page, with the tab on, gets partner themes.
	 *
	 * @param array $args        Themes API arguments.
	 * @param bool  $tab_enabled Whether the Marketplace tab is on.
	 * @dataProvider provide_results_left_alone
	 */
	#[DataProvider( 'provide_results_left_alone' )]
	public function test_other_results_get_no_partner_themes( array $args, bool $tab_enabled ) {
		if ( $tab_enabled ) {
			$this->enable_tab();
		}
		$this->site_has_plan( true );
		$this->answer_portfolio_search();

		$result = wpcom_themes_tab_splice_search_partners(
			(object) array(
				'info'   => array( 'results' => 1 ),
				'themes' => array( (object) array( 'slug' => 'from-wporg' ) ),
			),
			'query_themes',
			(object) $args
		);

		$this->assertSame( array( 'from-wporg' ), array_column( $result->themes, 'slug' ) );
		$this->assertSame( 1, $result->info['results'] );
	}

	/**
	 * Requests that must come back as they went in.
	 *
	 * @return array<string, array{0: array, 1: bool}>
	 */
	public static function provide_results_left_alone(): array {
		return array(
			'a later page'         => array(
				array(
					'search' => 'portfolio',
					'page'   => 2,
				),
				true,
			),
			'a term too short'     => array( array( 'search' => 'po' ), true ),
			'a browse tab'         => array( array( 'browse' => 'popular' ), true ),
			'the tab switched off' => array( array( 'search' => 'portfolio' ), false ),
		);
	}

	/**
	 * Answers the catalog with a free and a partner theme.
	 *
	 * @return object A core tab's result: WordPress.org's copies of both, then a theme only it lists.
	 */
	private function answer_with_twins() {
		$this->answer_with_themes(
			array(
				array_merge(
					self::THEME,
					array(
						'id'         => 'twentytwentyfive',
						'name'       => 'Twenty Twenty-Five',
						'theme_tier' => array( 'slug' => 'free' ),
					)
				),
				array_merge(
					self::THEME,
					array(
						'id'         => 'restaurant-block',
						'theme_tier' => array( 'slug' => 'partner' ),
					)
				),
			)
		);

		return (object) array(
			'info'   => array( 'results' => 3 ),
			'themes' => array(
				(object) array( 'slug' => 'twentytwentyfive' ),
				(object) array( 'slug' => 'restaurant-block' ),
				(object) array( 'slug' => 'from-wporg' ),
			),
		);
	}

	/**
	 * On Simple, our copy of a shared theme takes the WordPress.org card's place, but not a partner theme's.
	 */
	public function test_simple_shows_our_copy_of_a_shared_theme() {
		$this->pretend_simple();
		add_filter( self::FLAG_FILTER, '__return_true' );
		$from_wporg = $this->answer_with_twins();
		$others     = array_slice( $from_wporg->themes, 1 );

		$result = wpcom_themes_tab_prefer_wpcom_copies( $from_wporg, 'query_themes' );

		$ours = $result->themes[0];
		$this->assertTrue( $ours->is_wpcom_theme );
		$this->assertSame( 'twentytwentyfive', $ours->slug );
		$this->assertSame( 'Included with plan', $ours->plan_badge );
		$this->assertFalse( $ours->wpcom_marketplace_tab );
		$this->assertSame( $others, array_slice( $result->themes, 1 ) );
		$this->assertSame( 3, $result->info['results'] );
	}

	/**
	 * Elsewhere WordPress.org's copy stays, as it does on Atomic.
	 *
	 * @param string $host        `atomic` or `simple`.
	 * @param bool   $tab_enabled Whether the Marketplace tab is on.
	 * @dataProvider provide_copies_left_alone
	 */
	#[DataProvider( 'provide_copies_left_alone' )]
	public function test_wporg_copies_stay_elsewhere( string $host, bool $tab_enabled ) {
		if ( 'atomic' === $host ) {
			$this->pretend_atomic();
		} else {
			$this->pretend_simple();
		}
		if ( $tab_enabled ) {
			add_filter( self::FLAG_FILTER, '__return_true' );
		}
		$from_wporg = $this->answer_with_twins();
		$themes     = $from_wporg->themes;

		$result = wpcom_themes_tab_prefer_wpcom_copies( $from_wporg, 'query_themes' );

		$this->assertSame( $themes, $result->themes );
	}

	/**
	 * Where WordPress.org's copy is left in place.
	 *
	 * @return array<string, array{0: string, 1: bool}>
	 */
	public static function provide_copies_left_alone(): array {
		return array(
			'Atomic'                  => array( 'atomic', true ),
			'Simple with the tab off' => array( 'simple', false ),
		);
	}
}
