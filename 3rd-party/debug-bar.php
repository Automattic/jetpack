<?php

add_filter( 'debug_bar_panels', 'init_jetpack_search_debug_bar' );
function init_jetpack_search_debug_bar( $panels ) {
	require_once( dirname( __FILE__ ) . '/debug-bar/class.jetpack-search-debug-bar.php' );
	$panels[] = Jetpack_Search_Debug_Bar::instance();
	return $panels;
}
