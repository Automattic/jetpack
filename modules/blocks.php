<?php
/**
 * Load code specific to Gutenberg blocks which are not tied to a module.
 * This file is unusual, and is not an actual `module` as such.
 * It is included in ./module-extras.php
 *
 * @package Jetpack
 */

/**
 * Look for files that match our list of available Jetpack Gutenberg extensions (blocks and plugins)
 * If available, load them.
 */
function jetpack_load_blocks() {
	// Get a list of all available Jetpack Gutenberg extensions.
	$jetpack_available_blocks = Jetpack_Gutenberg::get_jetpack_gutenberg_extensions_whitelist();

	foreach ( $jetpack_available_blocks as $available_block ) {
		$block_file = JETPACK__PLUGIN_DIR . 'modules/blocks/' . $available_block . '.php';
		if ( file_exists( $block_file ) ) {
			include_once $block_file;
		}
	}
}
jetpack_load_blocks();
