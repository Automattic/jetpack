<?php
/**
 * Installed plugins for tests, as get_plugins() reports them.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

/**
 * Seeds get_plugins()'s cache, so each test lists exactly the plugins it installs, without reading the plugins folder.
 */
trait Plugin_Cache {

	/**
	 * Report these plugins, and only these, from get_plugins().
	 *
	 * @param array $plugins Plugin files relative to the plugins folder, or headers keyed by file.
	 */
	private static function seed_plugin_cache( array $plugins = array() ) {
		$cache = array( '' => array() );
		foreach ( $plugins as $file => $headers ) {
			if ( is_int( $file ) ) {
				$file    = $headers;
				$headers = array( 'Name' => $file );
			}
			$folder                                = '.' === dirname( $file ) ? '' : '/' . dirname( $file );
			$cache[''][ $file ]                    = $headers;
			$cache[ $folder ][ basename( $file ) ] = $headers;
		}
		wp_cache_set( 'plugins', $cache, 'plugins' );
	}

	/**
	 * Forget the seeded plugins.
	 */
	private static function clear_plugin_cache() {
		wp_cache_delete( 'plugins', 'plugins' );
	}
}
