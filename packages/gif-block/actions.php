<?php
/**
 * Action Hooks for Gif block.
 *
 * @package automattic/jetpack-gif-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

add_filter(
	'jetpack_set_available_extensions',
	function( $list, $variation ) {
		// you can test for variation here, e.g. if ( $variation === 'experimental' ) {}
		$list[] = 'gif';
		return $list;
	},
	10,
	2
);

add_filter(
	'jetpack_get_extension_path',
	function( $path, $name ) {
		if ( 'jetpack/gif' === $name ) {
			return __DIR__ . '/src';
		}
		return $path;
	},
	10,
	2
);

add_action(
	'plugins_loaded',
	function() {
		if ( Jetpack_Gutenberg::should_load() ) {
			// @todo this actually should be based on whether an extension is available, not just on whether jetpack gutenberg is loaded
			// so maybe this belongs in a different part of the lifecycle?
			include_once __DIR__ . '/src/gif.php';
		}
	}
);
