<?php //phpcs:ignore

/**
 * TODO
 *
 * - connection
 * - API
 * - UI
 * - etc
 */

namespace \Jetpack\Core;

// declare as internal var because declaring const here would throw error if another
// instance of this library is already loaded
$version = '7.2-alpha';
$primary_class = 'Jetpack\\Core\\Bootstrap';

if ( class_exists( $primary_class ) ) {
	if ( Jetpack\Core\Bootstrap\VERSION !== $version ) {
		error_log("Multiple versions of $primary_class detected: $version <> " . Jetpack\Core\Bootstrap\VERSION );
	}
	return;
}

const VERSION = '7.2-alpha'; // can't assign from $variables :sigh:

class Bootstrap {
	public function load() {
		// This will be used as a check if we have already loaded the plugin.
		if ( defined( 'Jetpack_Core_Loaded' ) ) { return; }
		define( 'Jetpack_Core_Loaded', true );

		// Change site title.
		add_filter( 'bloginfo', array( $this, 'change_title' ), 10, 2 );
	}

	// just a test right now
	public function change_title( $title, $show ) {
		if ( 'name' === $show ) {
			return 'Changed through Library';
		}
		return $title;
	}
}

// Initialize the plugin if not already loaded.
add_action( 'init', function(){
	if ( ! defined( 'Jetpack_Core_Loaded' ) ) {
		$plugin = new Bootstrap();
		$plugin->load();
	}
});