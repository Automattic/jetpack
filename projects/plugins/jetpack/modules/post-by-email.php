<?php
/**
 * Module Name: Post by Email
 * Module Description: Publish blog posts simply by sending an email to a custom address.
 * First Introduced: 2.0
 * Sort Order: 14
 * Requires Connection: Yes
 * Requires User Connection: Yes
 * Auto Activate: No
 * Module Tags: Writing
 * Feature: Writing
 * Additional Search Queries: post by email, email
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Require the PBE Class.
 */
require_once __DIR__ . '/post-by-email/class-jetpack-post-by-email.php';

add_action( 'jetpack_modules_loaded', array( 'Jetpack_Post_By_Email', 'init' ) );
add_action( 'jetpack_unlinked_user', array( 'Jetpack_Post_By_Email', 'delete_address_copy' ) );
add_action( 'deleted_user', array( 'Jetpack_Post_By_Email', 'delete_address_copy' ) );

Jetpack::enable_module_configurable( __FILE__ );
