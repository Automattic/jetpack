<?php

/**
 * Jetbench allows dynamic, transient enabling/disabling and some configuration of Jetpack modules based on a cookie.
 *
 * This allows us to benchmark and debug the effect of Jetpack configuration changes without making permanent changes
 * to a site.
 *
 * TODO: generate cookie name based on shared secret?
 */

// basic idea here is to hook super early and change configuration for this request in a transient way
if ( ! isset( $_COOKIE[JETPACK__BENCHMARK_COOKIE] ) ) {
	return;
}

$cookie = $_COOKIE[JETPACK__BENCHMARK_COOKIE];

$jetbench_settings = json_decode( $cookie, true );

if ( ! $jetbench_settings ) {
	error_log("Could not JSON decode Jetpack Benchmark settings: " . $cookie );
	unset( $_COOKIE[JETPACK__BENCHMARK_COOKIE] );
	if ( ! headers_sent() ) {
		setcookie( JETPACK__BENCHMARK_COOKIE, '', time() - ( 15 * 60 ) );
	}
	return;
}

class Jetbench {
	static $force_module_statuses = array();
	static $settings;

	static function init( $settings ) {
		self::$settings = $settings;

		// after Jetpack::init is called, but before Jetpack::load_modules is called...
		add_filter( 'plugins_loaded', array( 'Jetbench', 'set_module_statuses' ) );

		// when we ask for active Jetpack modules, filter the results
		add_filter( 'option_jetpack_active_modules', array( 'Jetbench', 'filter_active_modules' ) );
	}

	static function set_module_statuses() {
		// load configuration into static variables
		$enabled_modules = array();
		$disabled_modules = array();

		foreach ( Jetpack::get_available_modules() as $module ) {
			if ( isset( self::$settings[$module] ) ) {
				// enable module based on truthiness of configuration value
				if ( self::$force_module_statuses[$module] = !! self::$settings[$module] ) {
					$enabled_modules[] = $module;
				} else {
					$disabled_modules[] = $module;
				}

				// if ( 'somename' === $module && is_array( $settings[$module] ) ) {
					// do something special with $settings[$module]
				// }
			}
		}

		if ( ! headers_sent() ) {
			if ( count( $disabled_modules ) > 0 ) {
				header( 'X-Jetbench-Module-Disabled: ' . implode( ',', $disabled_modules ) );
			}

			if ( count( $enabled_modules ) > 0 ) {
				header( 'X-Jetbench-Module-Enabled: ' . implode( ',', $enabled_modules ) );
			}
		}
	}

	static function filter_active_modules( $modules ) {
		$disabled = array();
		$enabled = array();

		foreach( self::$force_module_statuses as $module => $status ) {
			if ( $status ) {
				if ( ! in_array( $module, $modules ) ) {
					$modules[] = $module;
					$enabled[] = $module;
				}
			} else {
				while ( ( $key = array_search( $module, $modules ) ) !== false ) {
					unset( $modules[ $key ]);
					$disabled[] = $module;
				}
			}
		}

		return $modules;
	}
}

Jetbench::init( $jetbench_settings );


