<?php
/*
 * Load code specific to importing content
 * Auto-included by ./module-extras.php
 */

function jetpack_load_import_tools() {
	if ( ! current_user_can( 'import' ) ) {
		return;
	}
	// ready to import!
}
add_action( 'admin_init', 'jetpack_load_import_tools' );
