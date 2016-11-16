<?php
/**
 * Module Name: VideoPress
 * Module Description: Powerful, simple video hosting for WordPress
 * First Introduced: 2.5
 * Free: false
 * Requires Connection: Yes
 * Sort Order: 27
 * Module Tags: Photos and Videos
 * Feature: Writing
 * Additional Search Queries: video, videos, videopress
 */

include_once dirname( __FILE__ ) . '/videopress/utility-functions.php';
include_once dirname( __FILE__ ) . '/videopress/shortcode.php';
include_once dirname( __FILE__ ) . '/videopress/videopress.php';

// VideoPress v2
//include_once dirname( __FILE__ ) . '/videopress-v2/class.videopress-options.php';
//include_once dirname( __FILE__ ) . '/videopress-v2/class.videopress-scheduler.php';
//include_once dirname( __FILE__ ) . '/videopress-v2/class.videopress-xmlrpc.php';
//include_once dirname( __FILE__ ) . '/videopress-v2/class.videopress-cli.php';
//include_once dirname( __FILE__ ) . '/videopress-v2/class.jetpack-videopress.php';

if ( is_admin() ) {
	include_once dirname( __FILE__ ) . '/videopress/editor-media-view.php';

//	include_once dirname( __FILE__ ) . '/videopress-v2/class.videopress-edit-attachment.php';
//	include_once dirname( __FILE__ ) . '/videopress-v2/class.videopress-media-library.php';
//	include_once dirname( __FILE__ ) . '/videopress-v2/class.videopress-ajax.php';
}

