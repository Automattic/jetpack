<?php

if ( defined( 'WP_ALLOW_MULTISITE' ) )
	add_cacheaction( 'add_cacheaction', 'wp_super_cache_multisite_init' );

function wp_super_cache_multisite_init() {
	add_filter( 'wpmu_blogs_columns', 'wp_super_cache_blogs_col' );
	add_action( 'manage_sites_custom_column', 'wp_super_cache_blogs_field', 10, 2 );
	add_action( 'init', 'wp_super_cache_override_on_flag' );
}

function wp_super_cache_blogs_col( $col ) {
	$col[ 'wp_super_cache' ] = __( 'Cached', 'wp-super-cache' );
	return $col;
}

function wp_super_cache_blogs_field( $name, $blog_id ) {
	if ( $name != 'wp_super_cache' )
		return false;

	if ( isset( $_GET[ 'id' ] ) && $blog_id == $_GET[ 'id' ] ) {
		$valid_nonce = isset( $_GET[ '_wpnonce' ] ) ? wp_verify_nonce( $_GET[ '_wpnonce' ], 'wp-cache' . $_GET[ 'id' ] ) : false;
		if ( $valid_nonce && isset( $_GET[ 'action' ] ) && $_GET[ 'action' ] == 'disable_cache' ) {
			add_blog_option( $_GET[ 'id' ], 'wp_super_cache_disabled', 1 );
		} elseif ( $valid_nonce && isset( $_GET[ 'action' ] ) && $_GET[ 'action' ] == 'enable_cache' ) {
			delete_blog_option( $_GET[ 'id' ], 'wp_super_cache_disabled' );
		}
	}

	if ( get_blog_option( $blog_id, 'wp_super_cache_disabled' ) == 1 ) {
		echo "<a href='" . wp_nonce_url( add_query_arg( array( 'action' => 'enable_cache', 'id' => $blog_id ) ), 'wp-cache' . $blog_id ) . "'>" . __( 'Enable', 'wp-super-cache' ) . "</a>";
	} else {
		echo "<a href='" . wp_nonce_url( add_query_arg( array( 'action' => 'disable_cache', 'id' => $blog_id ) ), 'wp-cache' . $blog_id ) . "'>" . __( 'Disable', 'wp-super-cache' ) . "</a>";
	}
}

function wp_super_cache_multisite_notice() {
	if ( isset( $_GET[ 'page' ] ) && $_GET[ 'page' ] == 'wpsupercache' )
		echo '<div class="error"><p><strong>' . __( 'Caching has been disabled on this blog on the Network Admin Sites page.', 'wp-super-cache' ) . '</strong></p></div>';
}

function wp_super_cache_override_on_flag() {
	global $cache_enabled, $super_cache_enabled;
	if ( $cache_enabled != true )
		return false;

	if ( get_option( 'wp_super_cache_disabled' ) ) {
		$cache_enabled = false;
		$super_cache_enabled = false;
		define( 'DONOTCACHEPAGE', 1 );
		define( "SUBMITDISABLED", 'disabled style="color: #aaa" ' );
		if ( is_admin() )
			add_action( 'admin_notices', 'wp_super_cache_multisite_notice' );
	}
}

?>
