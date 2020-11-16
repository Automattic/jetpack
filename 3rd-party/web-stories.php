<?php
/**
 * Filter to enable web stories built in open graph data from being output.
 *
 * @param bool $enabled If web stories open graph data is enabled.
 *
 * @return bool
 */
function web_stories_disable_open_graph( $enabled ) {
	$active_modules = Jetpack::get_active_modules();
	if ( in_array( 'publicize', $active_modules ) || in_array( 'sharedaddy', $active_modules ) ) {
		$enabled = false;
	}

	return $enabled;
}

add_filter( 'web_stories_enable_open_graph', 'web_stories_disable_open_graph' );
