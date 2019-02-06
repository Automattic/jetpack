<?php
/**
 * Load code specific to Gutenberg blocks which are not tied to a module.
 * This file is unusual, and is not an actual `module` as such.
 * It is included in ./module-extras.php
 *
 * @package Jetpack
 */

/**
 * Load all blocks inside the modules/blocks folder.
 */
function jetpack_load_blocks() {
	$blocks_include = array();

	foreach ( Jetpack::glob_php( dirname( __FILE__ ) . '/blocks' ) as $file ) {
		$blocks_include[] = $file;
	}

	foreach ( $blocks_include as $include ) {
		include_once $include;
	}
}
jetpack_load_blocks();
