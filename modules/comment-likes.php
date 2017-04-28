<?php
/**
 * Module Name: Comment Likes
 * Module Description: Inrease visitor engagement by adding a Like button to comments.
 * Sort Order: 38
 * Recommendation Order: 16
 * First Introduced: 4.8
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: General
 * Additional Search Queries: adminbar, masterbar
 */

include dirname( __FILE__ ) . '/comment-likes/comment-likes.php';

Jetpack::dns_prefetch( array(
	'//s0.wp.com',
	'//s1.wp.com',
	'//s2.wp.com',
	'//0.gravatar.com',
	'//1.gravatar.com',
	'//2.gravatar.com',
) );
