<?php
/**
 * Filter to enable web stories built in open graph data from being output.
 *
 * @param bool $enabled If web stories open graph data is enabled.
 *
 * @return bool
 */
function web_stories_disable_open_graph( $enabled ) {
	$jetpack_enabled = apply_filters( 'jetpack_enable_open_graph', false );
	$active_modules  = Jetpack::get_active_modules();
	if ( $jetpack_enabled || in_array( 'publicize', $active_modules ) || in_array( 'sharedaddy', $active_modules ) ) {
		$enabled = false;
	}

	return $enabled;
}

add_filter( 'web_stories_enable_open_graph_metadata', 'web_stories_disable_open_graph' );
add_filter( 'web_stories_enable_twitter_metadata', 'web_stories_disable_open_graph' );
