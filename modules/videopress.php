<?php
/**
 * Module Name: VideoPress
 * Module Description: Quite possibly the easiest way to upload beautiful videos to your blog.
 * First Introduced: 2.5
 * Free: false
 * Requires Connection: Yes
 * Sort Order: 100
 * Module Tags: Photos and Videos
 */

function jetpack_load_videopress() {
	include dirname( __FILE__ ) . "/videopress/videopress.php";
}
jetpack_load_videopress();
