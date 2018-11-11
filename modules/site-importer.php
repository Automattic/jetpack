<?php
/*
 * Load code specific to importing content
 * Auto-included by ./module-extras.php
 */

function jetpack_load_import_tools() {
	l( 'ready to import!' );
}
add_action( 'init', 'jetpack_load_import_tools' );
