<?php
/*
 * Including tweaks for 3rd party plugins is as simple as creating
 * a php file in the 3rd-party directory with the plugin slug as 
 * the filename. When the plugin is active in WordPress the 3rd
 * party tweaks file with the corresponding slug will automagically
 * be included and all tweaks loaded.
 */

$plugins = get_option( 'active_plugins' );
jetpack_load_3rd_party_tweaks( $plugins );

if( is_multisite() ) {
	$network_plugins = get_site_option( 'active_sitewide_plugins' );
	jetpack_load_3rd_party_tweaks( $network_plugins );
}

// Slight cleanup for resources
unset( $plugins );
unset( $network_plugins );

function jetpack_load_3rd_party_tweaks( $slugs ) {
	foreach( $slugs AS $p ) {
		$slug = explode( '/', $p );
		$slug = $slug[0];

		$file = dirname( __FILE__ ) . "/$slug.php";

		if( file_exists( $file ) ) {
			require_once( $file );
		}
	}
}
