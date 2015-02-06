<?php

/**
 * Digg's API is no more and support has been removed
 */

function digg_shortcode( $atts ) {
	return '';
}

add_shortcode( 'digg', 'digg_shortcode' );
