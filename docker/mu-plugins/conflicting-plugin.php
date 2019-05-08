<?php

/*
 * Plugin Name: Conflicting Plugin
 * License: GPL2+
 */
error_log( 'loading conflicting plugin' );
/**
 * THIS CODE WOULD NEED TO BE DUPLICATED IN EACH PLUGIN...
 */
if ( ! function_exists( 'jetpack_enqueue_library' ) ) {
	function jetpack_enqueue_library( $class_name, $version, $path ) {
		global $jetpack_libraries;
		if ( ! is_array( $jetpack_libraries ) ) {
			$jetpack_libraries = array();
		}
		if ( ! isset( $jetpack_libraries[ $class_name ] ) ) {
			$jetpack_libraries[ $class_name ] = array();
		}
		$jetpack_libraries[ $class_name ][] = array( 'version' => $version, 'path' => $path );
	}

	// add the autoloader
	spl_autoload_register( function ($class_name) {
		global $jetpack_libraries;
		if ( ! isset( $jetpack_libraries[ $class_name ] ) ) {
			// the library is not registered try a different autoloader
			return;
		}

		if ( ! did_action( 'plugin_loaded' ) ) {
			_doing_it_wrong( $class_name , 'Not all plugins have loaded yet!' );
		}

		$initial = array_shift($jetpack_libraries[ $class_name ] );
		$max_version_info = array_reduce( $jetpack_libraries[ $class_name ], function( $carry_class_info, $class_info ) {
			if ( version_compare( $class_info['version'], $carry_class_info['version'], '>' ) ) {
				return $class_info;
			}
			return $carry_class_info;
		}, $initial );

		require_once $max_version_info['path'];
	} );
}
/**
 * END OF DUPLICATE CODE
 */

jetpack_enqueue_library( 'Jetpack', '1', plugin_dir_path( __FILE__ ) . 'conflicting-plugin/class.jetpack.php' );
jetpack_enqueue_library( 'Jetpack_Constants', '7.4', plugin_dir_path( __FILE__ ) . 'conflicting-plugin/class.jetpack-constants.php' );

add_action( 'plugins_loaded', function() {
	// This method only exits in the VERSION 7.4 of the library.
	Jetpack_Constants::log_constant( 'JETPACK__VERSION' );
} );
