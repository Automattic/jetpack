<?php
/*
Plugin Name: Random Redirect
Plugin URI: http://wordpress.org/extend/plugins/random-redirect/
Description: Allows you to create a link to yourblog.example.com/?random which will redirect someone to a random post on your blog, in a StumbleUpon-like fashion.
Version: 1.2-wpcom
Author: Matt Mullenweg
Author URI: http://photomatt.net/
*/

function jetpack_matt_random_redirect() {
	// Verify that the Random Redirect plugin this code is from is not active
	// See http://plugins.trac.wordpress.org/ticket/1898
	require_once( ABSPATH . 'wp-admin/includes/plugin.php' );
	if( is_plugin_active( 'random-redirect/random-redirect.php' ) ) return;

	// Acceptables URL formats: /[...]/?random=[post type], /?random, /&random, /&random=1
	if ( ! isset( $_GET['random'] ) && ! in_array( strtolower( $_SERVER['REQUEST_URI'] ), array( '/&random', '/&random=1' ) ) )
		return;

	// Ignore requests that include more than just the random parameter.
	if ( ! empty( $_POST ) || ( isset( $_GET['random'] ) && count( $_GET ) > 1 ) )
		return;

	// Persistent AppEngine abuse.  ORDER BY RAND is expensive.
	if ( strstr( $_SERVER['HTTP_USER_AGENT'], 'AppEngine-Google' ) )
		wp_die( 'Please <a href="http://en.support.wordpress.com/contact/">contact support</a>' );

	// Use the post type of the current page as the context for the random lookup.
	$post_type = get_post_type();

	// /?random should always show a random post, even if the home page is a static page.
	if ( isset( $_SERVER['DOCUMENT_URI'] ) && '/' == $_SERVER['DOCUMENT_URI'] )
		$post_type = 'post';
	else
		$post_type = get_post_type();

	if ( ! $post_type )
		$post_type = 'post';

	global $wpdb;
	$random_id = $wpdb->get_var( $wpdb->prepare( "SELECT ID FROM $wpdb->posts WHERE post_type = %s AND post_password = '' AND post_status = 'publish' ORDER BY RAND() LIMIT 1", $post_type ) );
	$permalink = get_permalink( $random_id );
	wp_safe_redirect( $permalink );
	exit;
}

add_action( 'template_redirect', 'jetpack_matt_random_redirect' );
