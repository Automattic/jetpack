<?php
/**
 * Module Name: Comment Likes
 * Module Description: Inrease visitor engagement by adding a Like button to comments.
 * Sort Order: 38
 * Recommendation Order: 16
 * First Introduced: 4.9
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: General
 * Additional Search Queries: like widget
 */

include dirname( __FILE__ ) . '/comment-likes/comment-likes.php';

Jetpack::dns_prefetch( array(
	'//widgets.wp.com',
	'//s0.wp.com',
	'//s1.wp.com',
	'//s2.wp.com',
	'//0.gravatar.com',
	'//1.gravatar.com',
	'//2.gravatar.com',
) );
