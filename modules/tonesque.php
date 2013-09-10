<?php
/**
 * Themes must declare that they support this module by adding
 * add_theme_support( 'tonesque' ); on 'after_setup_theme'.
 */
function jetpack_load_tonesque() {
	if ( current_theme_supports( 'tonesque' ) )
		jetpack_require_lib( 'tonesque' );
}
add_action( 'init', 'jetpack_load_tonesque' );
