<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

use Automattic\Jetpack_Boost\Contracts\Has_Activate;
use Automattic\Jetpack_Boost\Contracts\Has_Deactivate;
use Automattic\Jetpack_Boost\Contracts\Pluggable;

/*
 * This code is shared between the autoloaded Module and advanced-cache.php loaded code.
 */
require_once __DIR__ . '/Boost_Cache_Utils.php';
require_once __DIR__ . '/Boost_Cache_Settings.php';
require_once __DIR__ . '/Page_Cache_Setup.php';

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
	 * @var array - The settings for the page cache.
	 */
	private $settings;

	public function __construct() {
		$this->settings = Boost_Cache_Settings::get_instance();
		register_deactivation_hook( JETPACK_BOOST_PATH, array( Page_Cache_Setup::class, 'deactivate' ) );
		register_uninstall_hook( JETPACK_BOOST_PATH, array( Page_Cache_Setup::class, 'uninstall' ) );
	}

	public function setup() {}

	/**
	 * Runs the setup when the feature is activated.
	 */
	public static function activate() {
		Page_Cache_Setup::run_setup();
	}

	/**
	 * Runs cleanup when the feature is deactivated.
	 */
	public static function deactivate() {
		Page_Cache_Setup::deactivate();
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
