<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Has_Deactivate;
use Automattic\Jetpack_Boost\Contracts\Has_Submodules;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Modules\Modules_Index;
use Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN\Liar;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Data_Sync\Page_Cache_Entry;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Data_Sync_Actions\Clear_Page_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Data_Sync_Actions\Deactivate_WPSC;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Data_Sync_Actions\Run_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Settings;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Logger;

class Page_Cache implements Pluggable, Has_Deactivate, Has_Data_Sync, Has_Submodules, Optimization {
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

		add_action( 'jetpack_boost_module_status_updated', array( $this, 'clear_cache_on_output_changing_module_toggle' ), 10, 2 );
		add_action( 'jetpack_boost_module_status_updated', array( $this, 'delete_advanced_cache' ), 10, 2 );
		add_action( 'jetpack_boost_critical_css_invalidated', array( $this, 'invalidate_cache' ) );
		add_action( 'jetpack_boost_critical_css_generated', array( $this, 'invalidate_cache' ) );
		add_action( 'update_option_' . JETPACK_BOOST_DATASYNC_NAMESPACE . '_minify_js_excludes', array( $this, 'invalidate_cache' ) );
		add_action( 'update_option_' . JETPACK_BOOST_DATASYNC_NAMESPACE . '_minify_css_excludes', array( $this, 'invalidate_cache' ) );
		add_action( 'update_option_' . JETPACK_BOOST_DATASYNC_NAMESPACE . '_image_cdn_quality', array( $this, 'invalidate_cache' ) );
		add_action( 'update_option_jetpack_boost_status_' . Liar::get_slug(), array( $this, 'invalidate_cache' ) );
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

	/**
	 * Handles the module status updated event.
	 *
	 * @param string $module_slug The slug of the module that was updated.
	 */
	public function clear_cache_on_output_changing_module_toggle( $module_slug, $status ) {
		// Get a list of modules that can change the HTML output.
		$output_changing_modules = Modules_Index::get_modules_implementing( Changes_Page_Output::class );

		// Special case: don't clear when enabling Critical or Cloud CSS, as they will
		// be handled after generation.
		if ( $status === true ) {
			unset( $output_changing_modules['critical_css'] );
			unset( $output_changing_modules['cloud_css'] );
		}

		$slugs = array_keys( $output_changing_modules );

		if ( in_array( $module_slug, $slugs, true ) ) {
			$this->invalidate_cache();
		}
	}

	/**
	 * Handles the deactivation of the module by removing the advanced-cache.php file.
	 */
	public function delete_advanced_cache( $module_slug, $status ) {
		if ( $module_slug === 'page_cache' && ! $status ) {
			Page_Cache_Setup::delete_advanced_cache();
		}
	}

	public function invalidate_cache() {
		$cache = new Boost_Cache();
		$cache->get_storage()->invalidate( home_url(), Filesystem_Utils::DELETE_ALL );
	}

	/**
	 * Runs cleanup when the feature is deactivated.
	 */
	public static function deactivate() {
		Garbage_Collection::deactivate();
		Boost_Cache_Settings::get_instance()->set( array( 'enabled' => false ) );
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

		return true;
	}

	public static function get_slug() {
		return 'page_cache';
	}

	public function get_submodules() {
		return array(
			Cache_Preload::class,
		);
	}
}
