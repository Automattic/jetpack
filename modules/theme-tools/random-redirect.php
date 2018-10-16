<?php
/*
Plugin Name: Random Redirect
Plugin URI: https://wordpress.org/extend/plugins/random-redirect/
Description: Allows you to create a link to yourblog.example.com/?random which will redirect someone to a random post on your blog, in a StumbleUpon-like fashion.
Version: 1.2-wpcom
Author: Matt Mullenweg
Author URI: http://photomatt.net/
*/

function jetpack_matt_random_redirect() {
	// Verify that the Random Redirect plugin this code is from is not active
	// See http://plugins.trac.wordpress.org/ticket/1898
	if ( ! ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		if ( is_plugin_active( 'random-redirect/random-redirect.php' ) ) {
			return;
		}
	}

	// Set default post type.
	$post_type = get_post_type();

	// Set default category type
	if ( is_category() ) {
		$category = get_the_category();
		if ( isset( $category ) && ! empty( $category ) ) {
			$random_cat_id = $category[0]->term_id;
		}
	}

	// Set author name if we're on an author archive.
	if ( is_author() ) {
		$random_author_name  = get_the_author_meta( 'user_login' );
		$random_author_query = 'AND user_login = "' . $random_author_name . '"';
	} else {
		$random_author_query = '';
	}

	// Acceptable URL formats: /[...]/?random=[post type], /?random, /&random, /&random=1
	if ( ! isset( $_GET['random'] ) && ! in_array( strtolower( $_SERVER['REQUEST_URI'] ), array( '/&random', '/&random=1' ) ) ) {
		return;
	}

	// Ignore POST requests.
	if ( ! empty( $_POST ) ) {
		return;
	}

	// Persistent AppEngine abuse.  ORDER BY RAND is expensive.
	if ( strstr( $_SERVER['HTTP_USER_AGENT'], 'AppEngine-Google' ) ) {
		wp_die( 'Please <a href="http://en.support.wordpress.com/contact/" rel="noopener noreferrer" target="_blank">contact support</a>' );
	}

	// Set the category ID if the parameter is set.
	if ( isset( $_GET['random_cat_id'] ) ) {
		$random_cat_id = (int) $_GET['random_cat_id'];
	}

	// Change the post type if the parameter is set.
	if ( isset( $_GET['random_post_type'] ) && post_type_exists( $_GET['random_post_type'] ) ) {
		$post_type = $_GET['random_post_type'];
	}

	// Don't show a random page if 'page' isn't specified as the post type specifically.
	if ( 'page' === $post_type && is_front_page() && ! isset( $_GET['random_post_type'] ) ) {
		$post_type = 'post';
	}

	global $wpdb;

	if ( isset( $random_cat_id ) ) {
		$random_id = $wpdb->get_var( $wpdb->prepare( "SELECT DISTINCT ID FROM $wpdb->posts AS p INNER JOIN $wpdb->term_relationships AS tr ON (p.ID = tr.object_id AND tr.term_taxonomy_id = %s) INNER JOIN  $wpdb->term_taxonomy AS tt ON(tr.term_taxonomy_id = tt.term_taxonomy_id AND taxonomy = 'category') WHERE p.post_type = %s AND post_password = '' AND post_status = 'publish' %s ORDER BY RAND() LIMIT 1", $random_cat_id, $post_type, $random_author_query ) );
	} else {
		$random_id = $wpdb->get_var( $wpdb->prepare( "SELECT ID FROM $wpdb->posts WHERE post_type = %s AND post_password = '' AND post_status = 'publish' %s ORDER BY RAND() LIMIT 1", $post_type, $random_author_query ) );
	}

	$permalink = get_permalink( $random_id );
	wp_safe_redirect( $permalink );
	exit;
}

add_action( 'template_redirect', 'jetpack_matt_random_redirect' );
