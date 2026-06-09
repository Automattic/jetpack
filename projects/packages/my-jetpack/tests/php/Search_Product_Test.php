<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\My_Jetpack\Products\Search;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Rest_Products
 */
class Search_Product_Test extends TestCase {

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->install_mock_plugins();
		wp_cache_delete( 'plugins', 'plugins' );

		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$user_id );
	}

	/**
	 * Installs the mock plugin present in the test assets folder as if it was the Boost plugin
	 *
	 * @return void
	 */
	public function install_mock_plugins() {
		$plugin_dir = WP_PLUGIN_DIR . '/' . Search::$plugin_slug;
		if ( ! file_exists( $plugin_dir ) ) {
			mkdir( $plugin_dir, 0777, true );
		}
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
		}
		copy( __DIR__ . '/assets/search-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack-search/jetpack-search.php' );
		copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Tests with Jetpack active
	 */
	public function test_if_jetpack_active_return_false() {
		activate_plugin( 'jetpack/jetpack.php' );
		$this->assertTrue( Search::is_plugin_active() );
	}

	/**
	 * Tests with Search active
	 */
	public function test_if_jetpack_inactive_and_search_active_return_true() {
		deactivate_plugins( 'jetpack/jetpack.php' );
		activate_plugins( Search::get_installed_plugin_filename() );
		$this->assertTrue( Search::is_plugin_active() );
	}

	/**
	 * Tests with both inactive
	 */
	public function test_if_jetpack_inactive_and_search_inactive_return_false() {
		deactivate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Search::get_installed_plugin_filename() );
		$this->assertFalse( Search::is_active() );
	}

	/**
	 * Tests Search Manage URL with Search plugin
	 */
	public function test_search_manage_url_with_search() {
		deactivate_plugins( 'jetpack/jetpack.php' );
		activate_plugins( Search::get_installed_plugin_filename() );
		$this->assertSame( admin_url( 'admin.php?page=jetpack-search' ), Search::get_manage_url() );
	}

	/**
	 * Tests Search Manage URL with Jetpack plugin
	 */
	public function test_search_manage_url_with_jetpack() {
		activate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Search::get_installed_plugin_filename() );
		$this->assertSame( admin_url( 'admin.php?page=jetpack-search' ), Search::get_manage_url() );
	}

	/**
	 * Tests Search Post Activation URL with Jetpack disconected
	 */
	public function test_search_post_activation_url_with_jetpack_disconnected() {
		activate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Search::get_installed_plugin_filename() );
		$this->assertSame( '', Search::get_post_activation_url() );
	}

	/**
	 * Tests Search Post Activation URL with Search disconected
	 */
	public function test_search_post_activation_url_with_search_disconnected() {
		deactivate_plugins( 'jetpack/jetpack.php' );
		activate_plugins( Search::get_installed_plugin_filename() );
		$this->assertSame( '', Search::get_post_activation_url() );
	}

	/**
	 * Tests Search Post Activation URL with Jetpack conected
	 */
	public function test_search_post_activation_url_with_jetpack_connected() {
		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );

		activate_plugins( 'jetpack/jetpack.php' );
		deactivate_plugins( Search::get_installed_plugin_filename() );
		$this->assertSame( '', Search::get_post_activation_url() );
	}

	/**
	 * Tests Search Post Activation URL with Search conected
	 */
	public function test_search_post_activation_url_with_search_connected() {
		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );

		deactivate_plugins( 'jetpack/jetpack.php' );
		activate_plugins( Search::get_installed_plugin_filename() );
		$this->assertSame( '', Search::get_post_activation_url() );
	}

	/**
	 * Forces every outbound HTTP request to fail so the WPCOM pricing fetch errors.
	 *
	 * @return \WP_Error
	 */
	public function force_http_error() {
		return new \WP_Error( 'http_request_failed', 'Simulated WPCOM failure.' );
	}

	/**
	 * Counts outbound HTTP attempts while forcing them to fail.
	 *
	 * @var int
	 */
	private $http_error_calls = 0;

	/**
	 * Forces outbound HTTP requests to fail and tallies how many were attempted.
	 *
	 * @return \WP_Error
	 */
	public function count_http_error() {
		++$this->http_error_calls;
		return new \WP_Error( 'http_request_failed', 'Simulated WPCOM failure.' );
	}

	/**
	 * A failed pricing fetch is cached for the request, so the two callers in
	 * get_pricing_for_ui() share a single failed attempt instead of two 5s timeouts.
	 */
	public function test_failed_pricing_fetch_is_cached() {
		$this->http_error_calls = 0;
		add_filter( 'pre_http_request', array( $this, 'count_http_error' ) );

		$record_count = 987654;
		$first        = Search::get_pricing_from_wpcom( $record_count );
		$second       = Search::get_pricing_from_wpcom( $record_count );

		remove_filter( 'pre_http_request', array( $this, 'count_http_error' ) );

		$this->assertInstanceOf( \WP_Error::class, $first );
		$this->assertInstanceOf( \WP_Error::class, $second );
		$this->assertSame( 1, $this->http_error_calls );
	}

	/**
	 * When the WPCOM pricing fetch errors, the UI pricing payload should still default to
	 * the new pricing version so the dashboard renders the current grid, not the legacy view.
	 */
	public function test_get_pricing_for_ui_defaults_to_new_pricing_on_fetch_error() {
		add_filter( 'pre_http_request', array( $this, 'force_http_error' ) );

		$pricing = Search::get_pricing_for_ui();

		remove_filter( 'pre_http_request', array( $this, 'force_http_error' ) );

		$this->assertArrayHasKey( 'pricing_version', $pricing );
		$this->assertSame( '202208', $pricing['pricing_version'] );
	}

	/**
	 * When the WPCOM pricing fetch errors and no generic product pricing is available,
	 * the payload should fall back to a USD starting price so the grid renders a price.
	 */
	public function test_get_pricing_for_ui_falls_back_to_usd_starting_price_on_fetch_error() {
		add_filter( 'pre_http_request', array( $this, 'force_http_error' ) );

		$pricing = Search::get_pricing_for_ui();

		remove_filter( 'pre_http_request', array( $this, 'force_http_error' ) );

		$this->assertSame( 'USD', $pricing['currency_code'] );
		$this->assertSame( Search::FALLBACK_STARTING_PRICE_USD, $pricing['full_price'] );
		$this->assertSame( Search::FALLBACK_STARTING_PRICE_USD, $pricing['discount_price'] );
	}

	/**
	 * When the WPCOM pricing fetch errors, is_new_pricing_202208() should default to true.
	 */
	public function test_is_new_pricing_202208_true_on_fetch_error() {
		add_filter( 'pre_http_request', array( $this, 'force_http_error' ) );

		$is_new_pricing = Search::is_new_pricing_202208();

		remove_filter( 'pre_http_request', array( $this, 'force_http_error' ) );

		$this->assertTrue( $is_new_pricing );
	}

	/**
	 * Forces the WPCOM pricing fetch to succeed with a 200 carrying the new-pricing version.
	 *
	 * @return array
	 */
	public function force_pricing_success() {
		return array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'body'     => '{"pricing_version":"202208"}',
		);
	}

	/**
	 * Success-path regression test for the pricing-version comparison.
	 *
	 * PR #48892 swapped the hardcoded '202208' literal for a reference to
	 * Automattic\Jetpack\Search\Plan::JETPACK_SEARCH_NEW_PRICING_VERSION. That class ships only in the
	 * jetpack-search package, so in standalone plugins that bundle My Jetpack without it (e.g. Jetpack
	 * Boost) the success-path comparison in is_new_pricing_202208() fatals with "Class not found".
	 * The existing tests only cover the WP_Error branch, so the comparison line was never exercised.
	 * This locks in the success path against the self-owned SEARCH_NEW_PRICING_VERSION constant.
	 *
	 * Runs in a separate process so the function-static $pricings cache in get_pricing_from_wpcom()
	 * starts empty; otherwise a WP_Error cached by an earlier failure-path test (same record-count
	 * key) would be returned and the success comparison would never run.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_is_new_pricing_202208_true_on_successful_fetch() {
		unset( $_GET['new_pricing_202208'] );
		add_filter( 'pre_http_request', array( $this, 'force_pricing_success' ) );

		$is_new_pricing = Search::is_new_pricing_202208();
		$pricing        = Search::get_pricing_for_ui();

		remove_filter( 'pre_http_request', array( $this, 'force_pricing_success' ) );

		// Comparison line (the one that fataled) ran on the success path and matched the constant.
		$this->assertTrue( $is_new_pricing );
		// estimated_record_count is only set on the success branch, proving we did not fall back.
		$this->assertArrayHasKey( 'estimated_record_count', $pricing );
		$this->assertSame( '202208', $pricing['pricing_version'] );
	}

	/**
	 * The locally-owned SEARCH_NEW_PRICING_VERSION constant must stay in sync with the Search
	 * package's canonical Automattic\Jetpack\Search\Plan::JETPACK_SEARCH_NEW_PRICING_VERSION.
	 *
	 * The two are intentionally duplicated -- My Jetpack ships in standalone plugins that do not
	 * bundle jetpack-search, so this class cannot reference Search\Plan at runtime -- but they
	 * describe the same WPCOM pricing-API contract and must not drift. jetpack-search is a dev
	 * dependency of this package, so this guard runs in CI and fails if the Search package ever
	 * changes the version without updating the My Jetpack copy.
	 */
	public function test_new_pricing_version_constant_matches_search_package() {
		if ( ! class_exists( \Automattic\Jetpack\Search\Plan::class ) ) {
			$this->markTestSkipped( 'jetpack-search package not available; cannot compare constants.' );
		}

		$this->assertSame(
			\Automattic\Jetpack\Search\Plan::JETPACK_SEARCH_NEW_PRICING_VERSION,
			Search::SEARCH_NEW_PRICING_VERSION
		);
	}
}
