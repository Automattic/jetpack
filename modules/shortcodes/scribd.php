<?php

/* Scribd Short Code
Author: Nick Momrik

[scribd id=DOCUMENT_ID key=DOCUMENT_KEY mode=MODE]
DOCUMENT_ID is an integer (also used as an object_id)
DOCUMENT_KEY is an alphanumeric hash ('-' character as well)
MODE can be 'list', 'book', 'slide', 'slideshow', or 'tile'

[scribd id=39027960 key=key-3kaiwcjqhtipf25m8tw mode=list]
*/

function scribd_shortcode_handler( $atts ) {
	$atts = shortcode_atts( array(
		'id'   => 0,
		'key'  => 0,
		'mode' => "",
	), $atts );

	$modes = array( 'list', 'book', 'slide', 'slideshow', 'tile' );

	$atts['id'] = (int) $atts['id'];
	if ( preg_match( '/^[A-Za-z0-9-]+$/', $atts['key'], $m ) ) {
		$atts['key'] = $m[0];

		if ( !in_array( $atts['mode'], $modes ) )
			$atts['mode'] = '';

		return scribd_shortcode_markup( $atts );
	} else {
		return '';
	}
}

function scribd_shortcode_markup( $atts ) {
	$markup = <<<EOD
<object id="scribd_$atts[id]" name="scribd_$atts[id]" height="500" width="100%" type="application/x-shockwave-flash" data="http://d1.scribdassets.com/ScribdViewer.swf" style="outline:none;" align="middle">
<param name="movie" value="http://d1.scribdassets.com/ScribdViewer.swf"><param name="wmode" value="opaque"> <param name="bgcolor" value="#ffffff"> <param name="allowFullScreen" value="true"> <param name="FlashVars" value="document_id=$atts[id]&access_key=$atts[key]&page=1&viewMode=$atts[mode]">
<embed id="scribd_$atts[id]" name="scribd_$atts[id]" src="http://d1.scribdassets.com/ScribdViewer.swf?document_id=$atts[id]&access_key=$atts[key]&page=1&viewMode=$atts[mode]" type="application/x-shockwave-flash" allowfullscreen="true" height="500" width="100%" wmode="opaque" bgcolor="#ffffff"></embed></object>
<div style="font-size:10px;text-align:center;width:100%"><a href="http://www.scribd.com/doc/$atts[id]">View this document on Scribd</a></div>
EOD;

	return $markup;
}

add_shortcode( 'scribd', 'scribd_shortcode_handler' );