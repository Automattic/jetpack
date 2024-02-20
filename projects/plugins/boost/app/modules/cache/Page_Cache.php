<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

use Automattic\Jetpack_Boost\Contracts\Changes_Output;
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

		add_action( 'jetpack_boost_module_status_updated', array( $this, 'handle_module_status_updated' ) );
		add_action( 'jetpack_boost_critical_css_invalidated', array( $this, 'invalidate_cache' ) );
		add_action( 'jetpack_boost_critical_css_generated', array( $this, 'invalidate_cache' ) );
	}

	/**
	 * Handles the module status updated event.
	 *
	 * @param string $module_slug The slug of the module that was updated.
	 */
	public function handle_module_status_updated( $module_slug ) {
		// Get a list of modules that can change the HTML output.
		$modules = Modules_Index::get_modules_implementing( Changes_Output::class );

		$slugs = array_map(
			function ( $module ) {
				return $module::get_slug();
			},
			$modules
		);

		if ( in_array( $module_slug, $slugs, true ) ) {
			$this->invalidate_cache();
		}
	}

	public function invalidate_cache() {
		$cache = new Boost_Cache();
		$cache->get_storage()->invalidate( Boost_Cache_Utils::normalize_request_uri( home_url() ), '*' );
	}

	/**
	 * Runs the setup when the feature is activated.
	 */
	public static function activate() {
		Page_Cache_Setup::run_setup();
		Garbage_Collection::activate();
	}

	/**
	 * Runs cleanup when the feature is deactivated.
	 */
	public static function deactivate() {
		Page_Cache_Setup::deactivate();
		Garbage_Collection::deactivate();
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
