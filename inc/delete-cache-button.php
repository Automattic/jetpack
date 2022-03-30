<?php

/**
 * Adds "Delete Cache" button in WP Toolbar.
 */
function wpsc_admin_bar_render( $wp_admin_bar ) {

	if ( ! function_exists( 'current_user_can' ) || ! is_user_logged_in() ) {
		return false;
	}

	$path_to_home = rtrim( (string) parse_url( get_option( 'home' ), PHP_URL_PATH ), '/' );
	if ( ( is_singular() || is_archive() || is_front_page() || is_search() ) && current_user_can(  'delete_others_posts' ) ) {

		$site_regex = preg_quote( $path_to_home, '`' );
		$req_uri    = preg_replace( '/[ <>\'\"\r\n\t\(\)]/', '', $_SERVER[ 'REQUEST_URI' ] );
		$path       = preg_replace( '`^' . $site_regex . '`', '', $req_uri );

		$wp_admin_bar->add_menu( array(
					'parent' => '',
					'id' => 'delete-cache',
					'title' => __( 'Delete Cache', 'wp-super-cache' ),
					'meta' => array( 'title' => __( 'Delete cache of the current page', 'wp-super-cache' ) ),
					'href' => wp_nonce_url( admin_url( 'index.php?action=delcachepage&path=' . rawurlencode( $path ) ), 'delete-cache' )
					) );
	}

	if ( is_admin() && ( wpsupercache_site_admin() || current_user_can( 'delete_others_posts' ) ) ) {
		$wp_admin_bar->add_menu( array(
					'parent' => '',
					'id' => 'delete-cache',
					'title' => __( 'Delete Cache', 'wp-super-cache' ),
					'meta' => array( 'title' => __( 'Delete Super Cache cached files', 'wp-super-cache' ) ),
					'href' => wp_nonce_url( admin_url( 'index.php?admin=1&action=delcachepage&path=' . rawurlencode( trailingslashit( $path_to_home ) ) ), 'delete-cache' )
					) );
	}
}
add_action( 'admin_bar_menu', 'wpsc_admin_bar_render', 99 );

function wpsc_delete_cache_scripts() {
	if ( ! is_user_logged_in() ) {
		return;
	}
	$path_to_home = rtrim( (string) parse_url( get_option( 'home' ), PHP_URL_PATH ), '/' );

	wp_enqueue_script( 'delete-cache-button', plugins_url( '/delete-cache-button.js', __FILE__ ), array('jquery'), '1.0', 1 );

	if ( ( is_singular() || is_archive() || is_front_page() || is_search() ) && current_user_can(  'delete_others_posts' ) ) {
		$site_regex   = preg_quote( $path_to_home, '`' );
		$req_uri      = preg_replace( '/[ <>\'\"\r\n\t\(\)]/', '', $_SERVER[ 'REQUEST_URI' ] );
		$path_to_home = preg_replace( '`^' . $site_regex . '`', '', $req_uri );
		$admin        = 0;
	} else {
		$admin = 1;
	}

	if ( $path_to_home === '' ) {
		$path_to_home = '/';
	}

	$nonce = wp_create_nonce( 'delete-cache-' . rawurlencode( $path_to_home ) . '_' . $admin );
	wp_localize_script( 'delete-cache-button', 'wpsc_ajax', array( 'ajax_url' => admin_url( 'admin-ajax.php' ), 'path' => $path_to_home, 'admin' => $admin, 'nonce' => $nonce ) );
}
add_action( 'wp_ajax_ajax-delete-cache', 'wpsc_admin_bar_delete_cache' );
add_action( 'wp_enqueue_scripts', 'wpsc_delete_cache_scripts' );
add_action( 'admin_enqueue_scripts', 'wpsc_delete_cache_scripts' );

/**
 * Delete cache for a specific page.
 */
function wpsc_admin_bar_delete_cache() {
	// response output
	header( "Content-Type: application/json" );

	if ( ! current_user_can( 'delete_others_posts' ) ) {
		return json_encode( false );
	}

	$req_path    = isset( $_POST['path'] ) ? sanitize_text_field( stripslashes( $_POST['path'] ) ) : '';
	$valid_nonce = ( $req_path && isset( $_POST['nonce'] ) ) ? wp_verify_nonce( $_POST['nonce'], 'delete-cache-' . rawurlencode( $_POST['path'] ) . '_' . $_POST['admin'] ) : false;

	$path = $valid_nonce ? realpath( trailingslashit( get_supercache_dir() . str_replace( '..', '', preg_replace( '/:.*$/', '', $req_path ) ) ) ) : false;

	if ( $path ) {
		if ( isset( $_POST['admin'] ) && (int) $_POST['admin'] === 1 ) {
			global $file_prefix;
			wp_cache_debug( 'Cleaning cache for this site.' );
			wp_cache_clean_cache( $file_prefix );
			exit;
		}
		$path           = trailingslashit( $path );
		$supercachepath = realpath( get_supercache_dir() );

		if ( false === wp_cache_confirm_delete( $path ) ||
			0 !== strpos( $path, $supercachepath )
		) {
			wp_cache_debug( 'Could not delete directory: ' . $path );
			wp_die( json_encode( 'Could not delete directory' ) );
		}

		wp_cache_debug( 'Deleting cache files in directory: ' . $path );
		wpsc_delete_files( $path );
	} else {
		wp_cache_debug( 'Could not delete directory. It does not exist: ' . esc_attr( $_POST['path'] ) );
	}
}
