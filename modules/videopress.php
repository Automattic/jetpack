<?php
/**
 * Module Name: VideoPress
 * Module Description: Save on hosting storage and bandwidth costs by streaming fast, ad-free video from our global network.
 * First Introduced: 2.5
 * Free: false
 * Requires Connection: Yes
 * Sort Order: 27
 * Module Tags: Photos and Videos
 * Feature: Writing
 * Additional Search Queries: video, videos, videopress, video gallery, video player, videoplayer, mobile video, vimeo, youtube, html5 video, stream
 * Plans: business, premium
 */

include_once dirname( __FILE__ ) . '/videopress/shortcode.php';
include_once dirname( __FILE__ ) . '/videopress/class.videopress-options.php';
include_once dirname( __FILE__ ) . '/videopress/class.videopress-scheduler.php';
include_once dirname( __FILE__ ) . '/videopress/class.videopress-xmlrpc.php';
include_once dirname( __FILE__ ) . '/videopress/class.videopress-cli.php';
include_once dirname( __FILE__ ) . '/videopress/class.jetpack-videopress.php';

if ( is_admin() ) {
	include_once dirname( __FILE__ ) . '/videopress/editor-media-view.php';
	include_once dirname( __FILE__ ) . '/videopress/class.videopress-edit-attachment.php';
	include_once dirname( __FILE__ ) . '/videopress/class.videopress-ajax.php';
}
