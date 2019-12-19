<?php
/**
 * Archives shortcode
 *
 * @author bubel & nickmomrik
 * [archives limit=10]
 *
 * @package Jetpack
 */

add_shortcode( 'archives', 'archives_shortcode' );

/**
 * Display Archives shortcode.
 *
 * @param array $atts Shortcode attributes.
 */
function archives_shortcode( $atts ) {
	if ( is_feed() ) {
		return '[archives]';
	}

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

	$attr = shortcode_atts( $default_atts, $atts, 'archives' );

	if ( ! in_array( $attr['type'], array( 'yearly', 'monthly', 'daily', 'weekly', 'postbypost' ), true ) ) {
		$attr['type'] = 'postbypost';
	}

	if ( ! in_array( $attr['format'], array( 'html', 'option', 'custom' ), true ) ) {
		$attr['format'] = 'html';
	}

	$limit = intval( $attr['limit'] );
	// A Limit of 0 makes no sense so revert back to the default.
	if ( empty( $limit ) ) {
		$limit = '';
	}

	$showcount = ( false !== $attr['showcount'] && 'false' !== $attr['showcount'] ) ? true : false;
	$before    = wp_kses( $attr['before'], $allowedposttags );
	$after     = wp_kses( $attr['after'], $allowedposttags );

	// Get the archives.
	$archives = wp_get_archives(
		array(
			'type'            => $attr['type'],
			'limit'           => $limit,
			'format'          => $attr['format'],
			'echo'            => false,
			'show_post_count' => $showcount,
			'before'          => $before,
			'after'           => $after,
		)
	);

	if ( 'asc' === $attr['order'] ) {
		$archives = implode( "\n", array_reverse( explode( "\n", $archives ) ) );
	}

	// Check to see if there are any archives.
	if ( empty( $archives ) ) {
		$archives = '<p>' . __( 'Your blog does not currently have any published posts.', 'jetpack' ) . '</p>';
	} elseif ( 'option' === $attr['format'] ) {
		$archives = '<select name="archive-dropdown" onchange="document.location.href=this.options[this.selectedIndex].value;"><option value="' . get_permalink() . '">--</option>' . $archives . '</select>';
	} elseif ( 'html' === $attr['format'] ) {
		$archives = '<ul>' . $archives . '</ul>';
	}

	return $archives;
}
