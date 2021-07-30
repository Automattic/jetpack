<?php
/**
 * Custom autoloader for Jetpack Boost.
 *
 * @package automattic/jetpack-boost
 */

/**
 * This will make PHP look for \Automattic\Jetpack_Boost in the `jetpack-boost/app` directory.
 *
 * @param string $fqn - Fully qualified class name.
 */
function jetpack_boost_autoloader( $fqn ) {

	if ( strpos( $fqn, 'Automattic\Jetpack_Boost\\' ) !== 0 ) {
		return;
	}
	$app_directory = JETPACK_BOOST_DIR_PATH . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR;

	// Strip prefix from the start (ala PSR-4).
	$class_name = substr( $fqn, 25 );
	$class_name = strtolower( $class_name );
	$dir        = '';

	// Generate path based on namespace.
	$last_namespace_position = strrpos( $class_name, '\\' );
	if ( false !== $last_namespace_position ) {
		// Setup the directory name.
		$namespace = substr( $class_name, 0, $last_namespace_position );
		$namespace = str_replace( '_', '-', $namespace );
		$dir       = str_replace( '\\', DIRECTORY_SEPARATOR, $namespace ) . DIRECTORY_SEPARATOR;

		// Remove namespace from the class name.
		$class_name = substr( $class_name, $last_namespace_position + 1 );
	}

	$class_file_path = $app_directory . $dir . 'class-' . str_replace( '_', '-', $class_name ) . '.php';

	if ( file_exists( $class_file_path ) ) {
		require_once $class_file_path;
	}
}

spl_autoload_register( 'jetpack_boost_autoloader' );
