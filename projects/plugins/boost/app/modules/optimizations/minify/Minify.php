<?php
namespace Automattic\Jetpack_Boost\Modules\Optimizations\Minify;

use Automattic\Jetpack_Boost\Admin\Config as Boost_Admin_Config;
use Automattic\Jetpack_Boost\Contracts\Has_Activate;
use Automattic\Jetpack_Boost\Contracts\Has_Deactivate;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;

class Minify implements Pluggable, Optimization, Has_Activate, Has_Deactivate {

	/**
	 * Setup the module. This runs on every page load.
	 */
	public function setup() {
	}

	public static function get_slug() {
		return 'minify';
	}

	/**
	 * The module is ready when at least one child module is active
	 */
	public function is_ready() {
		return jetpack_boost_minify_is_enabled();
	}

	public static function is_available() {
		return true;
	}

	/**
	 * This is called when either minify module is activated
	 */
	public static function activate() {
		$setup_404_tester = Boost_Admin_Config::get_hosting_provider() !== 'atomic' && Boost_Admin_Config::get_hosting_provider() !== 'woa';
		jetpack_boost_minify_activation( $setup_404_tester );
	}

	/**
	 * This is called when either minify module is deactivated.
	 */
	public static function deactivate() {
		if ( ! jetpack_boost_minify_is_enabled() ) {
			jetpack_boost_minify_clear_scheduled_events();
		}
	}
}
