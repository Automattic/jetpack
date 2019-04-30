<?php

/**
 * Legacy functions
 */

/**
 * Returns the location of Jetpack's lib directory. This filter is applied
 * in require_lib().
 *
 * @since 4.0.2
 *
 * @return string Location of Jetpack library directory.
 *
 * @filter require_lib_dir
 */
function jetpack_require_lib_dir() {
	return JETPACK__PLUGIN_DIR . '_inc/lib';
}

add_filter( 'jetpack_require_lib_dir', 'jetpack_require_lib_dir' );

class Lib {

}