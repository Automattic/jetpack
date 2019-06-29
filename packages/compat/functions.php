<?php

/**
 * TODO: Legacy global scope functions here
 */

add_action( 'plugins_loaded', 'jetpack_compat_require_defined_functions' );

function jetpack_compat_require_defined_functions() {
	jetpack_require_lib( 'tracks/client' );
}
