<?php

require __DIR__ . '/class-wpcom-global-nav.php';

function should_use_new_global_nav() {
	return true;
}
add_filter( 'wpcom_global_nav_enabled', 'should_use_new_global_nav' );

if ( should_use_new_global_nav() ) {
	new WPcom_Global_Nav();
}
