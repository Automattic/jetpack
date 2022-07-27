<?php
/**
 * Module Name: Post List
 * Module Description: Enhance the classic view of the Admin section of your WordPress site.
 * Sort Order: 31
 * Recommendation Order: 12
 * First Introduced: $$next-version$$
 * Requires Connection: No
 * Auto Activate: No
 * Module Tags: Admin
 * Feature: Appearance
 * Additional Search Queries: post, admin, list
 *
 * @package automattic/jetpack
 */

/**
 * Initialize the post-list module.
 */
add_action( 'admin_init', array( '\Automattic\\Jetpack\\Post_List\\Post_List', 'configure' ) );
