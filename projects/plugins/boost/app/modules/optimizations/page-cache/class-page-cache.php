<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Has_Deactivate;
use Automattic\Jetpack_Boost\Contracts\Needs_To_Be_Ready;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Lib\Cache_Compatibility;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Data_Sync\Page_Cache_Entry;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Data_Sync_Actions\Clear_Page_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Data_Sync_Actions\Deactivate_WPSC;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Data_Sync_Actions\Run_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Settings;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Logger;

class Page_Cache implements Feature, Has_Deactivate, Has_Data_Sync, Optimization, Needs_To_Be_Ready {
	/**
	 * @var array - The errors that occurred when removing the cache.
	 */
	private $removal_errors = array();

	/**
	 * The signature used to identify the advanced-cache.php file owned by Jetpack Boost.
	 */
	const ADVANCED_CACHE_SIGNATURE = 'Boost Cache Plugin';

	/**
	 * The full signature including the current version, to verify the Advanced-cache file is current.
	 */
	const ADVANCED_CACHE_VERSION = 'v0.0.3';

	/**
	 * @var Boost_Cache_Settings - The settings for the page cache.
	 */
	private $settings;

	public function __construct() {
		$this->settings = Boost_Cache_Settings::get_instance();
	}

	public function setup() {
		Garbage_Collection::setup();

		add_action( 'jetpack_boost_page_output_changed', array( $this, 'handle_page_output_change' ) );
	}

	public function register_data_sync( Data_Sync $instance ) {
		$page_cache_schema       = Schema::as_assoc_array(
			array(
				'bypass_patterns' => Schema::as_array( Schema::as_string() ),
				'logging'         => Schema::as_boolean(),
			)
		);
		$page_cache_error_schema = Schema::as_assoc_array(
			array(
				'code'      => Schema::as_string(),
				'message'   => Schema::as_string(),
				'dismissed' => Schema::as_boolean()->fallback( false ),
			)
		)->nullable();

		$instance->register_readonly( 'cache_debug_log', Schema::as_unsafe_any(), array( Logger::class, 'read' ) );
		$instance->register_readonly( 'cache_engine_loading', Schema::as_unsafe_any(), array( Boost_Cache::class, 'is_loaded' ) );

		$instance->register( 'page_cache', $page_cache_schema, new Page_Cache_Entry() );
		// Page Cache error
		$instance->register( 'page_cache_error', $page_cache_error_schema );

		$instance->register_action( 'page_cache', 'run-setup', Schema::as_void(), new Run_Setup() );

		$instance->register_action( 'page_cache', 'clear-page-cache', Schema::as_void(), new Clear_Page_Cache() );
		$instance->register_action( 'page_cache', 'deactivate-wpsc', Schema::as_void(), new Deactivate_WPSC() );
	}

	public function handle_page_output_change() {
		Garbage_Collection::schedule_single_garbage_collection();

		// Remove the action so it doesn't run again during the same request.
		remove_action( 'jetpack_boost_page_output_changed', array( $this, 'handle_page_output_change' ) );
	}
	/**
	 * Runs cleanup when the feature is deactivated.
	 */
	public static function deactivate() {
		Garbage_Collection::deactivate();
		Boost_Cache_Settings::get_instance()->set( array( 'enabled' => false ) );
		Page_Cache_Setup::delete_advanced_cache();
	}

	/**
	 * The module is active if cache engine is loaded.
	 *
	 * @return bool
	 */
	public function is_ready() {
		return Boost_Cache::is_loaded();
	}

	public static function is_available() {
		// Disable Page Cache on WoA and WP Cloud clients.
		// They already have caching enabled.
		if ( ( new Host() )->is_woa_site() || ( new Host() )->is_atomic_platform() ) {
			if ( Page_Cache_Setup::can_run_cache() ) {
				return true;
			}

			return false;
		}

		// Disable Page Cache on sites that have their own caching service.
		if ( Cache_Compatibility::has_cache() ) {
			return false;
		}

		return true;
	}

	public static function get_slug() {
		return 'page_cache';
	}
}
