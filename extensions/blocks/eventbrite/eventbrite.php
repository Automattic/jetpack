<?php
/**
 * Eventbrite Block.
 *
 * @since 8.0.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/eventbrite',
	array( 'render_callback' => 'jetpack_eventbrite_block_load_assets' )
);

/**
 * Eventbrite block registration/dependency delclaration.
 *
 * @param array  $attr    Eventbrite block attributes.
 * @param string $content Eventbrite block content.
 *
 * @return string
 */
function jetpack_eventbrite_block_load_assets( $attr, $content ) {
	wp_enqueue_script( 'eventbrite-widget', 'https://www.eventbrite.com/static/widgets/eb_widgets.js', array(), JETPACK__VERSION, true );

	return $content;
}
