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
		'theme_tier'  => array( 'slug' => 'partner' ),
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
		$this->assertSame( 'partner', $theme->theme_tier );
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
	 * The tab is Atomic only, so the flag alone does not turn it on elsewhere.
	 */
	public function test_flag_alone_does_not_enable_the_tab_off_atomic() {
		add_filter( self::FLAG_FILTER, '__return_true' );

		$this->assertFalse( wpcom_themes_tab_enabled() );
	}

	/**
	 * Checkout returns to the theme once bought, and back to the tab when it is abandoned.
	 *
	 * Both are query values rather than paths, so both are encoded.
	 */
	public function test_checkout_returns_to_the_theme_it_was_bought_for() {
		$url = wpcom_themes_tab_checkout_url( 'example-bundle', 'example' );

		$this->assertStringContainsString( 'https://wordpress.com/checkout/example.org/example-bundle', $url );
		$this->assertStringContainsString( 'checkoutBackUrl=' . rawurlencode( wpcom_themes_tab_url() ), $url );
		$this->assertStringContainsString(
			'redirect_to=' . rawurlencode( admin_url( 'theme-install.php?theme=example' ) ),
			$url
		);
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
	}

	/**
	 * A partner theme says nothing: a plan alone never settles whether the site may install one.
	 */
	public function test_a_partner_theme_claims_nothing() {
		$theme = wpcom_themes_tab_add_plan(
			(object) array(
				'slug'       => 'example',
				'theme_tier' => 'partner',
			)
		);

		$this->assertFalse( isset( $theme->plan_badge ) );
		$this->assertFalse( isset( $theme->upgrade_url ) );
	}
}
