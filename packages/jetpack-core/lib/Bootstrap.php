<?php

/**
  * Rules:
  * - only major versions may break APIs - internal OR external (since libraries may be loaded from one instance into another)
  * - minor versions may conflict-resolve (load only one instance)
  * - major versions must be able to run alongside each other (perhaps with a warning), including versioning all public-facing REST APIs AND having non-conflicting data
  * -
  */

/**
 * TODO
 *
 * - connection
 * - API
 * - UI
 * - etc
 */


namespace Jetpack\V7\Core;

// declare as internal var because declaring const here would throw error if another
// instance of this library is already loaded
$my_version = '7.2.1';
$primary_class = '\\Jetpack\\V7\\Core\\Bootstrap';

// we need autoload = FALSE here otherwise it reports the class exists even if the class itself hasn't been defined yet
if ( class_exists( $primary_class, false ) ) {
	$reflector = new \ReflectionClass( $primary_class );
	error_log( "$primary_class was already defined in " . $reflector->getFileName() );

	$primary_class_instance = new $primary_class();

	if ( $primary_class_instance->version() !== $my_version ) {
		error_log("Multiple versions of $primary_class detected: $my_version <> " . $primary_class_instance->version() );
	}
	return;
}

class Bootstrap {
	public function version() {
		return \Jetpack\V7\Core\Constants::VERSION;
	}

	public function load() {
		// This will be used as a check if we have already loaded the plugin.
		if ( $this->loaded() ) {
			return;
		} // or raise exception??

		define( 'Jetpack_V7_Core_Loaded', true );

		// load compat
		// load constants
		// check WP version
		// etc

	}

	public function loaded() {
		return defined( 'Jetpack_V7_Core_Loaded' );
	}
}