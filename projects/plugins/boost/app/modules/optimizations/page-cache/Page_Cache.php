<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache;

use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Has_Deactivate;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Modules\Modules_Index;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Settings;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;

class Page_Cache implements Pluggable, Has_Deactivate, Optimization {
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
		// Disable Page Cache on Atomic.
		// It already has caching enabled.
		if ( ( new Host() )->is_woa_site() ) {
			return false;
		}

		return true;
	}

	public static function get_slug() {
		return 'page_cache';
	}
}
