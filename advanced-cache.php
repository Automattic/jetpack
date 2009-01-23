<?php
# WP SUPER CACHE 0.8.9
if( defined( 'WP_PLUGIN_DIR' ) ) {
	require_once( constant( 'WP_PLUGIN_DIR' ) . '/wp-super-cache/wp-cache-phase1.php' );
} else {
	require_once( 'plugins/wp-super-cache/wp-cache-phase1.php' );
}
?>
