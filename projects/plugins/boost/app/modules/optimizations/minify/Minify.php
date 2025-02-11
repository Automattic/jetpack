<?php
namespace Automattic\Jetpack_Boost\Modules\Optimizations\Minify;

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
		return get_option( 'jetpack_boost_minify_active_modules', 0 ) > 0;
	}

	public static function is_available() {
		return true;
	}

	/**
	 * Called by child modules (Minify_JS, Minify_CSS) when they are activated
	 */
	public static function register_active_module() {
		$active_modules = get_option( 'jetpack_boost_minify_active_modules', 0 );
		++$active_modules;
		update_option( 'jetpack_boost_minify_active_modules', $active_modules );
		if ( $active_modules === 1 ) {
			self::activate();
		}
	}

	/**
	 * Called by child modules when they are deactivated
	 */
	public static function unregister_active_module() {
		$active_modules = get_option( 'jetpack_boost_minify_active_modules', 1 );
		--$active_modules;
		update_option( 'jetpack_boost_minify_active_modules', $active_modules < 0 ? 0 : $active_modules );
		if ( $active_modules === 0 ) {
			delete_option( 'jetpack_boost_minify_active_modules' );
			self::deactivate();
		}
	}

	/**
	 * This is called only when the module is activated.
	 */
	public static function activate() {
		jetpack_boost_minify_activation();
		jetpack_boost_404_tester();
	}

	/**
	 * This is called only when the module is deactivated.
	 */
	public static function deactivate() {
		jetpack_boost_minify_deactivation();
	}
}
