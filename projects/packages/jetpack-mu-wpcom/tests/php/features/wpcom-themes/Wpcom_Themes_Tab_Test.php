<?php
/**
 * Tests for the WordPress.com tab on the Add Themes screen.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

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
		wp_deregister_script( 'wpcom-themes-tab' );

		delete_transient( wpcom_themes_tab_cache_key( 1 ) );
		delete_transient( wpcom_themes_tab_cache_key( 2 ) );

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
		add_filter( self::FLAG_FILTER, '__return_true' );
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
	 * @param array[] $themes Themes on the page.
	 * @param int     $found  Total across all pages.
	 * @return void
	 */
	private function answer_with_themes( array $themes, $found ) {
		$this->answer_wpcom_with(
			200,
			wp_json_encode(
				array(
					'themes' => $themes,
					'found'  => $found,
				),
				JSON_UNESCAPED_SLASHES
			)
		);
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
		$this->assertStringContainsString( 'tier=' . WPCOM_THEMES_TAB_TIER, $this->requests[0] );

		$theme = $result->themes[0];
		$this->assertSame( 'organic-stax', $theme->slug );
		$this->assertSame( 'STAX', $theme->name );
		$this->assertSame( 'Organic Themes', $theme->author['display_name'] );
		$this->assertSame( self::THEME['screenshot'], $theme->screenshot_url );
		$this->assertSame( self::THEME['demo_uri'], $theme->preview_url );
	}

	/**
	 * Core's wp_ajax_query_themes() reads these without isset() guards.
	 */
	public function test_themes_have_the_fields_core_reads() {
		$this->enable_tab();
		$this->answer_with_themes( array( array( 'id' => 'sparse' ) ), 1 );

		$theme = $this->query( array( 'browse' => WPCOM_THEMES_TAB ) )->themes[0];

		foreach ( array( 'slug', 'name', 'version', 'description', 'screenshot_url', 'preview_url', 'rating', 'num_ratings', 'requires', 'requires_php' ) as $field ) {
			$this->assertObjectHasProperty( $field, $theme );
		}
		$this->assertArrayHasKey( 'display_name', $theme->author );
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
	 * Scrolling the grid asks WordPress.com for the matching page.
	 */
	public function test_passes_the_page_through() {
		$this->enable_tab();
		$this->answer_with_themes( array( self::THEME ), WPCOM_THEMES_TAB_PER_PAGE + 1 );

		$result = $this->query(
			array(
				'browse' => WPCOM_THEMES_TAB,
				'page'   => 2,
			)
		);

		$this->assertStringContainsString( 'page=2', $this->requests[0] );
		$this->assertSame( 2, $result->info['pages'] );
		$this->assertSame( WPCOM_THEMES_TAB_PER_PAGE + 1, $result->info['results'] );
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
	 * A failed read shows an empty tab, and is cached so an outage is not retried on every view.
	 */
	public function test_failure_is_empty_and_cached() {
		$this->enable_tab();
		$this->answer_wpcom_with( 500, '{}' );

		$first  = $this->query( array( 'browse' => WPCOM_THEMES_TAB ) );
		$second = $this->query( array( 'browse' => WPCOM_THEMES_TAB ) );

		$this->assertSame( array(), $first->themes );
		$this->assertSame( 0, $first->info['results'] );
		$this->assertSame( array(), $second->themes );
		$this->assertCount( 1, $this->requests );
	}

	/**
	 * A preview link loaded directly is answered with the theme, so core can open its preview.
	 */
	public function test_answers_preview_link_for_a_listed_theme() {
		$this->enable_tab();
		$this->answer_with_themes( array( self::THEME ), 1 );

		$result = $this->query( array( 'theme' => 'organic-stax' ) );

		$this->assertCount( 1, $result->themes );
		$this->assertSame( 'organic-stax', $result->themes[0]->slug );
		$this->assertSame( self::THEME['demo_uri'], $result->themes[0]->preview_url );
	}

	/**
	 * A preview link for a theme the tab does not list is left to WordPress.org.
	 */
	public function test_leaves_other_preview_links_to_core() {
		$this->enable_tab();
		$this->answer_with_themes( array( self::THEME ), 1 );

		$this->assertFalse( $this->query( array( 'theme' => 'twentytwentyfive' ) ) );
	}

	/**
	 * The lookup follows the catalog past its first page.
	 */
	public function test_finds_preview_theme_on_a_later_page() {
		$this->enable_tab();
		$later = array_merge( self::THEME, array( 'id' => 'later-theme' ) );
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $later ) {
				$this->requests[] = $url;
				$themes           = str_contains( $url, 'page=2' ) ? array( $later ) : array( self::THEME );

				return array(
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
					'body'     => wp_json_encode(
						array(
							'themes' => $themes,
							'found'  => WPCOM_THEMES_TAB_PER_PAGE + 1,
						),
						JSON_UNESCAPED_SLASHES
					),
				);
			},
			10,
			3
		);

		$result = $this->query( array( 'theme' => 'later-theme' ) );

		$this->assertSame( 'later-theme', $result->themes[0]->slug );
		$this->assertCount( 2, $this->requests );
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
}
