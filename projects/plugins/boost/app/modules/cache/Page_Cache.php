<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

use Automattic\Jetpack_Boost\Contracts\Pluggable;

/*
 * This code is shared between the autoloaded Module and advanced-cache.php loaded code.
 */
require_once __DIR__ . '/Boost_Cache_Utils.php';
require_once __DIR__ . '/Boost_Cache_Settings.php';
require_once __DIR__ . '/Boost_Cache_Setup.php';

class Page_Cache implements Pluggable {
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

	/*
	 * Sets up the advanced-cache.php file and if that works, adds the WP_CACHE
	 * define to wp-config.php
	 * These are used by WordPress to load the caching system before most of
	 * WordPress is loaded.
	 */
	public function setup() {
		if ( is_admin() && isset( $_GET['page'] ) && $_GET['page'] === 'jetpack-boost' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			Page_Cache_Setup::run_setup();
		}
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
