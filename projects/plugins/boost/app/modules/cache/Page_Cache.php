<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Has_Activate;
use Automattic\Jetpack_Boost\Contracts\Has_Deactivate;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Modules\Modules_Index;
use Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress\Boost_Cache;
use Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress\Boost_Cache_Settings;
use Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress\Boost_Cache_Utils;

class Page_Cache implements Pluggable, Has_Activate, Has_Deactivate {
	/*
	 * @var array - The errors that occurred when removing the cache.
	 */
	private $removal_errors = array();

	/*
	 * The signature used to identify the advanced-cache.php file owned by Jetpack Boost.
	 */
	const ADVANCED_CACHE_SIGNATURE = 'Boost Cache Plugin';

	/**
	 * The full signature including the current version, to verify the Advanced-cache file is current.
	 */
	const ADVANCED_CACHE_VERSION = 'v0.0.2';

	/*
	 * @var Boost_Cache_Settings - The settings for the page cache.
	 */
	private $settings;

	public function __construct() {
		$this->settings = Boost_Cache_Settings::get_instance();
		register_deactivation_hook( JETPACK_BOOST_PATH, array( Page_Cache_Setup::class, 'deactivate' ) );
		register_uninstall_hook( JETPACK_BOOST_PATH, array( Page_Cache_Setup::class, 'uninstall' ) );
	}

	public function setup() {
		Garbage_Collection::setup();

		add_action( 'jetpack_boost_module_status_updated', array( $this, 'handle_module_status_updated' ), 10, 2 );
		add_action( 'jetpack_boost_critical_css_invalidated', array( $this, 'invalidate_cache' ) );
		add_action( 'jetpack_boost_critical_css_generated', array( $this, 'invalidate_cache' ) );
	}

	/**
	 * Handles the module status updated event.
	 *
	 * @param string $module_slug The slug of the module that was updated.
	 */
	public function handle_module_status_updated( $module_slug, $status ) {
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

	public function invalidate_cache() {
		$cache = new Boost_Cache();
		$cache->get_storage()->invalidate( home_url(), Boost_Cache_Utils::DELETE_ALL );
	}

	/**
	 * Runs the setup when the feature is activated.
	 */
	public static function activate() {
		Page_Cache_Setup::run_setup();
		Garbage_Collection::activate();
		Boost_Cache_Settings::get_instance()->set( array( 'enabled' => true ) );
	}

	/**
	 * Runs cleanup when the feature is deactivated.
	 */
	public static function deactivate() {
		Garbage_Collection::deactivate();
		Boost_Cache_Settings::get_instance()->set( array( 'enabled' => false ) );
	}

	public static function is_available() {
		if ( ! defined( 'BOOST_CACHE' ) ) {
			return false;
		}
		return true;
	}

	public static function get_slug() {
		return 'page_cache';
	}
}
