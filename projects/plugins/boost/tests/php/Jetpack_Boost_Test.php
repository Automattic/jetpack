<?php

namespace Automattic\Jetpack_Boost\Tests;

use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_History;
use Automattic\Jetpack_Boost\Jetpack_Boost;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Minify\Config;
use Automattic\Jetpack_Boost\Lib\Status;
use Automattic\Jetpack_Boost\Modules\Modules_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\Critical_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_State;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_Common;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_JS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Cache_Preload;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Page_Cache;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

// Include the main plugin file to load all functions and classes
require_once dirname( __DIR__, 2 ) . '/jetpack-boost.php';

/**
 * Test class for Jetpack_Boost
 *
 * @package Automattic\Jetpack_Boost\Tests
 */
class Jetpack_Boost_Test extends BaseTestCase {

	public function test_activation_runs_enabled_modules_and_skips_disabled_modules() {
		add_filter( 'jetpack_boost_connection_bypass', '__return_true' );
		( new Status( Minify_CSS::get_slug() ) )->set( true );
		( new Status( Minify_JS::get_slug() ) )->set( false );
		add_filter(
			'jetpack_boost_can_module_run',
			function ( $can_run, $module ) {
				return in_array( $module->get_slug(), array( Minify_CSS::get_slug(), Minify_JS::get_slug() ), true );
			},
			10,
			2
		);
		$activation_count = did_action( 'jetpack_boost_page_output_changed' );

		Jetpack_Boost::activate();

		$this->assertSame( 1, did_action( 'jetpack_boost_page_output_changed' ) - $activation_count );
	}

	public function test_activation_keeps_critical_css_off_when_cloud_css_is_disabled() {
		add_filter( 'jetpack_boost_connection_bypass', '__return_true' );
		add_filter( 'jetpack_boost_has_feature_cloud-critical-css', '__return_true' );
		add_filter( 'jetpack_boost_can_module_run', '__return_false' );
		( new Status( Cloud_CSS::get_slug() ) )->set( false );
		( new Status( Critical_CSS::get_slug() ) )->set( false );

		Jetpack_Boost::activate();

		$this->assertFalse( ( new Status( Critical_CSS::get_slug() ) )->get() );
	}

	/**
	 * @dataProvider provide_parent_module_status
	 * @param bool $parents_enabled Whether both minify parents are enabled.
	 */
	#[DataProvider( 'provide_parent_module_status' )]
	public function test_activation_only_runs_subfeatures_with_an_enabled_parent( $parents_enabled ) {
		add_filter( 'jetpack_boost_connection_bypass', '__return_true' );
		( new Status( Minify_CSS::get_slug() ) )->set( $parents_enabled );
		( new Status( Minify_JS::get_slug() ) )->set( $parents_enabled );
		add_filter(
			'jetpack_boost_can_module_run',
			function ( $can_run, $module ) {
				return $module->get_slug() === Minify_Common::get_slug();
			},
			10,
			2
		);
		wp_clear_scheduled_hook( 'jetpack_boost_minify_cron_cache_cleanup' );

		Jetpack_Boost::activate();

		$this->assertSame( $parents_enabled, false !== wp_next_scheduled( 'jetpack_boost_minify_cron_cache_cleanup' ) );
	}

	public static function provide_parent_module_status() {
		return array(
			'parents disabled' => array( false ),
			'parents enabled'  => array( true ),
		);
	}

	/**
	 * Test that handle_version_change removes empty string from cornerstone_pages_list
	 */
	public function test_handle_version_change_removes_empty_string_from_cornerstone_pages_list() {
		// Create an instance of Jetpack_Boost to ensure proper initialization
		$jetpack_boost = new Jetpack_Boost();

		// Trigger init to ensure all hooks are set up
		do_action( 'init' );

		// Set up the initial cornerstone_pages_list with an empty string
		$initial_pages = array( '/about', '', '/contact', '/blog' );

		// Set the data sync value
		jetpack_boost_ds_set( 'cornerstone_pages_list', $initial_pages );

		// Call handle_version_change
		$jetpack_boost->handle_version_change();

		// Get the updated cornerstone_pages_list
		$updated_pages = jetpack_boost_ds_get( 'cornerstone_pages_list' );

		// Verify that the empty string was removed but other items remain
		$this->assertIsArray( $updated_pages, 'The updated pages should be an array' );
		$this->assertNotContains( '', $updated_pages, 'Empty string should be removed from cornerstone_pages_list' );
		$this->assertContains( home_url( '/about' ), $updated_pages, 'Other pages should remain in the list' );
		$this->assertContains( home_url( '/contact' ), $updated_pages, 'Other pages should remain in the list' );
		$this->assertContains( home_url( '/blog' ), $updated_pages, 'Other pages should remain in the list' );
		$this->assertCount( 3, $updated_pages, 'Should have exactly 3 items after removing empty string' );
	}

	public function test_version_change_with_new_cache_rules_empties_both_minify_caches_but_daily_cleanup_keeps_fresh_files() {
		delete_site_option( 'jetpack_boost_minify_cache_rules_applied' );
		$files = array(
			Config::get_static_cache_dir_path() . '/0123456789.min.css',
			Config::get_legacy_cache_dir_path() . '/page-optimize-cache-0123456789',
		);
		foreach ( $files as $file ) {
			if ( ! is_dir( dirname( $file ) ) ) {
				mkdir( dirname( $file ), 0775, true );
			}
			file_put_contents( $file, 'a{color:red}' );
		}

		jetpack_boost_legacy_minify_cache_cleanup();
		jetpack_boost_minify_cache_cleanup();
		$this->assertFileExists( $files[0] );
		$this->assertFileExists( $files[1] );

		( new Jetpack_Boost() )->handle_version_change();

		$this->assertFileDoesNotExist( $files[0] );
		$this->assertFileDoesNotExist( $files[1] );
	}

	public function test_version_change_restores_missing_recurring_cornerstone_preload() {
		$boost = new Jetpack_Boost();
		$boost->setup_cron_schedules();
		( new Cache_Preload() )->setup();
		( new Status( Page_Cache::get_slug() ) )->set( true );
		wp_clear_scheduled_hook( 'jetpack_boost_preload_cornerstone' );

		$boost->handle_version_change();

		$this->assertSame( 'twicehourly', wp_get_schedule( 'jetpack_boost_preload_cornerstone' ) );
	}

	/**
	 * Test that handle_version_change does nothing when cornerstone_pages_list doesn't contain empty string
	 */
	public function test_handle_version_change_does_nothing_when_no_empty_string() {
		// Create an instance of Jetpack_Boost to ensure proper initialization
		$jetpack_boost = new Jetpack_Boost();

		// Trigger init to ensure all hooks are set up
		do_action( 'init' );

		// Set up the initial cornerstone_pages_list without an empty string
		$initial_pages = array( '/about', '/contact', '/blog' );

		// Set the data sync value
		jetpack_boost_ds_set( 'cornerstone_pages_list', $initial_pages );

		// Call handle_version_change
		$jetpack_boost->handle_version_change();

		// Get the updated cornerstone_pages_list
		$updated_pages = jetpack_boost_ds_get( 'cornerstone_pages_list' );

		// Verify that the array remains unchanged
		$this->assertIsArray( $updated_pages, 'The updated pages should be an array' );
		$this->assertEquals( array_map( 'home_url', $initial_pages ), $updated_pages, 'The array should remain unchanged when no empty string is present' );
	}

	/**
	 * Test that module status writes queue a `boost_modules` snapshot, and other writes don't.
	 *
	 * @param callable $write       Option write to run.
	 * @param bool     $expect_sync Whether a snapshot should be queued.
	 * @dataProvider provide_option_writes
	 */
	#[DataProvider( 'provide_option_writes' )]
	public function test_module_status_writes_queue_boost_modules_sync( $write, $expect_sync ) {
		add_option( 'jetpack_boost_status_minify-js', '0' );
		new Jetpack_Boost();
		remove_all_actions( 'shutdown' );

		$synced = array();
		add_action(
			'jetpack_sync_callable',
			function ( $name, $value ) use ( &$synced ) {
				$synced[] = array( $name => $value );
			},
			10,
			2
		);

		$write();
		do_action( 'shutdown' );

		$expected = $expect_sync ? array( array( 'boost_modules' => ( new Modules_Setup() )->get_status() ) ) : array();
		$this->assertEquals( $expected, $synced );
	}

	/**
	 * Data provider for test_module_status_writes_queue_boost_modules_sync.
	 *
	 * @return array
	 */
	public static function provide_option_writes() {
		return array(
			'status add'        => array(
				function () {
					add_option( 'jetpack_boost_status_page-cache', true );
				},
				true,
			),
			'status update'     => array(
				function () {
					update_option( 'jetpack_boost_status_minify-js', true );
				},
				true,
			),
			'status delete'     => array(
				function () {
					delete_option( 'jetpack_boost_status_minify-js' );
				},
				true,
			),
			'two status writes' => array(
				function () {
					update_option( 'jetpack_boost_status_minify-js', true );
					add_option( 'jetpack_boost_status_page-cache', true );
				},
				true,
			),
			'unrelated option'  => array(
				function () {
					update_option( 'blogname', 'Changed' );
				},
				false,
			),
		);
	}

	/**
	 * Test that the lazy sync callables are invocable and read current state at invocation time.
	 */
	public function test_sync_callable_whitelist_closures_are_invocable() {
		// Data_Settings only adds the filter hook once per process, but WorDBless
		// resets hooks between tests, so start from a clean slate.
		( new \Automattic\Jetpack\Sync\Data_Settings() )->empty_data_settings_and_hooks();
		new Jetpack_Boost();

		$whitelist = apply_filters( 'jetpack_sync_callable_whitelist', array() );

		foreach ( array( 'boost_modules', 'boost_latest_scores', 'boost_latest_no_boost_scores', 'critical_css_state', 'lcp_state' ) as $key ) {
			$this->assertArrayHasKey( $key, $whitelist );
			$this->assertIsCallable( $whitelist[ $key ] );
		}

		// The module status callable returns the same data as direct access.
		$this->assertEquals( ( new Modules_Setup() )->get_status(), call_user_func( $whitelist['boost_modules'] ) );

		// History is read at invocation time: an entry pushed after registration is visible.
		$this->assertNull( call_user_func( $whitelist['boost_latest_scores'] ) );
		$entry = array(
			'timestamp' => 1234567890,
			'scores'    => array(
				'mobile'  => 80,
				'desktop' => 90,
			),
		);
		( new Speed_Score_History( get_home_url() ) )->push( $entry );
		$this->assertSame( $entry, call_user_func( $whitelist['boost_latest_scores'] ) );

		// The no-boost variant reads its own, still empty, history bucket.
		$this->assertNull( call_user_func( $whitelist['boost_latest_no_boost_scores'] ) );

		// State callables return the same data as direct access.
		$this->assertEquals( ( new Critical_CSS_State() )->get(), call_user_func( $whitelist['critical_css_state'] ) );
		$this->assertEquals( ( new LCP_State() )->get(), call_user_func( $whitelist['lcp_state'] ) );
	}
}
