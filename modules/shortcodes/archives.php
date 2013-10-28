<?php

/*
 * Archives shortcode
 * @author bubel & nickmomrik
 * [archives limit=10]
 */

add_shortcode( 'archives', 'archives_shortcode' );

function archives_shortcode( $attr ) {
	if ( is_feed() )
		return '[archives]';

	global $allowedposttags;

	$default_atts = array(
		'type'      => 'postbypost',
		'limit'     => '',
		'format'    => 'html',
		'showcount' => false,
		'before'    => '',
		'after'     => '',
		'order'     => 'desc',
	);
	extract( shortcode_atts( $default_atts, $attr ) );

	if ( !in_array( $type, array( 'yearly', 'monthly', 'daily', 'weekly', 'postbypost' ) ) )
		$type = 'postbypost';

	if ( !in_array( $format, array( 'html', 'option', 'custom' ) ) )
		$format =  'html';

	if ( '' != $limit )
		$limit = (int)$limit;

	$showcount = (bool)$showcount;
	$before = wp_kses( $before, $allowedposttags );
	$after = wp_kses( $after, $allowedposttags );

	// Get the archives
	$archives = wp_get_archives( array(
		'type'            => $type,
		'limit'           => $limit,
		'format'          => $format,
		'echo'            => false,
		'show_post_count' => $showcount,
		'before'          => $before,
		'after'           => $after
	) );

	if ( 'asc' == $order )
		$archives = implode( "\n", array_reverse( explode( "\n", $archives ) ) );


	// Check to see if there are any archives
	if ( empty( $archives ) )
		$archives = '<p>' . __( 'Your blog does not currently have any published posts.' , 'jetpack' ) . '</p>';
	elseif ( 'option' == $format )
		$archives = "<select name='archive-dropdown' onchange='document.location.href=this.options[this.selectedIndex].value;'><option value='" . get_permalink() . "'>--</option>" . $archives . "</select>";
	elseif ( 'html' == $format )
		$archives = '<ul>' . $archives . '</ul>';

	return $archives;
}
