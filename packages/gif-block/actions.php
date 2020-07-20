<?php
/**
 * Action Hooks for Gif block.
 *
 * @package automattic/jetpack-gif-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

error_log( 'loading actions' );

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
			include_once __DIR__ . '/src/gif.php';
		}
	}
);
