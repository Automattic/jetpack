<?php
/*
 * Load module code that is needed even when a module isn't active.
 * For example, if a module shouldn't be activatable unless certain conditions are met, the code belongs in this file.
 */

// Happy Holidays!
require_once( dirname( __FILE__ ) . '/holiday-snow.php' );

// Include extra tools that aren't modules, in a filterable way
$jetpack_tools_to_include = apply_filters( 'jetpack-tools-to-include', array( 'theme-tools.php' ) );

if ( ! empty( $jetpack_tools_to_include ) ) {
	foreach ( $jetpack_tools_to_include as $tool ) {
		if ( file_exists( JETPACK__PLUGIN_DIR . '/modules/' . $tool ) ) {
			require_once( JETPACK__PLUGIN_DIR . '/modules/' . $tool );
		}
	}
}