<?php
/**
 * Google Calendar Block.
 *
 * @since 7.x
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/google-calendar',
	array( 'render_callback' => 'jetpack_google_calendar_block_load_assets' )
);

/**
 * Google Calendar block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Google Calendar block attributes.
 * @param string $content String containing the Google Calendar block content.
 *
 * @return string
 */
function jetpack_google_calendar_block_load_assets( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( 'google-calendar' );
	return $content;
}
