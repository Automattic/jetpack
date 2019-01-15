<?php

jetpack_register_extension( 'videopress', 'jetpack_register_videopress_extension' );

/**
 * Register the Jetpack Gutenberg extension that adds VideoPress support to the Core video block.
 */
function jetpack_register_videopress_extension() {
	register_block_type( 'core/video', array(
		'render_callback' => 'jetpack_render_block_core_video_with_videopress',
	) );
}

/**
 * Render the Core video block replacing the src attribute with the VideoPress URL
 *
 * @param array  $attributes Array containing the video block attributes.
 * @param string $content    String containing the video block content.
 *
 * @return string
 */
function jetpack_render_block_core_video_with_videopress( $attributes, $content ) {
	if ( ! isset( $attributes['id'] ) ) {
		return $content;
	}

	$videopress_url = videopress_get_attachment_url( $attributes['id'] );

	if ( ! $videopress_url ) {
		return $content;
	}

	return preg_replace(
		'/src="([^"]+)/',
		sprintf(
			'src="%1$s',
			esc_attr( $videopress_url )
		),
		$content,
		1
	);
}