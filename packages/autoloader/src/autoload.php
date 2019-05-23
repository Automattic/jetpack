<?php

// autoload_wordpress.php generated by automattic/autoloader

$class_map = require_once dirname( __FILE__ ) . '/composer/autoload_classmap_package.php';

if ( ! function_exists( 'jetpack_enqueue_library' ) ) {

	global $jetpack_packages;

	if ( ! is_array( $jetpack_packages ) ) {
		$jetpack_libraries = array();
	}

	function jetpack_enqueue_library( $class_name, $version, $path ) {
		global $jetpack_packages;
		if ( ! isset( $jetpack_packages[ $class_name ] )
			 || version_compare( $jetpack_packages[ $class_name ] ['version'], $version, '<' )
		) {
			$jetpack_packages[ $class_name ] = array(
				'version' => $version,
				'path'    => $path,
			);
		}
	}
	// add the autoloader
	spl_autoload_register(
		function ( $class_name ) {
				global $jetpack_packages;
			if ( isset( $jetpack_packages[ $class_name ] ) ) {
				if ( ! did_action( 'plugins_loaded' ) ) {
					_doing_it_wrong( $class_name, 'Not all plugins have loaded yet!', '1' );
				}
					require_once $jetpack_packages[ $class_name ]['path'];
			}
		}
	);
}

foreach ( $class_map as $class_name => $map ) {
	jetpack_enqueue_library( $class_name, $map['version'], $map['path'] );
}
