<?php

/**
 * Module Name: Jetpack Comments
 * Module Description: A new comment system that has integrated social media login options.
 * First Introduced: 0:1.2.3
 * Sort Order: 2
 */

require dirname( __FILE__ ) . '/comments/comments.php';

if ( is_admin() ) {
	require dirname( __FILE__ ) . '/comments/admin.php';
}
