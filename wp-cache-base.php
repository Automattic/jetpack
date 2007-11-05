<?php
$known_headers = array("Last-Modified", "Expires", "Content-Type", "Content-type", "X-Pingback", "ETag", "Cache-Control", "Pragma");

if (!class_exists('CacheMeta')) {
	class CacheMeta {
		var $dynamic = false;
		var $headers = array();
		var $uri = '';
		var $post = 0;
	}
}

?>
