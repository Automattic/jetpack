<?php


// tell w3 total cache not to cache queue queries
add_filter( 'w3tc_config_default_values', 'jetpack_bypass_w3_total_cache' );

function jetpack_bypass_w3_total_cache( $default_values ) {
	$default_values['dbcache.reject.words']['default'][] = '\bjpsq_\w';
	return $default_values;
}
